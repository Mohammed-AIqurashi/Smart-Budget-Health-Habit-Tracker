import prisma from '../lib/prisma.js';

export const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();

    // Fetch all transactions for the current month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        timestamp: { gte: startOfMonth },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Fetch all habit logs for the current month
    const habits = await prisma.habit.findMany({
      where: {
        userId: req.user.id,
        metricName: 'calories',
        timestamp: { gte: startOfMonth },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Fetch recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Calculate totals
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingBudget = req.user.monthlyBudget - totalExpenses;
    const budgetPercentage = Math.min((totalExpenses / req.user.monthlyBudget) * 100, 100);

    const averageDailySpend = totalExpenses / daysElapsed;

    // Average daily calories
    const caloriesByDay = {};
    habits.forEach((h) => {
      const day = new Date(h.timestamp).toISOString().split('T')[0];
      if (!caloriesByDay[day]) caloriesByDay[day] = 0;
      caloriesByDay[day] += h.value;
    });
    const calorieDays = Object.keys(caloriesByDay).length;
    const averageDailyCalories = calorieDays > 0
      ? Object.values(caloriesByDay).reduce((a, b) => a + b, 0) / calorieDays
      : 0;

    // Health & Wealth Score (0-100)
    // Components:
    // - Budget adherence: based on remaining budget percentage
    // - Calories: based on average daily calories vs goal
    // - Water & sleep: fetched separately
    const budgetAdherence = remainingBudget >= 0 ? 100 : Math.max(0, 100 + (remainingBudget / req.user.monthlyBudget) * 100);
    const calorieScore = Math.min(100, Math.max(0, (averageDailyCalories / req.user.calorieGoal) * 100));
    
    const waterLogs = await prisma.habit.findMany({
      where: { userId: req.user.id, metricName: 'water', timestamp: { gte: startOfMonth } },
    });
    const sleepLogs = await prisma.habit.findMany({
      where: { userId: req.user.id, metricName: 'sleep', timestamp: { gte: startOfMonth } },
    });
    
    const avgWater = waterLogs.length > 0 ? waterLogs.reduce((s, h) => s + h.value, 0) / waterLogs.length : 0;
    const avgSleep = sleepLogs.length > 0 ? sleepLogs.reduce((s, h) => s + h.value, 0) / sleepLogs.length : 0;
    const waterScore = Math.min(100, (avgWater / 8) * 100);
    const sleepScore = Math.min(100, (avgSleep / 8) * 100);
    
    const healthWealthScore = Math.round(
      budgetAdherence * 0.4 +
      calorieScore * 0.25 +
      waterScore * 0.175 +
      sleepScore * 0.175
    );

    // Category breakdown
    const categoryBreakdown = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!categoryBreakdown[t.category]) {
          categoryBreakdown[t.category] = 0;
        }
        categoryBreakdown[t.category] += t.amount;
      });

    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    // Daily trends (expenses vs calories)
    const dailyTrends = [];
    for (let day = 1; day <= daysElapsed; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(now.getFullYear(), now.getMonth(), day);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), day + 1);

      const dayExpenses = transactions
        .filter((t) => t.type === 'expense' && t.timestamp >= dayStart && t.timestamp < dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayCalories = habits
        .filter((h) => h.timestamp >= dayStart && h.timestamp < dayEnd)
        .reduce((sum, h) => sum + h.value, 0);

      dailyTrends.push({
        date: dateStr,
        day: day,
        expenses: Math.round(dayExpenses * 100) / 100,
        calories: Math.round(dayCalories),
      });
    }

    // Projected monthly spend
    const projectedMonthlySpend = daysElapsed > 0
      ? (totalExpenses / daysElapsed) * daysInMonth
      : 0;

    res.json({
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        remainingBudget: Math.round(remainingBudget * 100) / 100,
        budgetPercentage: Math.round(budgetPercentage * 100) / 100,
        averageDailySpend: Math.round(averageDailySpend * 100) / 100,
        averageDailyCalories: Math.round(averageDailyCalories),
        calorieGoal: req.user.calorieGoal,
        monthlyBudget: req.user.monthlyBudget,
        currency: req.user.currency,
        projectedMonthlySpend: Math.round(projectedMonthlySpend * 100) / 100,
        daysElapsed,
        daysInMonth,
        healthWealthScore,
      },
      categoryBreakdown: categoryData,
      dailyTrends,
      recentTransactions,
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard analytics' });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {
      userId: req.user.id,
      type: 'expense',
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const transactions = await prisma.transaction.findMany({ where });

    const breakdown = {};
    transactions.forEach((t) => {
      if (!breakdown[t.category]) breakdown[t.category] = 0;
      breakdown[t.category] += t.amount;
    });

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    const data = Object.entries(breakdown).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }));

    res.json({ breakdown: data, total: Math.round(total * 100) / 100 });
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ message: 'Server error fetching category breakdown' });
  }
};

export const getDailyTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const [transactions, habits] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: req.user.id,
          timestamp: { gte: startDate },
        },
      }),
      prisma.habit.findMany({
        where: {
          userId: req.user.id,
          metricName: 'calories',
          timestamp: { gte: startDate },
        },
      }),
    ]);

    const trends = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayExpenses = transactions
        .filter((t) => t.type === 'expense' && t.timestamp >= dayStart && t.timestamp < dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayCalories = habits
        .filter((h) => h.timestamp >= dayStart && h.timestamp < dayEnd)
        .reduce((sum, h) => sum + h.value, 0);

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        expenses: Math.round(dayExpenses * 100) / 100,
        calories: Math.round(dayCalories),
      });
    }

    res.json({ trends });
  } catch (error) {
    console.error('Daily trends error:', error);
    res.status(500).json({ message: 'Server error fetching daily trends' });
  }
};