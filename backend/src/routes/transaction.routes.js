import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('type').optional().isIn(['expense', 'income']).withMessage('Type must be expense or income'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validate,
  getTransactions
);

router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Transaction ID is required')],
  validate,
  getTransactionById
);

router.post(
  '/',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('category').isString().notEmpty().withMessage('Category is required'),
    body('type').optional().isIn(['expense', 'income']).withMessage('Type must be expense or income'),
    body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid date'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be at most 500 characters'),
  ],
  validate,
  createTransaction
);

router.put(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Transaction ID is required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('category').optional().isString().notEmpty().withMessage('Category cannot be empty'),
    body('type').optional().isIn(['expense', 'income']).withMessage('Type must be expense or income'),
    body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid date'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be at most 500 characters'),
  ],
  validate,
  updateTransaction
);

router.delete(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Transaction ID is required')],
  validate,
  deleteTransaction
);

export default router;