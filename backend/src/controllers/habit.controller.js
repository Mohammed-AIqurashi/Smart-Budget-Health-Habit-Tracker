import prisma from '../lib/prisma.js';

export const getHabits = async (req, res) => {
  try {
    const { page = 1, limit = 10, metricName = '', startDate, endDate } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: req.user.id,
      ...(metricName && { metricName }),
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.habit.count({ where }),
    ]);

    res.json({
      habits,
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