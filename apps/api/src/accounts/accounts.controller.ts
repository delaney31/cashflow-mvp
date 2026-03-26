import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { LinkedAccountResponse } from '../contracts/api-responses';
import { AccountsService } from './accounts.service';

@ApiTags('accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  /**
   * @openapi
   * operationId: listAccounts
   * summary: List linked financial accounts
   */
  @Get()
  @ApiOperation({
    summary: 'List accounts',
    description: 'Linked accounts from Plaid (persisted after token exchange).',
  })
  @ApiResponse({ status: 200, description: 'Linked accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@CurrentUser() user: AuthUser): Promise<LinkedAccountResponse[]> {
    return this.accounts.list(user);
  }
}
