import prisma from '../lib/prisma.js';

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', type = '', startDate, endDate } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { note: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(type && { type }),
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error fetching transaction' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { amount, category, type = 'expense', timestamp, note } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        category,
        type,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        note: note || null,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { amount, category, type, timestamp, note } = req.body;

    const existing = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        ...(timestamp !== undefined && { timestamp: new Date(timestamp) }),
        ...(note !== undefined && { note }),
      },
    });

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error updating transaction' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await prisma.transaction.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
};