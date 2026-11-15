import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed.js';

const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('--- Initial database setup: Seeding EduManage demo records ---');
      await seedDatabase();
      console.log('--- Database seeding complete ---');
    } else {
      console.log(`Database already seeded (${userCount} users found). Ready.`);
    }
  } catch (error) {
    console.error('Database initialization note:', error);
    // If table doesn't exist yet, seed anyway
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.error('Seeding error:', seedErr);
    }
  }
}

main()
  .catch((err) => {
    console.error('Fatal initialization error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
