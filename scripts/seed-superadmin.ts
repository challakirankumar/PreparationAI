import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Superadmin Account
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@preparationai.com' },
    update: {
      passwordHash: 'adminpassword123',
      name: 'Super Admin',
      phone: '+91 99999 88888',
      country: 'in',
      institution: 'PreparationAI Apex Institute',
      userType: 'grad',
      examGoal: 'jee-adv',
      examGoals: JSON.stringify(['jee-main', 'jee-adv', 'neet', 'upsc', 'gate']),
      examDate: '2026-05-20',
      targetScore: 320,
    },
    create: {
      email: 'admin@preparationai.com',
      passwordHash: 'adminpassword123',
      name: 'Super Admin',
      phone: '+91 99999 88888',
      country: 'in',
      institution: 'PreparationAI Apex Institute',
      userType: 'grad',
      examGoal: 'jee-adv',
      examGoals: JSON.stringify(['jee-main', 'jee-adv', 'neet', 'upsc', 'gate']),
      examDate: '2026-05-20',
      targetScore: 320,
    },
  });

  console.log('Seeded Superadmin user:', superadmin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
