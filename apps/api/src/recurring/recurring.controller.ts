import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { RecurringUpcomingResponse } from '../contracts/api-responses';
import { RecurringService } from './recurring.service';

@ApiTags('recurring')
@ApiBearerAuth('JWT-auth')
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurring: RecurringService) {}

  @Get('upcoming')
  @ApiOperation({
    summary: 'Upcoming recurring bills',
    description: 'Active recurring patterns ordered by next expected date (soonest first).',
  })
  @ApiResponse({ status: 200, description: 'Recurring rows' })
  upcoming(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ): Promise<RecurringUpcomingResponse[]> {
    const n = limit ? parseInt(limit, 10) : 8;
    return this.recurring.listUpcoming(user, Number.isFinite(n) ? n : 8);
  }
}
