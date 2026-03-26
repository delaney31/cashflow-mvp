import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { AiExplanationResponse } from '../contracts/api-responses';
import { BudgetDashboardQueryDto } from '../budgets/dto/budget-dashboard-query.dto';
import { AiExplanationService } from './ai-explanation.service';
import { AffordabilityCoachDto } from './dto/affordability-coach.dto';
import { AiExplanationResponseDto } from './dto/ai-explanation-response.dto';

/** Stricter cap for expensive LLM routes (per user, see ThrottlerModule in AiModule). */
const AI_THROTTLE = { ai: { limit: 20, ttl: 60_000 } };

@ApiTags('ai')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
@UseGuards(ThrottlerGuard)
@Throttle(AI_THROTTLE)
export class AiController {
  constructor(private readonly ai: AiExplanationService) {}

  @Post('explain/transaction/:transactionId')
  @ApiOperation({
    summary: 'Explain a transaction',
    description:
      'Loads the transaction server-side, then asks the model to explain it using only that context.',
  })
  @ApiOkResponse({ type: AiExplanationResponseDto })
  explainTransaction(
    @CurrentUser() user: AuthUser,
    @Param('transactionId') transactionId: string,
  ): Promise<AiExplanationResponse> {
    return this.ai.explainTransaction(user, transactionId);
  }

  @Get('explain/monthly-summary')
  @ApiOperation({
    summary: 'Monthly spending summary explanation',
    description: 'Uses the budget dashboard engine output for the month (same query as GET /budgets/monthly/dashboard).',
  })
  @ApiOkResponse({ type: AiExplanationResponseDto })
  explainMonthlySummary(
    @CurrentUser() user: AuthUser,
    @Query() query: BudgetDashboardQueryDto,
  ): Promise<AiExplanationResponse> {
    return this.ai.explainMonthlySummary(user, query);
  }

  @Get('explain/budget-overrun')
  @ApiOperation({
    summary: 'Budget overrun / overspending explanation',
    description:
      'If not over cap, returns a deterministic explanation without calling the model. Otherwise explains using dashboard facts only.',
  })
  @ApiOkResponse({ type: AiExplanationResponseDto })
  explainBudgetOverrun(
    @CurrentUser() user: AuthUser,
    @Query() query: BudgetDashboardQueryDto,
  ): Promise<AiExplanationResponse> {
    return this.ai.explainBudgetOverrun(user, query);
  }

  @Get('explain/scenario/:scenarioId')
  @ApiOperation({
    summary: 'Interpret a saved scenario',
    description: 'Loads scenario inputs/outputs from the database; the model interprets those numbers only.',
  })
  @ApiOkResponse({ type: AiExplanationResponseDto })
  explainScenario(
    @CurrentUser() user: AuthUser,
    @Param('scenarioId') scenarioId: string,
  ): Promise<AiExplanationResponse> {
    return this.ai.explainScenario(user, scenarioId);
  }

  @Post('coach/affordability')
  @ApiOperation({
    summary: 'Affordability coaching (can I afford this?)',
    description:
      'Server computes liquid buffer and projected monthly surplus; the model compares them to the proposed amount without inventing figures.',
  })
  @ApiCreatedResponse({ type: AiExplanationResponseDto })
  affordabilityCoach(
    @CurrentUser() user: AuthUser,
    @Body() dto: AffordabilityCoachDto,
  ): Promise<AiExplanationResponse> {
    return this.ai.affordabilityCoach(user, dto);
  }
}
