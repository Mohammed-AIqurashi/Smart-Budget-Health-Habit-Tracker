import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../controllers/habit.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('metricName').optional().isString(),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validate,
  getHabits
);

router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Habit log ID is required')],
  validate,
  getHabitById
);

router.post(
  '/',
  [
    body('metricName').isString().notEmpty().withMessage('Metric name is required'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a non-negative number'),
    body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid date'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be at most 500 characters'),
  ],
  validate,
  createHabit
);

router.put(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Habit log ID is required'),
    body('metricName').optional().isString().notEmpty().withMessage('Metric name cannot be empty'),
    body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a non-negative number'),
    body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid date'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be at most 500 characters'),
  ],
  validate,
  updateHabit
);

router.delete(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Habit log ID is required')],
  validate,
  deleteHabit
);

export default router;