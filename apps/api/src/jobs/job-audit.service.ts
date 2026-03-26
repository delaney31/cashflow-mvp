import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Persists failed job metadata for observability (dashboards / alerts on the ops side).
 */
@Injectable()
export class JobAuditService {
  private readonly logger = new Logger(JobAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logFailure(params: {
    queueName: string;
    jobName: string;
    bullJobId?: string;
    payload?: unknown;
    error: string;
    attempts: number;
    durationMs?: number;
    userId?: string;
  }): Promise<void> {
    const errText = params.error.slice(0, 8000);
    try {
      await this.prisma.backgroundJobLog.create({
        data: {
          queueName: params.queueName,
          jobName: params.jobName,
          bullJobId: params.bullJobId ?? null,
          payload:
            params.payload === undefined
              ? undefined
              : (JSON.parse(JSON.stringify(params.payload)) as Prisma.InputJsonValue),
          status: 'failed',
          error: errText,
          attempts: params.attempts,
          durationMs: params.durationMs ?? null,
          userId: params.userId ?? null,
        },
      });
    } catch (e) {
      this.logger.error('Failed to persist BackgroundJobLog', e);
    }
    this.logger.error(
      `Job failed queue=${params.queueName} job=${params.jobName} attempts=${params.attempts} err=${errText.slice(0, 500)}`,
    );
  }
}
