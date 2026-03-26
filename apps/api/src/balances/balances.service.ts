import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { BalanceResponse } from '../contracts/api-responses';

const MOCK: BalanceResponse[] = [
  {
    linkedAccountId: 'la_chk_001',
    balance: '2450.32',
    currency: 'USD',
    asOf: new Date().toISOString(),
    source: 'PLAID',
  },
  {
    linkedAccountId: 'la_sv_002',
    balance: '10200.00',
    currency: 'USD',
    asOf: new Date().toISOString(),
    source: 'PLAID',
  },
];

@Injectable()
export class BalancesService {
  /**
   * @openapi
   * summary: Latest balances per linked account (mock)
   */
  list(_user: AuthUser): BalanceResponse[] {
    return MOCK;
  }
}
