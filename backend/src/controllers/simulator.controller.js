import prisma from '../lib/prisma.js';
import { calculateCalorieSavings } from '../utils/calorieCalculator.js';

export const simulateSavings = async (req, res) => {
  try {
    const { cutbacks } = req.body;

    if (!cutbacks || typeof cutbacks !== 'object' || Array.isArray(cutbacks)) {
      return res.status(400).json({ message: 'Cutbacks must be an object mapping categories to percentage reductions' });
    }

    // Validate cutbacks
    for (const [category, percentage] of Object.entries(cutbacks)) {
      if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
        return res.status(400).json({
          message: `Cutback percentage for "${category}" must be between 0 and 100`,
        });
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current month's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        type: 'expense',
        timestamp: { gte: startOfMonth },
      },
    });

    // Calculate current monthly spending by category
    const monthlySpendByCategory = {};
    transactions.forEach((t) => {
      if (!monthlySpendByCategory[t.category]) {
        monthlySpendByCategory[t.category] = 0;
      }
      monthlySpendByCategory[t.category] += t.amount;
    });

    const totalMonthlySpend = Object.values(monthlySpendByCategory).reduce((a, b) => a + b, 0);

    // Calculate savings per category based on cutbacks
    const categorySavings = {};
    let totalMonthlySavings = 0;

    for (const [category, percentage] of Object.entries(cutbacks)) {
      const categorySpend = monthlySpendByCategory[category] || 0;
      const savings = (categorySpend * percentage) / 100;
      categorySavings[category] = {
        currentSpend: Math.round(categorySpend * 100) / 100,
        cutbackPercentage: percentage,
        monthlySavings: Math.round(savings * 100) / 100,
      };
      totalMonthlySavings += savings;
    }

    // Also include categories with no cutback for completeness
    for (const category of Object.keys(monthlySpendByCategory)) {
      if (!categorySavings[category]) {
        categorySavings[category] = {
          currentSpend: Math.round(monthlySpendByCategory[category] * 100) / 100,
          cutbackPercentage: 0,
          monthlySavings: 0,
        };
      }
    }

    totalMonthlySavings = Math.round(totalMonthlySavings * 100) / 100;

    // --- Calorie Savings Calculation ---
    // Fetch current month's habit logs (calories)
    const habitLogs = await prisma.habit.findMany({
      where: {
        userId: req.user.id,
        metricName: 'calories',
        timestamp: { gte: startOfMonth },
      },
    });

    // Total calories logged this month
    const totalCalories = habitLogs.reduce((sum, h) => sum + Number(h.value), 0);
    const totalFoodExpenses = monthlySpendByCategory['Food & Dining'] || 0;
    const foodDiningSpend = totalFoodExpenses;
    const foodDiningReduction = cutbacks['Food & Dining'] || 0;

    // Only calculate calorie savings when Food & Dining reduction > 0%
    let calorieSavings = null;
    if (foodDiningReduction > 0 && totalCalories > 0 && totalFoodExpenses > 0) {
      calorieSavings = calculateCalorieSavings(foodDiningSpend, totalCalories, totalFoodExpenses, foodDiningReduction);
    }

    // Projected savings for 3, 6, 12 months
    const projections = [3, 6, 12].map((months) => {
      const projectedSavings = totalMonthlySavings * months;
      const optimizedMonthlySpend = totalMonthlySpend - totalMonthlySavings;
      const currentProjectedSpend = totalMonthlySpend * months;
      const optimizedProjectedSpend = optimizedMonthlySpend * months;

      return {
        months,
        monthlySavings: totalMonthlySavings,
        totalSavings: Math.round(projectedSavings * 100) / 100,
        currentSpend: Math.round(currentProjectedSpend * 100) / 100,
        optimizedSpend: Math.round(optimizedProjectedSpend * 100) / 100,
        savingsPercentage: totalMonthlySpend > 0
          ? Math.round((totalMonthlySavings / totalMonthlySpend) * 1000) / 10
          : 0,
      };
    });

    // Yearly projection data for chart
    const yearlyProjection = [];
    for (let month = 1; month <= 12; month++) {
      yearlyProjection.push({
        month,
        current: Math.round(totalMonthlySpend * month * 100) / 100,
        optimized: Math.round((totalMonthlySpend - totalMonthlySavings) * month * 100) / 100,
        savings: Math.round(totalMonthlySavings * month * 100) / 100,
      });
    }

    res.json({
      currentMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
      optimizedMonthlySpend: Math.round((totalMonthlySpend - totalMonthlySavings) * 100) / 100,
      totalMonthlySavings,
      categorySavings,
      projections,
      yearlyProjection,
      currency: req.user.currency,
      calorieSavings,
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ message: 'Server error running simulation' });
  }
};
