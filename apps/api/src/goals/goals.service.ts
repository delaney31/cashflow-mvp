import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalStatus, Prisma } from '@cashflow/db';
import type { Goal } from '@cashflow/db';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { GoalResponse } from '../contracts/api-responses';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateGoalDto } from './dto/create-goal.dto';
import type { UpdateGoalDto } from './dto/update-goal.dto';

const activeWhere = (userId: string): Prisma.GoalWhereInput => ({
  userId,
  deletedAt: null,
  archivedAt: null,
  status: { in: [GoalStatus.ACTIVE, GoalStatus.PAUSED] },
});

const completedWhere = (userId: string): Prisma.GoalWhereInput => ({
  userId,
  deletedAt: null,
  archivedAt: null,
  status: GoalStatus.COMPLETED,
});

const deletedWhere = (userId: string): Prisma.GoalWhereInput => ({
  userId,
  deletedAt: { not: null },
});

const archivedWhere = (userId: string): Prisma.GoalWhereInput => ({
  userId,
  deletedAt: null,
  archivedAt: { not: null },
});

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapGoal(g: Goal): GoalResponse {
    return {
      id: g.id,
      title: g.title,
      type: g.type,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      dueDate: g.dueDate ? g.dueDate.toISOString().slice(0, 10) : null,
      status: g.status,
      priority: g.priority,
      notes: g.notes ?? null,
      archivedAt: g.archivedAt ? g.archivedAt.toISOString() : null,
      deletedAt: g.deletedAt ? g.deletedAt.toISOString() : null,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    };
  }

  async create(user: AuthUser, dto: CreateGoalDto): Promise<GoalResponse> {
    const created = await this.prisma.goal.create({
      data: {
        userId: user.userId,
        title: dto.title,
        type: dto.type,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount ?? '0',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? GoalStatus.ACTIVE,
        priority: dto.priority ?? 0,
        notes: dto.notes ?? null,
      },
    });
    return this.mapGoal(created);
  }

  async listActive(user: AuthUser): Promise<GoalResponse[]> {
    const rows = await this.prisma.goal.findMany({
      where: activeWhere(user.userId),
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((g) => this.mapGoal(g));
  }

  async listArchived(user: AuthUser): Promise<GoalResponse[]> {
    const rows = await this.prisma.goal.findMany({
      where: archivedWhere(user.userId),
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((g) => this.mapGoal(g));
  }

  async listCompleted(user: AuthUser): Promise<GoalResponse[]> {
    const rows = await this.prisma.goal.findMany({
      where: completedWhere(user.userId),
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((g) => this.mapGoal(g));
  }

  async listDeleted(user: AuthUser): Promise<GoalResponse[]> {
    const rows = await this.prisma.goal.findMany({
      where: deletedWhere(user.userId),
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map((g) => this.mapGoal(g));
  }

  async getById(user: AuthUser, id: string): Promise<GoalResponse> {
    const g = await this.prisma.goal.findFirst({
      where: { id, userId: user.userId },
    });
    if (!g) {
      throw new NotFoundException('Goal not found');
    }
    return this.mapGoal(g);
  }

  async update(user: AuthUser, id: string, dto: UpdateGoalDto): Promise<GoalResponse> {
    const existing = await this.prisma.goal.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    const data: Prisma.GoalUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.targetAmount !== undefined) data.targetAmount = dto.targetAmount;
    if (dto.currentAmount !== undefined) data.currentAmount = dto.currentAmount;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.archivedAt !== undefined) {
      if (dto.archivedAt === null) {
        data.archivedAt = null;
        if (dto.status === undefined) {
          data.status = GoalStatus.ACTIVE;
        }
      } else {
        data.archivedAt = new Date(dto.archivedAt);
        if (dto.status === undefined) {
          data.status = GoalStatus.ARCHIVED;
        }
      }
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data,
    });
    return this.mapGoal(updated);
  }

  async softDelete(user: AuthUser, id: string): Promise<GoalResponse> {
    const existing = await this.prisma.goal.findFirst({
      where: { id, userId: user.userId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }

    const deleted = await this.prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.mapGoal(deleted);
  }

  async restore(user: AuthUser, id: string): Promise<GoalResponse> {
    const existing = await this.prisma.goal.findFirst({
      where: { id, userId: user.userId, deletedAt: { not: null } },
    });
    if (!existing) {
      throw new NotFoundException('Deleted goal not found');
    }

    const restored = await this.prisma.goal.update({
      where: { id },
      data: { deletedAt: null },
    });
    return this.mapGoal(restored);
  }
}
