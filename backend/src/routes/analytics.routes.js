import { Router } from 'express';
import { query } from 'express-validator';
import { getDashboard, getCategoryBreakdown, getDailyTrends } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboard);

router.get(
  '/categories',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validate,
  getCategoryBreakdown
);

router.get(
  '/trends',
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  ],
  validate,
  getDailyTrends
);

export default router;