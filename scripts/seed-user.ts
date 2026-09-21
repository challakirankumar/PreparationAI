import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'student@preparationai.com';
  const password = 'password123';

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: password,
      name: 'Aarav Sharma',
      phone: '+91 9876543210',
      country: 'in',
      userType: 'school-12',
      examGoal: 'jee-main',
      examGoals: JSON.stringify(['jee-main', 'jee-adv', 'bitsat']),
      examDate: '2026-04-15',
      targetScore: 240,
    },
    create: {
      email,
      passwordHash: password,
      name: 'Aarav Sharma',
      phone: '+91 9876543210',
      country: 'in',
      userType: 'school-12',
      examGoal: 'jee-main',
      examGoals: JSON.stringify(['jee-main', 'jee-adv', 'bitsat']),
      examDate: '2026-04-15',
      targetScore: 240,
    },
  });

  console.log('Seeded demo user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
