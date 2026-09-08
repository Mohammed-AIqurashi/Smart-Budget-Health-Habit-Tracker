import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      monthlyBudget,
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,
      waterGoal,
      stepsGoal,
      currency,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 2000,
        calorieGoal: calorieGoal ? parseInt(calorieGoal) : 2000,
        proteinGoal: proteinGoal ? parseFloat(proteinGoal) : null,
        carbsGoal: carbsGoal ? parseFloat(carbsGoal) : null,
        fatGoal: fatGoal ? parseFloat(fatGoal) : null,
        waterGoal: waterGoal ? parseFloat(waterGoal) : null,
        stepsGoal: stepsGoal ? parseFloat(stepsGoal) : null,
        currency: currency || 'USD',
      },
      select: {
        id: true,
        email: true,
        monthlyBudget: true,
        calorieGoal: true,
        proteinGoal: true,
        carbsGoal: true,
        fatGoal: true,
        waterGoal: true,
        stepsGoal: true,
        sleepGoal: true,
        fitnessMode: true,
        currency: true,
        createdAt: true,
      },
    });

    // Create default categories for the user
    const defaultCategories = [
      { name: 'Food & Dining', type: 'expense' },
      { name: 'Transportation', type: 'expense' },
      { name: 'Housing', type: 'expense' },
      { name: 'Entertainment', type: 'expense' },
      { name: 'Shopping', type: 'expense' },
      { name: 'Health', type: 'expense' },
      { name: 'Education', type: 'expense' },
      { name: 'Other', type: 'expense' },
      { name: 'Salary', type: 'income' },
      { name: 'Freelance', type: 'income' },
      { name: 'Gift', type: 'income' },
      { name: 'Other Income', type: 'income' },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({ ...cat, userId: user.id })),
    });

    const tokens = generateTokens(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      ...tokens,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const tokens = generateTokens(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        calorieGoal: user.calorieGoal,
        proteinGoal: user.proteinGoal,
        carbsGoal: user.carbsGoal,
        fatGoal: user.fatGoal,
        waterGoal: user.waterGoal,
        stepsGoal: user.stepsGoal,
        sleepGoal: user.sleepGoal,
        fitnessMode: user.fitnessMode || 'cutting',
        currency: user.currency,
        createdAt: user.createdAt,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user.id);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};