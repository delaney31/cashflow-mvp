import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { LinkedAccountResponse } from '../contracts/api-responses';

const MOCK_ACCOUNTS: LinkedAccountResponse[] = [
  {
    id: 'la_chk_001',
    institutionId: 'inst_chase_001',
    institutionName: 'Chase',
    name: 'Checking',
    mask: '1234',
    type: 'depository',
    subtype: 'checking',
    currency: 'USD',
    status: 'ACTIVE',
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: 'la_sv_002',
    institutionId: 'inst_chase_001',
    institutionName: 'Chase',
    name: 'Savings',
    mask: '5678',
    type: 'depository',
    subtype: 'savings',
    currency: 'USD',
    status: 'ACTIVE',
    lastSyncedAt: new Date().toISOString(),
  },
];

@Injectable()
export class AccountsService {
  /**
   * @openapi
   * summary: List linked accounts (mock Plaid-linked accounts)
   */
  list(_user: AuthUser): LinkedAccountResponse[] {
    return MOCK_ACCOUNTS;
  }
}
