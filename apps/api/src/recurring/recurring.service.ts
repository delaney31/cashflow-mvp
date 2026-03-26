import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { RecurringUpcomingResponse } from '../contracts/api-responses';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecurringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upcoming recurring patterns (active, ordered by next expected date).
   */
  async listUpcoming(user: AuthUser, limit: number): Promise<RecurringUpcomingResponse[]> {
    const take = Math.min(Math.max(limit, 1), 50);
    const rows = await this.prisma.recurringTransaction.findMany({
      where: {
        linkedAccount: { userId: user.userId },
        isActive: true,
      },
    });
    const sorted = [...rows].sort((a, b) => {
      if (!a.nextExpectedDate && !b.nextExpectedDate) return a.label.localeCompare(b.label);
      if (!a.nextExpectedDate) return 1;
      if (!b.nextExpectedDate) return -1;
      return a.nextExpectedDate.getTime() - b.nextExpectedDate.getTime();
    });
    return sorted.slice(0, take).map((r) => ({
      id: r.id,
      linkedAccountId: r.linkedAccountId,
      label: r.label,
      averageAmount: r.averageAmount.toString(),
      currency: r.currency,
      frequency: r.frequency,
      nextExpectedDate: r.nextExpectedDate ? r.nextExpectedDate.toISOString().slice(0, 10) : null,
    }));
  }
}
