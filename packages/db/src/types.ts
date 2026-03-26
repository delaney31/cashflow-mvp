import type { Prisma } from '@prisma/client';

/** Transaction with AI vs user category joins (typical list/detail views). */
export type TransactionWithCategories = Prisma.TransactionGetPayload<{
  include: {
    aiCategory: true;
    userCategory: true;
    linkedAccount: true;
  };
}>;

/** Month budget with envelope lines. */
export type MonthlyBudgetWithCategories = Prisma.MonthlyBudgetGetPayload<{
  include: { categories: true };
}>;

/** Goal list rows excluding soft-deleted (apply `where: { deletedAt: null }` in queries). */
export type GoalListItem = Prisma.GoalGetPayload<{
  select: {
    id: true;
    title: true;
    type: true;
    targetAmount: true;
    currentAmount: true;
    dueDate: true;
    status: true;
    priority: true;
    archivedAt: true;
    deletedAt: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

/** Alert with resolution timestamp for inbox UI. */
export type AlertListItem = Prisma.AlertGetPayload<{
  select: {
    id: true;
    severity: true;
    alertType: true;
    title: true;
    body: true;
    resolvedAt: true;
    createdAt: true;
  };
}>;

/** Scenario run stored with structured JSON inputs and optional model outputs. */
export type ScenarioRun = Prisma.ScenarioGetPayload<{
  select: {
    id: true;
    name: true;
    inputs: true;
    outputs: true;
    createdAt: true;
    updatedAt: true;
  };
}>;
