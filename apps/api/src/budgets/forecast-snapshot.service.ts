import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Persists daily net cashflow snapshots from posted transactions (recomputable; used for trends / forecasting hooks).
 * Business logic is independent of the job runner.
 */
@Injectable()
export class ForecastSnapshotService {
  private readonly logger = new Logger(ForecastSnapshotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recomputeDailySnapshotsForUser(userId: string): Promise<{ daysWritten: number }> {
    const accounts = await this.prisma.linkedAccount.findMany({
      where: { userId },
      select: { id: true },
    });
    const ids = accounts.map((a) => a.id);
    if (ids.length === 0) {
      return { daysWritten: 0 };
    }

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 90);
    start.setUTCHours(0, 0, 0, 0);

    const txs = await this.prisma.transaction.findMany({
      where: {
        linkedAccountId: { in: ids },
        status: 'POSTED',
        date: { gte: start },
      },
      select: { date: true, amount: true },
    });

    const byDay = new Map<string, Prisma.Decimal>();
    for (const t of txs) {
      const key = t.date.toISOString().slice(0, 10);
      const prev = byDay.get(key) ?? new Prisma.Decimal(0);
      byDay.set(key, prev.add(t.amount));
    }

    let daysWritten = 0;
    for (const [dayStr, net] of byDay) {
      const date = new Date(`${dayStr}T12:00:00.000Z`);
      await this.prisma.dailyCashflowSnapshot.upsert({
        where: { userId_date: { userId, date } },
        create: {
          userId,
          date,
          netAmount: net.toFixed(4),
          currency: 'USD',
          metadata: { source: 'forecast_snapshot_service' },
        },
        update: {
          netAmount: net.toFixed(4),
          metadata: { source: 'forecast_snapshot_service' },
        },
      });
      daysWritten += 1;
    }

    this.logger.log(`forecast snapshots user=${userId} days=${daysWritten}`);
    return { daysWritten };
  }
}
