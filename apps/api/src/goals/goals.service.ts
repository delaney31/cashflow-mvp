import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { GoalResponse } from '../contracts/api-responses';

const MOCK: GoalResponse[] = [
  {
    id: 'goal_001',
    title: 'Emergency fund',
    type: 'CASH_BUFFER_TARGET',
    targetAmount: '10000.00',
    currentAmount: '6200.00',
    dueDate: '2025-12-31',
    status: 'ACTIVE',
    priority: 1,
    notes: 'Keep in high-yield savings',
    archivedAt: null,
    deletedAt: null,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'goal_002',
    title: 'Pay off card balance',
    type: 'DEBT_PAYOFF_TARGET',
    targetAmount: '3200.00',
    currentAmount: '800.00',
    dueDate: '2025-06-01',
    status: 'ACTIVE',
    priority: 2,
    notes: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: '2025-02-01T12:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class GoalsService {
  /**
   * @openapi
   * summary: User goals excluding soft-deleted (mock)
   */
  list(_user: AuthUser): GoalResponse[] {
    return MOCK.filter((g) => g.deletedAt === null);
  }
}
