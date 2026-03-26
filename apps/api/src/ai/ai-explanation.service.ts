import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { AiExplanationResponse } from '../contracts/api-responses';
import { BudgetEngineService } from '../budgets/budget-engine.service';
import { BudgetsService } from '../budgets/budgets.service';
import { BalancesService } from '../balances/balances.service';
import { ScenariosService } from '../scenarios/scenarios.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OpenAiClientService } from './openai-client.service';
import { affordabilitySystemAddendum, affordabilityUserMessage } from './prompts/affordability.prompt';
import { monthlySummarySystemAddendum, monthlySummaryUserMessage } from './prompts/monthly-summary.prompt';
import { overspendingSystemAddendum, overspendingUserMessage } from './prompts/overspending.prompt';
import { scenarioInterpretSystemAddendum, scenarioInterpretUserMessage } from './prompts/scenario-interpret.prompt';
import { transactionExplainSystemAddendum, transactionExplainUserMessage } from './prompts/transaction-explain.prompt';
import type { BudgetDashboardQueryDto } from '../budgets/dto/budget-dashboard-query.dto';
import type { AffordabilityCoachDto } from './dto/affordability-coach.dto';

const DISCLAIMER =
  'Educational only — not financial, legal, or tax advice. Figures come from your linked data and deterministic calculations.';

@Injectable()
export class AiExplanationService {
  private readonly logger = new Logger(AiExplanationService.name);

  constructor(
    private readonly openai: OpenAiClientService,
    private readonly budgets: BudgetsService,
    private readonly budgetEngine: BudgetEngineService,
    private readonly transactions: TransactionsService,
    private readonly balances: BalancesService,
    private readonly scenarios: ScenariosService,
  ) {}

  private toResponse(
    structured: AiExplanationResponse['structured'],
    rawModel: string,
  ): AiExplanationResponse {
    return {
      structured,
      text: structured.narrative,
      model: rawModel,
      disclaimer: DISCLAIMER,
    };
  }

  async explainTransaction(
    user: AuthUser,
    transactionId: string,
  ): Promise<AiExplanationResponse> {
    const row = await this.transactions.getById(user, transactionId);
    if (!row) throw new NotFoundException('Transaction not found');
    const contextJson = JSON.stringify(
      {
        transaction: row,
        amountConvention:
          'Positive amount typically indicates outflow (spend) for depository accounts in this app.',
      },
      null,
      2,
    );
    this.logger.log(`ai.explain.transaction userId=${user.userId} transactionId=${transactionId}`);
    const { structured, rawModel } = await this.openai.completeStructuredExplanation({
      feature: 'transaction_explain',
      userId: user.userId,
      systemAddendum: transactionExplainSystemAddendum(),
      userMessage: transactionExplainUserMessage(contextJson),
    });
    return this.toResponse(structured, rawModel);
  }

  async explainMonthlySummary(
    user: AuthUser,
    query: BudgetDashboardQueryDto,
  ): Promise<AiExplanationResponse> {
    const dashboard = await this.budgets.getMonthDashboard(user, query);
    const contextJson = JSON.stringify({ dashboard }, null, 2);
    this.logger.log(
      `ai.explain.monthly_summary userId=${user.userId} period=${dashboard.period.year}-${dashboard.period.month}`,
    );
    const { structured, rawModel } = await this.openai.completeStructuredExplanation({
      feature: 'monthly_summary',
      userId: user.userId,
      systemAddendum: monthlySummarySystemAddendum(),
      userMessage: monthlySummaryUserMessage(contextJson),
    });
    return this.toResponse(structured, rawModel);
  }

  async explainBudgetOverrun(
    user: AuthUser,
    query: BudgetDashboardQueryDto,
  ): Promise<AiExplanationResponse> {
    const dashboard = await this.budgets.getMonthDashboard(user, query);
    const t = dashboard.totals;
    const overrunActual = t.isOverCapActual;
    const overrunForecast = t.isOverCapForecast;
    if (!overrunActual && !overrunForecast) {
      this.logger.log(`ai.explain.budget_overrun short_circuit userId=${user.userId} no_overrun`);
      return this.toResponse(
        {
          headline: 'No budget cap overrun in this snapshot',
          keyPoints: [
            `Month-to-date spend vs cap: not over (per engine: isOverCapActual=${overrunActual}).`,
            `Forecast to month-end vs cap: not over (isOverCapForecast=${overrunForecast}).`,
            'You can still review pace and category lines in the dashboard if you want to tighten spending.',
          ],
          cautions: ['Forecasts assume linear spend through month-end; unusual timing can change outcomes.'],
          narrative:
            'Based on the same deterministic dashboard you use in the app, you are not over your total monthly cap on actual or forecasted figures right now. This explanation did not call the AI model to save cost.',
          nextSteps: ['Open the budget dashboard to review per-category lines if needed.'],
        },
        'deterministic',
      );
    }
    const contextJson = JSON.stringify({ dashboard, note: 'User is in overrun on actual and/or forecast.' }, null, 2);
    this.logger.log(`ai.explain.budget_overrun userId=${user.userId} actual=${overrunActual} forecast=${overrunForecast}`);
    const { structured, rawModel } = await this.openai.completeStructuredExplanation({
      feature: 'budget_overrun',
      userId: user.userId,
      systemAddendum: overspendingSystemAddendum(),
      userMessage: overspendingUserMessage(contextJson),
    });
    return this.toResponse(structured, rawModel);
  }

  async explainScenario(user: AuthUser, scenarioId: string): Promise<AiExplanationResponse> {
    const scenario = await this.scenarios.getById(user, scenarioId);
    const contextJson = JSON.stringify(
      {
        scenario: {
          id: scenario.id,
          name: scenario.name,
          inputs: scenario.inputs,
          outputs: scenario.outputs,
        },
      },
      null,
      2,
    );
    this.logger.log(`ai.explain.scenario userId=${user.userId} scenarioId=${scenarioId}`);
    const { structured, rawModel } = await this.openai.completeStructuredExplanation({
      feature: 'scenario_interpret',
      userId: user.userId,
      systemAddendum: scenarioInterpretSystemAddendum(),
      userMessage: scenarioInterpretUserMessage(contextJson),
    });
    return this.toResponse(structured, rawModel);
  }

  async affordabilityCoach(user: AuthUser, dto: AffordabilityCoachDto): Promise<AiExplanationResponse> {
    const d = new Date();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const [balances, flow] = await Promise.all([
      this.balances.list(user, {}),
      this.budgetEngine.getProjectedMonthlyNetCashFlow(user.userId, year, month, d),
    ]);
    let bufferTotal = new Prisma.Decimal(0);
    for (const b of balances) {
      bufferTotal = bufferTotal.add(new Prisma.Decimal(b.balance));
    }
    const contextJson = JSON.stringify(
      {
        proposed: {
          label: dto.label ?? null,
          amount: dto.proposedAmount,
          currency: dto.currency ?? 'USD',
          compareHorizonMonths: dto.compareHorizonMonths ?? 1,
        },
        deterministicSnapshot: {
          period: { year, month },
          projectedMonthlySurplus: flow.projectedMonthlySurplus.toString(),
          liquidBufferTotalFromLatestSnapshots: bufferTotal.toFixed(2),
          balanceRowCount: balances.length,
        },
        note: 'Surplus is projected from posted transactions (linear month projection). Buffer sums latest snapshots per linked account.',
      },
      null,
      2,
    );
    this.logger.log(`ai.coach.affordability userId=${user.userId} amount=${dto.proposedAmount}`);
    const { structured, rawModel } = await this.openai.completeStructuredExplanation({
      feature: 'affordability_coach',
      userId: user.userId,
      systemAddendum: affordabilitySystemAddendum(),
      userMessage: affordabilityUserMessage(contextJson),
    });
    return this.toResponse(structured, rawModel);
  }
}
