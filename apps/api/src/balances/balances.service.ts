import { Injectable, Logger } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { BalanceResponse } from '../contracts/api-responses';
import { PlaidSyncService } from '../plaid/plaid-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import type { BalancesQueryDto } from './dto/balances-query.dto';

@Injectable()
export class BalancesService {
  private readonly logger = new Logger(BalancesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly plaidSync: PlaidSyncService,
  ) {}

  async list(user: AuthUser, query: BalancesQueryDto): Promise<BalanceResponse[]> {
    if (query.refresh === true) {
      try {
        await this.plaidSync.refreshBalancesForUser(user.userId);
      } catch (e) {
        this.logger.error('Plaid balance refresh failed', e);
        throw e;
      }
    }

    const accounts = await this.prisma.linkedAccount.findMany({
      where: { userId: user.userId },
      select: { id: true },
    });
    const ids = accounts.map((a) => a.id);
    const out: BalanceResponse[] = [];
    for (const id of ids) {
      const snap = await this.prisma.balanceSnapshot.findFirst({
        where: { linkedAccountId: id },
        orderBy: { asOf: 'desc' },
      });
      if (snap) {
        out.push({
          linkedAccountId: id,
          balance: snap.balance.toString(),
          currency: snap.currency,
          asOf: snap.asOf.toISOString(),
          source: snap.source as BalanceResponse['source'],
        });
      }
    }
    return out;
  }
}
