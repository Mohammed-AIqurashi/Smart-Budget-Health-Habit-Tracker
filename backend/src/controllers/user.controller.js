import prisma from '../lib/prisma.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        monthlyBudget: true,
        calorieGoal: true,
        currency: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { monthlyBudget, calorieGoal, currency } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(monthlyBudget !== undefined && { monthlyBudget: parseFloat(monthlyBudget) }),
        ...(calorieGoal !== undefined && { calorieGoal: parseInt(calorieGoal) }),
        ...(currency !== undefined && { currency }),
      },
      select: {
        id: true,
        email: true,
        monthlyBudget: true,
        calorieGoal: true,
        currency: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    const existing = await prisma.category.findFirst({
      where: {
        name,
        type,
        userId: req.user.id,
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId: req.user.id,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error creating category' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const existing = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error deleting category' });
  }
};