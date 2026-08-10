import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('demo1234', salt);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
      monthlyBudget: 2500,
      calorieGoal: 2200,
      currency: 'USD',
    },
  });

  console.log('✅ Demo user created:', demoUser.email);

  // Create categories
  const categories = [
    { name: 'Food & Dining', type: 'expense' },
    { name: 'Transportation', type: 'expense' },
    { name: 'Housing', type: 'expense' },
    { name: 'Entertainment', type: 'expense' },
    { name: 'Shopping', type: 'expense' },
    { name: 'Health', type: 'expense' },
    { name: 'Education', type: 'expense' },
    { name: 'Other', type: 'expense' },
    { name: 'Salary', type: 'income' },
    { name: 'Freelance', type: 'income' },
    { name: 'Gift', type: 'income' },
    { name: 'Other Income', type: 'income' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: {
        name_type_userId: {
          name: cat.name,
          type: cat.type,
          userId: demoUser.id,
        },
      },
      update: {},
      create: {
        ...cat,
        userId: demoUser.id,
      },
    });
  }

  console.log('✅ Categories created');

  // Create sample transactions for the current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const sampleTransactions = [
    { amount: 45.5, category: 'Food & Dining', type: 'expense', day: 2, note: 'Groceries at supermarket' },
    { amount: 12.0, category: 'Food & Dining', type: 'expense', day: 3, note: 'Lunch with friends' },
    { amount: 30.0, category: 'Transportation', type: 'expense', day: 4, note: 'Fuel refill' },
    { amount: 2500.0, category: 'Salary', type: 'income', day: 1, note: 'Monthly salary' },
    { amount: 85.0, category: 'Entertainment', type: 'expense', day: 5, note: 'Concert tickets' },
    { amount: 120.0, category: 'Shopping', type: 'expense', day: 6, note: 'New clothes' },
    { amount: 25.0, category: 'Health', type: 'expense', day: 7, note: 'Pharmacy' },
    { amount: 60.0, category: 'Education', type: 'expense', day: 8, note: 'Online course' },
    { amount: 18.5, category: 'Food & Dining', type: 'expense', day: 9, note: 'Coffee and snacks' },
    { amount: 40.0, category: 'Transportation', type: 'expense', day: 10, note: 'Taxi rides' },
    { amount: 200.0, category: 'Housing', type: 'expense', day: 1, note: 'Rent contribution' },
    { amount: 55.0, category: 'Entertainment', type: 'expense', day: 11, note: 'Movie night' },
    { amount: 35.0, category: 'Food & Dining', type: 'expense', day: 12, note: 'Dinner out' },
    { amount: 150.0, category: 'Freelance', type: 'income', day: 13, note: 'Freelance project' },
    { amount: 22.0, category: 'Shopping', type: 'expense', day: 14, note: 'Household items' },
  ];

  for (const t of sampleTransactions) {
    const timestamp = new Date(currentYear, currentMonth, t.day, 12, 0, 0);
    if (timestamp <= now) {
      await prisma.transaction.create({
        data: {
          userId: demoUser.id,
          amount: t.amount,
          category: t.category,
          type: t.type,
          timestamp,
          note: t.note,
        },
      });
    }
  }

  console.log('✅ Sample transactions created');

  // Create sample calorie logs
  const sampleCalories = [
    { value: 2100, day: 1, note: 'Balanced day' },
    { value: 2350, day: 2, note: 'Ate out for lunch' },
    { value: 1950, day: 3, note: 'Light dinner' },
    { value: 2200, day: 4, note: 'Normal day' },
    { value: 2500, day: 5, note: 'Concert snacks' },
    { value: 2050, day: 6, note: 'Home cooked meals' },
    { value: 1900, day: 7, note: 'Healthy choices' },
    { value: 2250, day: 8, note: 'Study snacks' },
    { value: 2150, day: 9, note: 'Coffee and pastries' },
    { value: 2300, day: 10, note: 'Busy day' },
    { value: 2000, day: 11, note: 'Movie popcorn' },
    { value: 2400, day: 12, note: 'Dinner out' },
    { value: 2100, day: 13, note: 'Meal prep day' },
    { value: 2200, day: 14, note: 'Regular day' },
  ];

  for (const c of sampleCalories) {
    const timestamp = new Date(currentYear, currentMonth, c.day, 20, 0, 0);
    if (timestamp <= now) {
      await prisma.habit.create({
        data: {
          userId: demoUser.id,
          metricName: 'calories',
          value: c.value,
          timestamp,
          note: c.note,
        },
      });
    }
  }

  console.log('✅ Sample calorie logs created');
  console.log('🌱 Seeding complete!');
  console.log('Demo credentials: demo@example.com / demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });