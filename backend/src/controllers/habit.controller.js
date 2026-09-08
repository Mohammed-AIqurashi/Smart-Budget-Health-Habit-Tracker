import prisma from '../lib/prisma.js';

export const getHabits = async (req, res) => {
  try {
    const { page = 1, limit = 10, metricName = '', startDate, endDate } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Calculate date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      dateFilter = { gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter = { lte: new Date(endDate) };
    }

    const where = {
      userId: req.user.id,
      ...(metricName && { metricName }),
      ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
    };

    // Calculate totals across ALL habits matching the filter (independent of page/limit)
    // We only need the metricName, value, protein, carbs, fat from the matching set
    const [habits, total, allMatching] = await Promise.all([
      prisma.habit.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.habit.count({ where }),
      prisma.habit.findMany({
        where,
        select: {
          metricName: true,
          value: true,
          protein: true,
          carbs: true,
          fat: true,
        },
      }),
    ]);

    const summary = allMatching.reduce(
      (acc, h) => {
        if (h.metricName === 'calories') {
          acc.calories += h.value || 0;
          acc.protein += h.protein || 0;
          acc.carbs += h.carbs || 0;
          acc.fat += h.fat || 0;
        } else if (h.metricName === 'water') {
          acc.water += h.value || 0;
        } else if (h.metricName === 'steps') {
          acc.steps += h.value || 0;
        } else if (h.metricName === 'sleep') {
          acc.sleep += h.value || 0;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, steps: 0, sleep: 0 }
    );

    // Calculate Dynamic Daily Score based on user's active goals and fitnessMode (cutting vs bulking)
    const mode = req.user.fitnessMode || 'cutting';
    const goals = {
      calories: req.user.calorieGoal,
      protein: req.user.proteinGoal,
      carbs: req.user.carbsGoal,
      fat: req.user.fatGoal,
      water: req.user.waterGoal,
      steps: req.user.stepsGoal,
      sleep: req.user.sleepGoal,
    };

    // Base weights when all goals exist
    const baseWeights = {
      calories: 25,
      protein: 20,
      carbs: 10,
      fat: 10,
      water: 15,
      steps: 10,
      sleep: 10,
    };

    // Filter active goals (non-null and > 0)
    const activeMetrics = Object.keys(goals).filter(
      (m) => goals[m] !== null && goals[m] !== undefined && goals[m] > 0
    );

    let dailyScore = null;

    if (activeMetrics.length > 0) {
      const totalBaseWeight = activeMetrics.reduce((sum, m) => sum + baseWeights[m], 0);
      const metricScores = {};
      let totalWeightedScore = 0;

      for (const m of activeMetrics) {
        const goal = goals[m];
        const val = summary[m] || 0;
        const ratio = goal > 0 ? val / goal : 0;
        let scorePct = 0; // 0 to 1

        let calorieStatus = null; // 'exceeded' | 'under' | 'on_track'
        if (m === 'calories') {
          if (mode === 'cutting') {
            if (val === 0) {
              scorePct = 0;
              calorieStatus = 'under';
            } else if (ratio <= 1.0 && ratio >= 0.9) {
              scorePct = 1.0;
              calorieStatus = 'on_track';
            } else if (ratio < 0.9) {
              scorePct = Math.max(0, ratio / 0.9);
              calorieStatus = 'under';
            } else {
              // Exceeding calories in cutting penalizes
              scorePct = Math.max(0, 1.0 - (ratio - 1.0) * 2);
              calorieStatus = 'exceeded';
            }
          } else {
            // Bulking
            if (val === 0) {
              scorePct = 0;
              calorieStatus = 'under';
            } else if (ratio >= 1.0 && ratio <= 1.15) {
              scorePct = 1.0;
              calorieStatus = 'on_track';
            } else if (ratio < 1.0) {
              scorePct = Math.max(0, ratio);
              calorieStatus = 'under';
            } else {
              scorePct = Math.max(0.7, 1.0 - (ratio - 1.15));
              calorieStatus = 'exceeded';
            }
          }
        } else if (m === 'protein') {
          // Both cutting & bulking need protein >= 100%
          scorePct = Math.min(1.0, ratio);
        } else if (m === 'carbs' || m === 'fat') {
          if (mode === 'cutting') {
            if (ratio <= 1.0) {
              // Scale strictly from 0 to 1 based on actual consumption
              scorePct = ratio;
            } else {
              // Penalize if exceeding target
              scorePct = Math.max(0, 1.0 - (ratio - 1.0) * 1.5);
            }
          } else {
            scorePct = Math.min(1.0, ratio);
          }
        } else if (m === 'water' || m === 'steps') {
          scorePct = Math.min(1.0, ratio);
        } else if (m === 'sleep') {
          if (val === 0) {
            scorePct = 0;
          } else if (ratio >= 0.9 && ratio <= 1.15) {
            scorePct = 1.0;
          } else if (ratio < 0.9) {
            scorePct = Math.max(0, ratio / 0.9);
          } else {
            scorePct = Math.max(0.8, 1.0 - (ratio - 1.15) * 0.5);
          }
        }

        const normalizedWeight = (baseWeights[m] / totalBaseWeight) * 100;
        metricScores[m] = {
          scorePct: Math.round(scorePct * 100),
          weight: Math.round(normalizedWeight),
          current: val,
          target: goal,
          ...(calorieStatus && { calorieStatus }),
        };
        totalWeightedScore += scorePct * normalizedWeight;
      }

      // Check if day has any recorded data at all
      const hasAnyData = activeMetrics.some((m) => (summary[m] || 0) > 0);

      // Find the weakest metric to provide smart tailored feedback
      let weakestMetric = activeMetrics[0];
      let lowestScore = 200;
      for (const m of activeMetrics) {
        if (metricScores[m].scorePct < lowestScore) {
          lowestScore = metricScores[m].scorePct;
          weakestMetric = m;
        }
      }

      dailyScore = {
        score: Math.min(100, Math.round(totalWeightedScore)),
        mode,
        hasAnyData,
        activeGoalsCount: activeMetrics.length,
        weakestMetric: lowestScore < 95 ? weakestMetric : null,
        calorieStatus: metricScores.calories?.calorieStatus || null,
        metrics: metricScores,
      };
    }

    res.json({
      habits,
      summary,
      dailyScore,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Server error fetching habits' });
  }
};

export const getHabitById = async (req, res) => {
  try {
    const habit = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit log not found' });
    }

    res.json(habit);
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ message: 'Server error fetching habit log' });
  }
};

export const createHabit = async (req, res) => {
  try {
    const { metricName, value, protein, carbs, fat, cost, timestamp, note } = req.body;

    const habit = await prisma.habit.create({
      data: {
        userId: req.user.id,
        metricName,
        value: parseFloat(value),
        ...(protein !== undefined && { protein: parseFloat(protein) }),
        ...(carbs !== undefined && { carbs: parseFloat(carbs) }),
        ...(fat !== undefined && { fat: parseFloat(fat) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        note: note || null,
      },
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Server error creating habit log' });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const { metricName, value, protein, carbs, fat, cost, timestamp, note } = req.body;

    const existing = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Habit log not found' });
    }

    const habit = await prisma.habit.update({
      where: { id: req.params.id },
      data: {
        ...(metricName !== undefined && { metricName }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(protein !== undefined && { protein: parseFloat(protein) }),
        ...(carbs !== undefined && { carbs: parseFloat(carbs) }),
        ...(fat !== undefined && { fat: parseFloat(fat) }),
        ...(cost !== undefined && { cost: parseFloat(cost) }),
        ...(timestamp !== undefined && { timestamp: new Date(timestamp) }),
        ...(note !== undefined && { note }),
      },
    });

    res.json(habit);
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ message: 'Server error updating habit log' });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const existing = await prisma.habit.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Habit log not found' });
    }

    await prisma.habit.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Habit log deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Server error deleting habit log' });
  }
};