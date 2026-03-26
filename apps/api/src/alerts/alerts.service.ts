import { Injectable, NotFoundException } from '@nestjs/common';
import type { Alert } from '@cashflow/db';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { AlertEvaluationResponse, AlertResponse } from '../contracts/api-responses';
import { PrismaService } from '../prisma/prisma.service';
import { AlertEngineService } from './alert-engine.service';
import { AlertListStatusFilter } from './dto/list-alerts-query.dto';

function jsonToMetadataRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapAlert(a: Alert): AlertResponse {
  return {
    id: a.id,
    dedupeKey: a.dedupeKey,
    severity: a.severity as AlertResponse['severity'],
    alertType: a.alertType,
    title: a.title,
    body: a.body,
    metadata: jsonToMetadataRecord(a.metadata),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: AlertEngineService,
  ) {}

  async list(user: AuthUser, status: AlertListStatusFilter | undefined): Promise<AlertResponse[]> {
    const filter = status ?? AlertListStatusFilter.active;
    const where =
      filter === AlertListStatusFilter.all
        ? { userId: user.userId }
        : filter === AlertListStatusFilter.resolved
          ? { userId: user.userId, resolvedAt: { not: null } }
          : { userId: user.userId, resolvedAt: null };

    const rows = await this.prisma.alert.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map(mapAlert);
  }

  async resolve(user: AuthUser, alertId: string): Promise<AlertResponse> {
    const existing = await this.prisma.alert.findFirst({
      where: { id: alertId, userId: user.userId },
    });
    if (!existing) {
      throw new NotFoundException('Alert not found');
    }
    if (existing.resolvedAt) {
      return mapAlert(existing);
    }
    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });
    return mapAlert(updated);
  }

  async evaluate(user: AuthUser): Promise<AlertEvaluationResponse> {
    const summary = await this.engine.evaluateForUser(user.userId);
    return {
      userId: summary.userId,
      evaluatedAt: summary.evaluatedAt,
      upserts: summary.upserts,
      resolves: summary.resolves,
    };
  }
}
