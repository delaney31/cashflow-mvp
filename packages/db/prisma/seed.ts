/**
 * Local development seed: mock JWT user + sample budget/goal.
 * Keep `SEED_USER_ID` in sync with `MOCK_USER_ID` in `apps/api/src/auth/auth.service.ts`.
 */
import { GoalStatus, GoalType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_USER_ID = 'usr_mock_mvp_001';

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    create: { id: SEED_USER_ID, email: 'demo@cashflow.app' },
    update: { email: 'demo@cashflow.app' },
  });

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  await prisma.monthlyBudget.upsert({
    where: {
      userId_year_month: { userId: SEED_USER_ID, year, month },
    },
    create: {
      userId: SEED_USER_ID,
      year,
      month,
      currency: 'USD',
      totalBudgetCap: '3500.00',
      notes: 'Seed monthly cap (local testing)',
    },
    update: {
      totalBudgetCap: '3500.00',
    },
  });

  const existingGoal = await prisma.goal.findFirst({
    where: { userId: SEED_USER_ID, title: 'Emergency fund (seed)' },
  });
  if (!existingGoal) {
    await prisma.goal.create({
      data: {
        userId: SEED_USER_ID,
        title: 'Emergency fund (seed)',
        type: GoalType.CUSTOM,
        targetAmount: '10000.00',
        currentAmount: '1200.00',
        status: GoalStatus.ACTIVE,
        priority: 5,
      },
    });
  }

  console.log(`Seed OK: user ${SEED_USER_ID}, budget ${year}-${String(month).padStart(2, '0')}, goal if missing`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
