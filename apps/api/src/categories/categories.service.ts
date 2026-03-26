import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { CategoryListItemResponse } from '../contracts/api-responses';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser): Promise<CategoryListItemResponse[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId: user.userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });
    return rows;
  }
}
