import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import habitRoutes from './routes/habit.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import simulatorRoutes from './routes/simulator.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import prisma from './lib/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Budget API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // ── Self-ping keep-alive ────────────────────────────────────────────────────
  // Render free tier sleeps after 15 min of inactivity.
  // Ping our own health endpoint every 10 minutes to stay awake.
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  if (process.env.NODE_ENV !== 'development') {
    setInterval(async () => {
      try {
        const res = await fetch(`${SELF_URL}/api/health`);
        console.log(`[keep-alive] ping → ${res.status}`);
      } catch (err) {
        console.warn('[keep-alive] ping failed:', err.message);
      }
    }, 10 * 60 * 1000); // every 10 minutes
  }
});

// Graceful shutdown – close Prisma connection cleanly
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});