import { Injectable } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import { BudgetEngineService } from '../budgets/budget-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScenarioAdjustmentKind } from './dto/scenario-adjustment.dto';
import type {
  ScenarioAdjustmentV1,
  ScenarioInputV1,
  ScenarioOutputsV1,
} from '../contracts/api-responses';
import type { CreateScenarioDto } from './dto/create-scenario.dto';

const ZERO = new Prisma.Decimal(0);

function money(x: Prisma.Decimal): string {
  return x.toDecimalPlaces(4).toFixed(2);
}

function monthLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

@Injectable()
export class ScenarioEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetEngine: BudgetEngineService,
  ) {}

  dtoToInput(dto: CreateScenarioDto): ScenarioInputV1 {
    const horizonMonths = dto.horizonMonths ?? 12;
    const adjustments: ScenarioAdjustmentV1[] = dto.adjustments.map((a) => {
      switch (a.type) {
        case ScenarioAdjustmentKind.ONE_TIME_CASH:
          return {
            type: 'one_time_cash',
            label: a.label,
            amount: a.amount!,
          };
        case ScenarioAdjustmentKind.RECURRING_MONTHLY:
          return {
            type: 'recurring_monthly',
            label: a.label,
            netMonthlyImpact: a.netMonthlyImpact!,
          };
        case ScenarioAdjustmentKind.DEBT_PAYOFF:
          return {
            type: 'debt_payoff',
            label: a.label,
            principalPayment: a.principalPayment!,
            monthlyPaymentRemoved: a.monthlyPaymentRemoved,
          };
      }
    });
    return { version: 1, horizonMonths, adjustments };
  }

  async evaluate(userId: string, input: ScenarioInputV1): Promise<ScenarioOutputsV1> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const currency = 'USD';

    const { projectedMonthlySurplus: baselineSurplus } =
      await this.budgetEngine.getProjectedMonthlyNetCashFlow(userId, year, month, now);

    const bufferTotal = await this.sumLatestBalances(userId);

    let oneTimeNet = ZERO;
    let recurringMonthly = ZERO;
    const adjustmentLines: ScenarioOutputsV1['adjustmentLines'] = [];

    for (const adj of input.adjustments) {
      if (adj.type === 'one_time_cash') {
        const amt = new Prisma.Decimal(adj.amount);
        oneTimeNet = oneTimeNet.add(amt);
        adjustmentLines.push({
          kind: adj.type,
          label: adj.label ?? null,
          oneTimeImpact: money(amt),
          recurringImpact: null,
        });
      } else if (adj.type === 'recurring_monthly') {
        const net = new Prisma.Decimal(adj.netMonthlyImpact);
        recurringMonthly = recurringMonthly.add(net);
        adjustmentLines.push({
          kind: adj.type,
          label: adj.label ?? null,
          oneTimeImpact: null,
          recurringImpact: money(net),
        });
      } else if (adj.type === 'debt_payoff') {
        const principal = new Prisma.Decimal(adj.principalPayment);
        const payRemoved = adj.monthlyPaymentRemoved
          ? new Prisma.Decimal(adj.monthlyPaymentRemoved)
          : ZERO;
        oneTimeNet = oneTimeNet.sub(principal);
        recurringMonthly = recurringMonthly.add(payRemoved);
        adjustmentLines.push({
          kind: adj.type,
          label: adj.label ?? null,
          oneTimeImpact: money(principal.neg()),
          recurringImpact: payRemoved.isZero() ? null : money(payRemoved),
        });
      }
    }

    const surplusAfter = baselineSurplus.add(recurringMonthly);
    const surplusDelta = recurringMonthly;
    const bufferAfterOneTime = bufferTotal.add(oneTimeNet);
    const bufferDeltaOneTime = oneTimeNet;
    const horizon = input.horizonMonths;
    const bufferAfterHorizon = bufferAfterOneTime.add(surplusAfter.mul(horizon));

    const summaries = this.buildSummaries({
      periodLabel: monthLabel(year, month),
      baselineSurplus,
      bufferTotal,
      oneTimeNet,
      recurringMonthly,
      surplusAfter,
      bufferAfterOneTime,
      bufferAfterHorizon,
      horizon,
      currency,
    });

    return {
      version: 1,
      baseline: {
        periodYear: year,
        periodMonth: month,
        periodLabel: monthLabel(year, month),
        currency,
        projectedMonthlySurplus: money(baselineSurplus),
        bufferTotal: money(bufferTotal),
      },
      deltas: {
        oneTimeNet: money(oneTimeNet),
        recurringMonthly: money(recurringMonthly),
      },
      projected: {
        projectedMonthlySurplusAfter: money(surplusAfter),
        monthlySurplusDelta: money(surplusDelta),
        bufferAfterOneTime: money(bufferAfterOneTime),
        bufferDeltaAfterOneTime: money(bufferDeltaOneTime),
        bufferAfterHorizon: money(bufferAfterHorizon),
      },
      adjustmentLines,
      summaries,
    };
  }

  private async sumLatestBalances(userId: string): Promise<Prisma.Decimal> {
    const accounts = await this.prisma.linkedAccount.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { id: true },
    });
    let sum = ZERO;
    for (const a of accounts) {
      const snap = await this.prisma.balanceSnapshot.findFirst({
        where: { linkedAccountId: a.id },
        orderBy: { asOf: 'desc' },
      });
      if (snap?.balance) sum = sum.add(snap.balance);
    }
    return sum;
  }

  private buildSummaries(p: {
    periodLabel: string;
    baselineSurplus: Prisma.Decimal;
    bufferTotal: Prisma.Decimal;
    oneTimeNet: Prisma.Decimal;
    recurringMonthly: Prisma.Decimal;
    surplusAfter: Prisma.Decimal;
    bufferAfterOneTime: Prisma.Decimal;
    bufferAfterHorizon: Prisma.Decimal;
    horizon: number;
    currency: string;
  }): string[] {
    const {
      periodLabel,
      baselineSurplus,
      bufferTotal,
      oneTimeNet,
      recurringMonthly,
      surplusAfter,
      bufferAfterOneTime,
      bufferAfterHorizon,
      horizon,
      currency,
    } = p;
    const lines: string[] = [];

    lines.push(
      `Baseline (${periodLabel}): projected monthly surplus is ${money(baselineSurplus)} ${currency} from posted transactions (linear month projection).`,
    );
    lines.push(
      `Current liquid buffer (sum of latest balances on linked accounts): ${money(bufferTotal)} ${currency}.`,
    );

    if (!oneTimeNet.isZero()) {
      lines.push(
        `One-time cash flows in this scenario (net): ${money(oneTimeNet)} ${currency} (positive adds to buffer, negative draws from buffer).`,
      );
    }
    if (!recurringMonthly.isZero()) {
      lines.push(
        `Recurring monthly impact on surplus: ${recurringMonthly.gte(0) ? '+' : ''}${money(recurringMonthly)} ${currency} per month vs baseline.`,
      );
    }

    lines.push(
      `After recurring adjustments, projected monthly surplus is ${money(surplusAfter)} ${currency} (${recurringMonthly.gte(0) ? '+' : ''}${money(recurringMonthly)} vs baseline).`,
    );
    lines.push(
      `Buffer immediately after one-time flows: ${money(bufferAfterOneTime)} ${currency}.`,
    );
    lines.push(
      `Buffer after ${horizon} month(s) if surplus stayed at the adjusted level: ${money(bufferAfterHorizon)} ${currency} (linear projection; no compounding).`,
    );

    return lines;
  }
}
