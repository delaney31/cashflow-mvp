import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertSeverity, GoalStatus, GoalType, Prisma, TransactionStatus } from '@cashflow/db';
import { BudgetEngineService } from '../budgets/budget-engine.service';
import { CriticalAlertNotifierService } from '../notifications/critical-alert-notifier.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AlertTypes,
  dedupeCashBuffer,
  dedupeForecastBreach,
  dedupeLargeTransaction,
  dedupeLowChecking,
  dedupeMonthlyCapExceeded,
  dedupeRecurringRisk,
  isoWeekKey,
} from './alert-dedupe';
import type { AlertEvaluationSummary } from './alert.types';

const ZERO = new Prisma.Decimal(0);

function expensePortion(amount: Prisma.Decimal): Prisma.Decimal {
  return amount.gt(0) ? amount : ZERO;
}

@Injectable()
export class AlertEngineService {
  private readonly logger = new Logger(AlertEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetEngine: BudgetEngineService,
    private readonly config: ConfigService,
    private readonly criticalNotifier: CriticalAlertNotifierService,
  ) {}

  private largeTxMinUsd(): Prisma.Decimal {
    return new Prisma.Decimal(this.config.get<string>('ALERT_LARGE_TX_MIN_USD') ?? '500');
  }

  private largeTxAvgMult(): number {
    return Number(this.config.get('ALERT_LARGE_TX_AVG_MULTIPLIER') ?? 3);
  }

  private lowCheckingUsd(): Prisma.Decimal {
    return new Prisma.Decimal(this.config.get<string>('ALERT_LOW_CHECKING_USD') ?? '100');
  }

  private recurringDaysAhead(): number {
    return Number(this.config.get('ALERT_RECURRING_DAYS_AHEAD') ?? 7);
  }

  private bufferRatio(): Prisma.Decimal {
    return new Prisma.Decimal(this.config.get<string>('ALERT_BUFFER_RATIO') ?? '0.9');
  }

  /**
   * Idempotent evaluation for background jobs: upserts active alerts, resolves when conditions clear.
   */
  async evaluateForUser(userId: string): Promise<AlertEvaluationSummary> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    let upserts = 0;
    let resolves = 0;

    const dashboard = await this.budgetEngine.buildDashboard({
      userId,
      year,
      month,
      transactionView: 'posted',
      now,
    });

    const capKey = dedupeMonthlyCapExceeded(year, month);
    const forecastKey = dedupeForecastBreach(year, month);

    if (dashboard.budget.totalBudgetCap && dashboard.totals.isOverCapActual) {
      await this.ensureAlert({
        userId,
        dedupeKey: capKey,
        severity: AlertSeverity.CRITICAL,
        alertType: AlertTypes.MONTHLY_CAP_EXCEEDED,
        title: 'Monthly budget cap exceeded',
        body: `Month-to-date spend ${dashboard.totals.monthToDateSpend} is above your total cap ${dashboard.totals.totalBudgetCap}.`,
        metadata: { year, month, view: 'posted' },
      });
      upserts += 1;
    } else {
      const r = await this.resolveIfActive(userId, capKey);
      resolves += r;
    }

    if (dashboard.budget.totalBudgetCap && dashboard.totals.isOverCapForecast) {
      await this.ensureAlert({
        userId,
        dedupeKey: forecastKey,
        severity: AlertSeverity.WARNING,
        alertType: AlertTypes.FORECASTED_CAP_BREACH,
        title: 'Forecast may exceed monthly budget',
        body: `Linear forecast to month-end is ${dashboard.totals.forecastedMonthEndSpend} vs cap ${dashboard.totals.totalBudgetCap}.`,
        metadata: { year, month },
      });
      upserts += 1;
    } else {
      resolves += await this.resolveIfActive(userId, forecastKey);
    }

    const checkingAccounts = await this.prisma.linkedAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        subtype: { equals: 'checking', mode: 'insensitive' },
      },
      select: { id: true, name: true, mask: true },
    });

    const lowThreshold = this.lowCheckingUsd();
    for (const acct of checkingAccounts) {
      const snap = await this.prisma.balanceSnapshot.findFirst({
        where: { linkedAccountId: acct.id },
        orderBy: { asOf: 'desc' },
      });
      const bal = snap?.balance ?? ZERO;
      const dk = dedupeLowChecking(acct.id);
      if (bal.lt(lowThreshold)) {
        await this.ensureAlert({
          userId,
          dedupeKey: dk,
          severity: AlertSeverity.WARNING,
          alertType: AlertTypes.LOW_CHECKING_BALANCE,
          title: `Low balance on ${acct.name}`,
          body: `Latest balance ${bal.toString()} is below ${lowThreshold.toString()} ${snap?.currency ?? 'USD'}.`,
          metadata: { linkedAccountId: acct.id, balance: bal.toString() },
        });
        upserts += 1;
      } else {
        resolves += await this.resolveIfActive(userId, dk);
      }
    }

    await this.evaluateLargeTransactions(userId, now, (u) => {
      upserts += u;
    });

    await this.evaluateRecurringRisk(userId, now, (u, r) => {
      upserts += u;
      resolves += r;
    });

    await this.evaluateCashBufferGoals(userId, (u, r) => {
      upserts += u;
      resolves += r;
    });

    this.logger.log(`Alert evaluation user=${userId} upserts~=${upserts} resolves~=${resolves}`);
    return { userId, upserts, resolves, evaluatedAt: new Date().toISOString() };
  }

  private async evaluateLargeTransactions(
    userId: string,
    now: Date,
    onUpsert: (n: number) => void,
  ): Promise<void> {
    const minUsd = this.largeTxMinUsd();
    const mult = this.largeTxAvgMult();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);

    const txs = await this.prisma.transaction.findMany({
      where: {
        linkedAccount: { userId },
        status: TransactionStatus.POSTED,
        date: { gte: start, lte: now },
      },
      select: { id: true, amount: true, date: true, name: true },
    });

    const expenses = txs.map((t) => expensePortion(t.amount));
    const sum = expenses.reduce((a, b) => a.add(b), ZERO);
    const n = expenses.filter((e) => e.gt(0)).length;
    const avg = n > 0 ? sum.div(n) : ZERO;
    const threshold = Prisma.Decimal.max(minUsd, avg.mul(mult));

    const recentCutoff = new Date(now);
    recentCutoff.setUTCDate(recentCutoff.getUTCDate() - 14);

    for (const t of txs) {
      const exp = expensePortion(t.amount);
      if (exp.lt(threshold) || t.date < recentCutoff) continue;
      await this.ensureAlert({
        userId,
        dedupeKey: dedupeLargeTransaction(t.id),
        severity: exp.gt(threshold.mul(2)) ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        alertType: AlertTypes.UNUSUAL_LARGE_TRANSACTION,
        title: 'Unusually large transaction',
        body: `${t.name}: ${exp.toString()} (above typical activity).`,
        metadata: { transactionId: t.id, threshold: threshold.toString() },
      });
      onUpsert(1);
    }
  }

  private async evaluateRecurringRisk(
    userId: string,
    now: Date,
    cb: (upserts: number, resolves: number) => void,
  ): Promise<void> {
    let upserts = 0;
    let resolves = 0;
    const days = this.recurringDaysAhead();
    const horizon = new Date(now);
    horizon.setUTCDate(horizon.getUTCDate() + days);

    const patterns = await this.prisma.recurringTransaction.findMany({
      where: { linkedAccount: { userId }, isActive: true },
    });

    const checkingTotal = await this.sumCheckingBalances(userId);

    const week = isoWeekKey(now);

    for (const p of patterns) {
      if (!p.nextExpectedDate) continue;
      const nd = p.nextExpectedDate;
      if (nd < now || nd > horizon) {
        resolves += await this.resolveIfActive(userId, dedupeRecurringRisk(p.id, week));
        continue;
      }
      const amt = p.averageAmount;
      if (checkingTotal.lt(amt.mul(2))) {
        await this.ensureAlert({
          userId,
          dedupeKey: dedupeRecurringRisk(p.id, week),
          severity: AlertSeverity.WARNING,
          alertType: AlertTypes.RECURRING_BILL_RISK,
          title: `Upcoming recurring: ${p.label}`,
          body: `Expected ~${amt.toString()} around ${nd.toISOString().slice(0, 10)}; checking balances may be tight.`,
          metadata: {
            recurringId: p.id,
            nextExpectedDate: nd.toISOString(),
            averageAmount: amt.toString(),
            checkingTotal: checkingTotal.toString(),
          },
        });
        upserts += 1;
      } else {
        resolves += await this.resolveIfActive(userId, dedupeRecurringRisk(p.id, week));
      }
    }
    cb(upserts, resolves);
  }

  private async sumCheckingBalances(userId: string): Promise<Prisma.Decimal> {
    const accounts = await this.prisma.linkedAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        subtype: { equals: 'checking', mode: 'insensitive' },
      },
      select: { id: true },
    });
    let s = ZERO;
    for (const a of accounts) {
      const snap = await this.prisma.balanceSnapshot.findFirst({
        where: { linkedAccountId: a.id },
        orderBy: { asOf: 'desc' },
      });
      if (snap?.balance) s = s.add(snap.balance);
    }
    return s;
  }

  private async evaluateCashBufferGoals(
    userId: string,
    cb: (upserts: number, resolves: number) => void,
  ): Promise<void> {
    let upserts = 0;
    let resolves = 0;
    const ratio = this.bufferRatio();

    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
        status: GoalStatus.ACTIVE,
        type: { in: [GoalType.CASH_BUFFER_TARGET, GoalType.MIN_CHECKING_BALANCE] },
      },
    });

    for (const g of goals) {
      const dk = dedupeCashBuffer(g.id);
      const target = g.targetAmount;
      const current = g.currentAmount;
      const threshold = target.mul(ratio);
      if (current.lt(threshold)) {
        const sev =
          current.lt(target.mul(0.5)) ? AlertSeverity.CRITICAL : AlertSeverity.INFO;
        await this.ensureAlert({
          userId,
          dedupeKey: dk,
          severity: sev,
          alertType: AlertTypes.CASH_BUFFER_BELOW_THRESHOLD,
          title: `Cash buffer below target: ${g.title}`,
          body: `Current ${current.toString()} vs target ${target.toString()}.`,
          metadata: { goalId: g.id, goalType: g.type },
        });
        upserts += 1;
      } else {
        resolves += await this.resolveIfActive(userId, dk);
      }
    }
    cb(upserts, resolves);
  }

  private async ensureAlert(params: {
    userId: string;
    dedupeKey: string;
    severity: AlertSeverity;
    alertType: string;
    title: string;
    body: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { userId, dedupeKey, severity, alertType, title, body, metadata } = params;
    const row = await this.prisma.alert.upsert({
      where: {
        userId_dedupeKey: { userId, dedupeKey },
      },
      create: {
        userId,
        dedupeKey,
        severity,
        alertType,
        title,
        body,
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      },
      update: {
        severity,
        alertType,
        title,
        body,
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
        resolvedAt: null,
      },
    });
    if (severity === AlertSeverity.CRITICAL) {
      void this.criticalNotifier.notifyAlertCreated(userId, row).catch((err: unknown) => {
        this.logger.warn(`Critical alert push failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }

  /** Returns 1 if a row was resolved, else 0. */
  private async resolveIfActive(userId: string, dedupeKey: string): Promise<number> {
    const res = await this.prisma.alert.updateMany({
      where: { userId, dedupeKey, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
    return res.count > 0 ? 1 : 0;
  }
}
