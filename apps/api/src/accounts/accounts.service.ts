import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { LinkedAccountResponse } from '../contracts/api-responses';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser): Promise<LinkedAccountResponse[]> {
    const rows = await this.prisma.linkedAccount.findMany({
      where: { userId: user.userId },
      include: { institution: true, plaidItem: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => {
      const lastBal = r.lastBalanceSyncAt;
      const lastTx = r.lastTransactionSyncAt;
      let lastSyncedAt: string | null = null;
      if (lastBal && lastTx) {
        lastSyncedAt =
          lastBal > lastTx ? lastBal.toISOString() : lastTx.toISOString();
      } else if (lastBal) {
        lastSyncedAt = lastBal.toISOString();
      } else if (lastTx) {
        lastSyncedAt = lastTx.toISOString();
      }
      return {
        id: r.id,
        institutionId: r.institutionId,
        institutionName: r.institution.name,
        itemId: r.plaidItemRecordId,
        plaidItemId: r.plaidItem.plaidItemId,
        name: r.name,
        mask: r.mask,
        type: r.type,
        subtype: r.subtype,
        currency: r.currency,
        status: r.status as LinkedAccountResponse['status'],
        lastSyncedAt,
      };
    });
  }
}
