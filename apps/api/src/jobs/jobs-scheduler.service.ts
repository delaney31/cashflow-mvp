import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { JobEnqueueService } from './job-enqueue.service';

/**
 * Schedules periodic enqueue (API process). Workers consume from Redis.
 */
@Injectable()
export class JobsSchedulerService {
  private readonly logger = new Logger(JobsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enqueue: JobEnqueueService,
    private readonly config: ConfigService,
  ) {}

  private schedulerEnabled(): boolean {
    return this.enqueue.isEnabled() && this.config.get<string>('JOB_SCHEDULER_ENABLED', 'true') !== 'false';
  }

  /** Refresh Plaid transaction + balance data on a cadence (webhooks still drive real-time). */
  @Cron(CronExpression.EVERY_4_HOURS)
  async schedulePlaidSyncAll(): Promise<void> {
    if (!this.schedulerEnabled()) return;
    const items = await this.prisma.plaidItem.findMany({ select: { id: true } });
    for (const item of items) {
      await this.enqueue.enqueuePlaidSync(item.id);
    }
    this.logger.log(`Enqueued Plaid sync jobs: ${items.length} items`);
  }

  /** Per-user forecast snapshots, recurring heuristics, and alert engine evaluation. */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduleUserMaintenance(): Promise<void> {
    if (!this.schedulerEnabled()) return;
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const u of users) {
      await this.enqueue.enqueueForecastRecompute(u.id);
      await this.enqueue.enqueueRecurringDetection(u.id);
      await this.enqueue.enqueueAlertGeneration(u.id);
    }
    this.logger.log(`Enqueued user maintenance jobs: ${users.length} users × 3 queues`);
  }
}
