import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { PaginatedResponse, TransactionResponse } from '../contracts/api-responses';
import type { TransactionsQueryDto } from './dto/transactions-query.dto';
import type { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, query: TransactionsQueryDto): Promise<PaginatedResponse<TransactionResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const and: Prisma.TransactionWhereInput[] = [{ linkedAccount: { userId: user.userId } }];
    if (query.linkedAccountId) {
      and.push({ linkedAccountId: query.linkedAccountId });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.userCategoryId) {
      and.push({ userCategoryId: query.userCategoryId });
    }
    if (query.from || query.to) {
      const date: Prisma.DateTimeFilter = {};
      if (query.from) {
        date.gte = new Date(`${query.from.slice(0, 10)}T00:00:00.000Z`);
      }
      if (query.to) {
        date.lte = new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`);
      }
      and.push({ date });
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { merchantName: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.TransactionWhereInput = { AND: and };

    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          aiCategory: true,
          userCategory: true,
        },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const items = rows.map((t) => this.mapRow(t));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
      },
    };
  }

  async getById(user: AuthUser, id: string): Promise<TransactionResponse | null> {
    const t = await this.prisma.transaction.findFirst({
      where: { id, linkedAccount: { userId: user.userId } },
      include: {
        aiCategory: true,
        userCategory: true,
      },
    });
    if (!t) return null;
    return this.mapRow(t);
  }

  async updateUserCategory(
    user: AuthUser,
    id: string,
    dto: UpdateTransactionCategoryDto,
  ): Promise<TransactionResponse> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, linkedAccount: { userId: user.userId } },
    });
    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    if (dto.userCategoryId === undefined) {
      const row = await this.getById(user, id);
      if (!row) throw new NotFoundException('Transaction not found');
      return row;
    }

    let nextId: string | null;
    if (dto.userCategoryId === '') {
      nextId = null;
    } else {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.userCategoryId, userId: user.userId },
      });
      if (!cat) {
        throw new NotFoundException('Category not found');
      }
      nextId = dto.userCategoryId;
    }

    await this.prisma.transaction.update({
      where: { id },
      data: { userCategoryId: nextId },
    });

    const updated = await this.getById(user, id);
    if (!updated) throw new NotFoundException('Transaction not found');
    return updated;
  }

  private mapRow(t: {
    id: string;
    linkedAccountId: string;
    amount: Prisma.Decimal;
    currency: string;
    status: string;
    date: Date;
    postedAt: Date | null;
    name: string;
    merchantName: string | null;
    aiCategoryId: string | null;
    aiCategory: { name: string } | null;
    userCategoryId: string | null;
    userCategory: { name: string } | null;
  }): TransactionResponse {
    return {
      id: t.id,
      linkedAccountId: t.linkedAccountId,
      amount: t.amount.toString(),
      currency: t.currency,
      status: t.status as TransactionResponse['status'],
      date: t.date.toISOString().slice(0, 10),
      postedAt: t.postedAt ? t.postedAt.toISOString() : null,
      name: t.name,
      merchantName: t.merchantName,
      aiCategoryId: t.aiCategoryId,
      aiCategoryName: t.aiCategory?.name ?? null,
      userCategoryId: t.userCategoryId,
      userCategoryName: t.userCategory?.name ?? null,
    };
  }
}
