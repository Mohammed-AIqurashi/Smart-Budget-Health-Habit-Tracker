import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number'),
    body('monthlyBudget').optional().isFloat({ min: 0 }).withMessage('Monthly budget must be a positive number'),
    body('calorieGoal').optional().isInt({ min: 500, max: 10000 }).withMessage('Calorie goal must be between 500 and 10000'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  validate,
  refreshToken
);

export default router;