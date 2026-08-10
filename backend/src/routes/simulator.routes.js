import { Router } from 'express';
import { body } from 'express-validator';
import { simulateSavings } from '../controllers/simulator.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(protect);

router.post(
  '/',
  [
    body('cutbacks').isObject().withMessage('Cutbacks must be an object'),
  ],
  validate,
  simulateSavings
);

export default router;