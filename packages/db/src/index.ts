export { PrismaClient, Prisma } from '@prisma/client';

// Model + enum types (Prisma-generated) for consumers that import from `@cashflow/db` only.
export type {
  Alert,
  AlertSeverity,
  BalanceSnapshot,
  BalanceSnapshotSource,
  BudgetCategory,
  Category,
  DailyCashflowSnapshot,
  Goal,
  GoalStatus,
  GoalType,
  Institution,
  LinkedAccount,
  LinkedAccountStatus,
  MonthlyBudget,
  RecurringFrequency,
  RecurringTransaction,
  Scenario,
  Transaction,
  TransactionStatus,
  User,
} from '@prisma/client';

export type {
  AlertListItem,
  GoalListItem,
  MonthlyBudgetWithCategories,
  ScenarioRun,
  TransactionWithCategories,
} from './types';
