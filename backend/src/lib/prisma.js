import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Eagerly connect to the database on startup to pre-warm the connection pool.
// This prevents the first user request from paying the connection overhead.
prisma.$connect()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('❌ Database connection failed:', err));

export default prisma;