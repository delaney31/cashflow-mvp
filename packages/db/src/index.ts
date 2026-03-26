export {
  AlertSeverity,
  GoalStatus,
  GoalType,
  Prisma,
  PrismaClient,
  TransactionStatus,
} from '@prisma/client';

// Model + enum types (Prisma-generated) for consumers that import from `@cashflow/db` only.
export type {
  Alert,
  BackgroundJobLog,
  BalanceSnapshot,
  BalanceSnapshotSource,
  BudgetCategory,
  Category,
  DailyCashflowSnapshot,
  Goal,
  Institution,
  LinkedAccount,
  PlaidItem,
  PlaidWebhookDedupe,
  PushDevice,
  LinkedAccountStatus,
  MonthlyBudget,
  RecurringFrequency,
  RecurringTransaction,
  Scenario,
  Transaction,
  User,
} from '@prisma/client';

export type {
  AlertListItem,
  GoalListItem,
  MonthlyBudgetWithCategories,
  ScenarioRun,
  TransactionWithCategories,
} from './types';
