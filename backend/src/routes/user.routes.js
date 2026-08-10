import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getProfile,
  updateProfile,
  getCategories,
  createCategory,
  deleteCategory,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('monthlyBudget').optional().isFloat({ min: 0 }).withMessage('Monthly budget must be a positive number'),
    body('calorieGoal').optional().isInt({ min: 500, max: 10000 }).withMessage('Calorie goal must be between 500 and 10000'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  ],
  validate,
  updateProfile
);

router.get('/categories', getCategories);

router.post(
  '/categories',
  [
    body('name').isString().notEmpty().withMessage('Category name is required'),
    body('type').isIn(['expense', 'income', 'habit']).withMessage('Type must be expense, income, or habit'),
  ],
  validate,
  createCategory
);

router.delete(
  '/categories/:id',
  [param('id').isString().notEmpty().withMessage('Category ID is required')],
  validate,
  deleteCategory
);

export default router;