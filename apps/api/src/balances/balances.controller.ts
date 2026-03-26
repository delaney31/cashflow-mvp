import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { BalanceResponse } from '../contracts/api-responses';
import { BalancesService } from './balances.service';

@ApiTags('balances')
@ApiBearerAuth('JWT-auth')
@Controller('balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  /**
   * @openapi
   * operationId: listBalances
   * summary: Current balances snapshot
   */
  @Get()
  @ApiOperation({
    summary: 'List balances',
    description: 'Latest balance per linked account (mock snapshots).',
  })
  @ApiResponse({ status: 200, description: 'Balance rows' })
  list(@CurrentUser() user: AuthUser): BalanceResponse[] {
    return this.balances.list(user);
  }
}
