import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { AlertResponse } from '../contracts/api-responses';

const MOCK: AlertResponse[] = [
  {
    id: 'al_001',
    severity: 'MEDIUM',
    alertType: 'SPENDING_APPROACHING_CAP',
    title: 'Groceries nearing monthly limit',
    body: 'You have spent 85% of your grocery budget.',
    resolvedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'al_002',
    severity: 'LOW',
    alertType: 'SYNC_COMPLETED',
    title: 'Accounts synced',
    body: 'Chase accounts updated successfully.',
    resolvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class AlertsService {
  /**
   * @openapi
   * summary: Alerts inbox (mock)
   */
  list(_user: AuthUser): AlertResponse[] {
    return MOCK;
  }
}
