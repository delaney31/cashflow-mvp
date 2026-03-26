import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RecurringFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Heuristic recurring bill detection from posted transaction history (MVP).
 * Idempotent upserts by (linkedAccountId, merchantPattern). Reusable outside workers.
 */
@Injectable()
export class RecurringDetectionService {
  private readonly logger = new Logger(RecurringDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async detectForUser(userId: string): Promise<{ patternsUpserted: number }> {
    const accounts = await this.prisma.linkedAccount.findMany({
      where: { userId },
      select: { id: true },
    });
    let patternsUpserted = 0;

    for (const la of accounts) {
      const txs = await this.prisma.transaction.findMany({
        where: { linkedAccountId: la.id, status: 'POSTED' },
        orderBy: { date: 'desc' },
        take: 200,
        select: {
          id: true,
          date: true,
          amount: true,
          name: true,
          merchantName: true,
        },
      });

      const groups = new Map<string, typeof txs>();
      for (const t of txs) {
        const raw = (t.merchantName ?? t.name ?? '').trim().toLowerCase();
        const key = raw.slice(0, 80);
        if (key.length < 3) continue;
        const arr = groups.get(key) ?? [];
        arr.push(t);
        groups.set(key, arr);
      }

      for (const [pattern, list] of groups) {
        if (list.length < 3) continue;
        const expenses = list.filter((t) => t.amount.gt(0));
        if (expenses.length < 3) continue;
        const amounts = expenses.map((t) => t.amount);
        const sum = amounts.reduce((a, b) => a.add(b), new Prisma.Decimal(0));
        const avg = sum.div(expenses.length);
        if (avg.lte(0)) continue;

        const label = (expenses[0].merchantName ?? expenses[0].name).slice(0, 200);

        const existing = await this.prisma.recurringTransaction.findFirst({
          where: { linkedAccountId: la.id, merchantPattern: pattern },
        });

        const sortedDates = [...expenses].sort((a, b) => a.date.getTime() - b.date.getTime());
        const last = sortedDates[sortedDates.length - 1]?.date;
        let nextExpected: Date | null = null;
        if (sortedDates.length >= 2 && last) {
          const deltas: number[] = [];
          for (let i = 1; i < sortedDates.length; i++) {
            const d0 = sortedDates[i - 1].date.getTime();
            const d1 = sortedDates[i].date.getTime();
            deltas.push(Math.round((d1 - d0) / 86400000));
          }
          const medianDays = deltas.sort((a, b) => a - b)[Math.floor(deltas.length / 2)] ?? 30;
          const add = Math.max(7, Math.min(120, medianDays));
          nextExpected = new Date(last);
          nextExpected.setUTCDate(nextExpected.getUTCDate() + add);
        }

        if (existing) {
          await this.prisma.recurringTransaction.update({
            where: { id: existing.id },
            data: {
              label,
              averageAmount: avg.toFixed(4),
              frequency: RecurringFrequency.MONTHLY,
              nextExpectedDate: nextExpected,
            },
          });
        } else {
          await this.prisma.recurringTransaction.create({
            data: {
              linkedAccountId: la.id,
              label,
              merchantPattern: pattern,
              averageAmount: avg.toFixed(4),
              currency: 'USD',
              frequency: RecurringFrequency.MONTHLY,
              nextExpectedDate: nextExpected,
            },
          });
        }
        patternsUpserted += 1;
      }
    }

    this.logger.log(`recurring detection user=${userId} patterns=${patternsUpserted}`);
    return { patternsUpserted };
  }
}
