import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CountryCode, Products, type Transaction as PlaidTransaction } from 'plaid';
import { Prisma, TransactionStatus } from '@cashflow/db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { withPlaidRetry } from './plaid-retry';
import { PlaidService } from './plaid.service';
import { TokenEncryptionService } from './token-encryption.service';

@Injectable()
export class PlaidSyncService {
  private readonly logger = new Logger(PlaidSyncService.name);
  /** Serialize sync work per PlaidItem id to avoid cursor races from concurrent webhooks + manual sync. */
  private readonly syncTail = new Map<string, Promise<unknown>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly plaid: PlaidService,
    private readonly tokens: TokenEncryptionService,
  ) {}

  private decryptAccessToken(enc: string): string {
    return this.tokens.decrypt(enc);
  }

  /**
   * Runs work after any in-flight work for the same item finishes; failures do not block the queue.
   */
  private enqueuePlaidItemWork<T>(plaidItemInternalId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.syncTail.get(plaidItemInternalId) ?? Promise.resolve();
    const next = prev
      .catch(() => undefined)
      .then(() => fn());
    this.syncTail.set(plaidItemInternalId, next);
    return next;
  }

  async createLinkToken(user: AuthUser): Promise<{ linkToken: string; expiration: string }> {
    const webhookUrl = process.env.PLAID_WEBHOOK_URL;
    const resp = await withPlaidRetry(
      this.logger,
      'linkTokenCreate',
      () =>
        this.plaid.client.linkTokenCreate({
          user: { client_user_id: user.userId },
          client_name: process.env.PLAID_CLIENT_NAME ?? 'Cashflow',
          products: [Products.Transactions],
          country_codes: [CountryCode.Us],
          language: 'en',
          webhook: webhookUrl || undefined,
        }),
    );
    const linkToken = resp.data.link_token;
    const expiration = resp.data.expiration ?? '';
    this.logger.log(`Created Plaid link token for user ${user.userId}`);
    return { linkToken, expiration };
  }

  async exchangePublicToken(
    user: AuthUser,
    publicToken: string,
  ): Promise<{ itemId: string; plaidItemId: string; accountsLinked: number }> {
    const ex = await withPlaidRetry(this.logger, 'itemPublicTokenExchange', () =>
      this.plaid.client.itemPublicTokenExchange({ public_token: publicToken }),
    );
    const accessToken = ex.data.access_token;
    const plaidItemId = ex.data.item_id;

    const existing = await this.prisma.plaidItem.findUnique({ where: { plaidItemId } });
    if (existing) {
      if (existing.userId !== user.userId) {
        throw new ForbiddenException('This Plaid item is already linked to another user');
      }
      const accountsLinked = await this.prisma.linkedAccount.count({
        where: { plaidItemRecordId: existing.id },
      });
      this.logger.warn(`Idempotent exchange: Plaid item ${plaidItemId} already linked for user`);
      return { itemId: existing.id, plaidItemId, accountsLinked };
    }

    const itemResp = await withPlaidRetry(this.logger, 'itemGet', () =>
      this.plaid.client.itemGet({ access_token: accessToken }),
    );
    const plaidInstitutionId = itemResp.data.item.institution_id;
    if (!plaidInstitutionId) {
      throw new BadRequestException('Plaid item missing institution_id');
    }

    const instResp = await withPlaidRetry(this.logger, 'institutionsGetById', () =>
      this.plaid.client.institutionsGetById({
        institution_id: plaidInstitutionId,
        country_codes: [CountryCode.Us],
      }),
    );
    const instName = instResp.data.institution?.name ?? 'Unknown';

    const institution = await this.prisma.institution.upsert({
      where: { plaidInstitutionId },
      create: { plaidInstitutionId, name: instName },
      update: { name: instName },
    });

    const acctResp = await withPlaidRetry(this.logger, 'accountsGet', () =>
      this.plaid.client.accountsGet({ access_token: accessToken }),
    );
    const accounts = acctResp.data.accounts;

    const enc = this.tokens.encrypt(accessToken);

    let plaidItem: { id: string };
    let n: number;
    try {
      const out = await this.prisma.$transaction(async (tx) => {
        const pi = await tx.plaidItem.create({
          data: {
            userId: user.userId,
            institutionId: institution.id,
            plaidItemId,
            accessTokenEnc: enc,
          },
        });
        let count = 0;
        for (const a of accounts) {
          await tx.linkedAccount.create({
            data: {
              userId: user.userId,
              institutionId: institution.id,
              plaidItemRecordId: pi.id,
              plaidAccountId: a.account_id,
              name: a.name ?? 'Account',
              officialName: a.official_name ?? null,
              mask: a.mask ?? null,
              type: a.type,
              subtype: a.subtype ?? null,
              currency: a.balances?.iso_currency_code ?? 'USD',
            },
          });
          count += 1;
        }
        return { plaidItem: pi, n: count };
      });
      plaidItem = out.plaidItem;
      n = out.n;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        const row = await this.prisma.plaidItem.findUnique({ where: { plaidItemId } });
        if (row?.userId === user.userId) {
          const accountsLinked = await this.prisma.linkedAccount.count({
            where: { plaidItemRecordId: row.id },
          });
          this.logger.warn(`Race on plaid_items.plaid_item_id; returning existing ${plaidItemId}`);
          return { itemId: row.id, plaidItemId, accountsLinked };
        }
        if (row && row.userId !== user.userId) {
          throw new ForbiddenException('This Plaid item is already linked to another user');
        }
        throw new ConflictException('Plaid item already linked');
      }
      throw e;
    }

    await this.enqueuePlaidItemWork(plaidItem.id, async () => {
      await this.refreshBalancesForPlaidItem(plaidItem.id, accessToken);
      await this.syncTransactionsForPlaidItem(plaidItem.id, accessToken, null);
    });

    this.logger.log(`Linked Plaid item ${plaidItemId} for user ${user.userId}: ${n} accounts`);
    return { itemId: plaidItem.id, plaidItemId, accountsLinked: n };
  }

  async syncItemForUser(user: AuthUser, itemRecordId: string): Promise<void> {
    const item = await this.prisma.plaidItem.findFirst({
      where: { id: itemRecordId, userId: user.userId },
    });
    if (!item) {
      throw new NotFoundException('Plaid item not found');
    }
    const accessToken = this.decryptAccessToken(item.accessTokenEnc);
    await this.enqueuePlaidItemWork(item.id, async () => {
      await this.refreshBalancesForPlaidItem(item.id, accessToken);
      await this.syncTransactionsForPlaidItem(item.id, accessToken, item.transactionsCursor);
    });
  }

  /** Webhook / internal: sync by Plaid’s external item_id string (errors logged, not thrown). */
  async syncItemByPlaidItemId(plaidItemId: string): Promise<void> {
    const item = await this.prisma.plaidItem.findUnique({
      where: { plaidItemId },
    });
    if (!item) {
      this.logger.warn(`Webhook: no PlaidItem row for plaid_item_id=${plaidItemId}`);
      return;
    }
    await this.enqueuePlaidItemWork(item.id, async () => {
      try {
        const accessToken = this.decryptAccessToken(item.accessTokenEnc);
        await this.refreshBalancesForPlaidItem(item.id, accessToken);
        await this.syncTransactionsForPlaidItem(item.id, accessToken, item.transactionsCursor);
      } catch (e) {
        this.logger.error(`Plaid item sync failed for ${plaidItemId}`, e);
      }
    });
  }

  async handleWebhookPayload(body: {
    webhook_type?: string;
    webhook_code?: string;
    item_id?: string;
  }): Promise<void> {
    if (body.webhook_type !== 'TRANSACTIONS' || !body.item_id) {
      return;
    }
    const codes = new Set([
      'SYNC_UPDATES_AVAILABLE',
      'DEFAULT_UPDATE',
      'INITIAL_UPDATE',
      'HISTORICAL_UPDATE',
    ]);
    if (!body.webhook_code || !codes.has(body.webhook_code)) {
      return;
    }
    this.logger.log(`Plaid webhook ${body.webhook_code} for item ${body.item_id}`);
    await this.syncItemByPlaidItemId(body.item_id);
  }

  /**
   * Background job entry: sync one Plaid item by internal `plaid_items.id` (no JWT).
   * Reuses the same per-item serialization as webhooks.
   */
  async syncPlaidItemByRecordId(recordId: string): Promise<void> {
    const item = await this.prisma.plaidItem.findUnique({ where: { id: recordId } });
    if (!item) {
      this.logger.warn(`syncPlaidItemByRecordId: PlaidItem not found ${recordId}`);
      return;
    }
    const accessToken = this.decryptAccessToken(item.accessTokenEnc);
    await this.enqueuePlaidItemWork(item.id, async () => {
      await this.refreshBalancesForPlaidItem(item.id, accessToken);
      await this.syncTransactionsForPlaidItem(item.id, accessToken, item.transactionsCursor);
    });
  }

  async refreshBalancesForUser(userId: string): Promise<void> {
    const items = await this.prisma.plaidItem.findMany({ where: { userId } });
    for (const item of items) {
      try {
        const accessToken = this.decryptAccessToken(item.accessTokenEnc);
        await this.enqueuePlaidItemWork(item.id, async () => {
          await this.refreshBalancesForPlaidItem(item.id, accessToken);
        });
      } catch (e) {
        this.logger.error(`refreshBalancesForUser item ${item.id}`, e);
      }
    }
  }

  private async refreshBalancesForPlaidItem(
    plaidItemRecordId: string,
    accessToken: string,
  ): Promise<void> {
    const resp = await withPlaidRetry(this.logger, 'accountsBalanceGet', () =>
      this.plaid.client.accountsBalanceGet({ access_token: accessToken }),
    );
    const now = new Date();
    const accounts = await this.prisma.linkedAccount.findMany({
      where: { plaidItemRecordId },
    });
    const byPlaidId = new Map(accounts.map((a) => [a.plaidAccountId, a]));

    for (const a of resp.data.accounts) {
      const la = byPlaidId.get(a.account_id);
      if (!la) continue;
      const bal = a.balances?.current ?? a.balances?.available;
      if (bal === null || bal === undefined) continue;
      await this.prisma.balanceSnapshot.create({
        data: {
          linkedAccountId: la.id,
          balance: String(bal),
          currency: a.balances?.iso_currency_code ?? la.currency,
          asOf: now,
          source: 'PLAID',
        },
      });
      await this.prisma.linkedAccount.update({
        where: { id: la.id },
        data: { lastBalanceSyncAt: now },
      });
    }
  }

  private async syncTransactionsForPlaidItem(
    plaidItemRecordId: string,
    accessToken: string,
    initialCursor: string | null,
  ): Promise<void> {
    const linkedAccounts = await this.prisma.linkedAccount.findMany({
      where: { plaidItemRecordId },
    });
    const accountIdToLinkedId = new Map(linkedAccounts.map((l) => [l.plaidAccountId, l.id]));

    try {
      let cursor: string | undefined = initialCursor ?? undefined;
      let hasMore = true;

      while (hasMore) {
        const resp = await withPlaidRetry(this.logger, 'transactionsSync', () =>
          this.plaid.client.transactionsSync({
            access_token: accessToken,
            cursor,
            count: 500,
          }),
        );
        const d = resp.data;
        const added = d.added ?? [];
        const modified = d.modified ?? [];
        const removed = d.removed ?? [];

        for (const tx of [...added, ...modified]) {
          await this.upsertPlaidTransaction(tx, accountIdToLinkedId);
        }
        if (removed.length > 0) {
          const ids = removed.map((r) => r.transaction_id).filter(Boolean) as string[];
          await this.prisma.transaction.deleteMany({
            where: { plaidTransactionId: { in: ids } },
          });
        }

        cursor = d.next_cursor ?? undefined;
        hasMore = d.has_more === true;

        await this.prisma.plaidItem.update({
          where: { id: plaidItemRecordId },
          data: {
            transactionsCursor: cursor ?? null,
            lastSuccessfulSyncAt: new Date(),
            lastSyncError: null,
            lastSyncErrorAt: null,
          },
        });
      }

      const syncTime = new Date();
      for (const la of linkedAccounts) {
        await this.prisma.linkedAccount.update({
          where: { id: la.id },
          data: { lastTransactionSyncAt: syncTime },
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.prisma.plaidItem.update({
        where: { id: plaidItemRecordId },
        data: { lastSyncError: msg, lastSyncErrorAt: new Date() },
      });
      this.logger.error(`transactions sync failed for item ${plaidItemRecordId}: ${msg}`);
      throw e;
    }
  }

  private async upsertPlaidTransaction(
    tx: PlaidTransaction,
    accountIdToLinkedId: Map<string, string>,
  ): Promise<void> {
    if (!tx.transaction_id) {
      this.logger.warn('Skipping Plaid transaction without transaction_id');
      return;
    }

    const linkedAccountId = accountIdToLinkedId.get(tx.account_id);
    if (!linkedAccountId) {
      this.logger.warn(`Skipping tx ${tx.transaction_id}: unknown account ${tx.account_id}`);
      return;
    }

    const existing = await this.prisma.transaction.findUnique({
      where: { plaidTransactionId: tx.transaction_id },
      select: { linkedAccountId: true },
    });
    if (existing && existing.linkedAccountId !== linkedAccountId) {
      this.logger.warn(
        `txn ${tx.transaction_id}: linkedAccountId changing from ${existing.linkedAccountId} to ${linkedAccountId} (Plaid update)`,
      );
    }

    const status = tx.pending ? TransactionStatus.PENDING : TransactionStatus.POSTED;
    const date = new Date(tx.date + 'T12:00:00.000Z');
    let postedAt: Date | null = null;
    if (!tx.pending) {
      if (tx.datetime) {
        postedAt = new Date(tx.datetime);
      } else if (tx.authorized_datetime) {
        postedAt = new Date(tx.authorized_datetime);
      }
    }
    const raw = JSON.parse(JSON.stringify(tx)) as Prisma.JsonObject;

    await this.prisma.transaction.upsert({
      where: { plaidTransactionId: tx.transaction_id },
      create: {
        linkedAccountId,
        plaidTransactionId: tx.transaction_id,
        amount: String(tx.amount),
        currency: tx.iso_currency_code ?? 'USD',
        status,
        date,
        postedAt,
        name: tx.name,
        merchantName: tx.merchant_name ?? null,
        rawPayload: raw,
      },
      update: {
        linkedAccountId,
        amount: String(tx.amount),
        currency: tx.iso_currency_code ?? 'USD',
        status,
        date,
        postedAt,
        name: tx.name,
        merchantName: tx.merchant_name ?? null,
        rawPayload: raw,
      },
    });
  }
}
