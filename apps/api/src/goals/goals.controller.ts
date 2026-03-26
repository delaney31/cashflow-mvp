import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { GoalResponse } from '../contracts/api-responses';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth('JWT-auth')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  /**
   * @openapi
   * operationId: listGoals
   * summary: List active goals (non-deleted)
   */
  @Get()
  @ApiOperation({
    summary: 'List goals',
    description: 'User-managed goals; soft-deleted rows omitted (mock).',
  })
  @ApiResponse({ status: 200, description: 'Goals' })
  list(@CurrentUser() user: AuthUser): GoalResponse[] {
    return this.goals.list(user);
  }
}
