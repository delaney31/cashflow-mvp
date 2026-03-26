import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import {
  defaultJobOptions,
  QUEUE_ALERT_GENERATION,
  QUEUE_FORECAST_RECOMPUTE,
  QUEUE_PLAID_SYNC,
  QUEUE_RECURRING_DETECTION,
} from './job-queues';

/**
 * Enqueues BullMQ jobs when Redis is configured. No-ops when REDIS_URL is absent (local dev without worker).
 */
@Injectable()
export class JobEnqueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobEnqueueService.name);
  private connection: Redis | null = null;
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      this.connection = new Redis(url, { maxRetriesPerRequest: null });
      this.logger.log('Job queues enabled (REDIS_URL set)');
    } else {
      this.logger.warn('REDIS_URL not set — job enqueue disabled (API still runs)');
    }
  }

  isEnabled(): boolean {
    return this.connection !== null;
  }

  private getQueue(name: string): Queue | null {
    if (!this.connection) return null;
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, { connection: this.connection });
      this.queues.set(name, q);
    }
    return q;
  }

  async enqueuePlaidSync(plaidItemRecordId: string): Promise<void> {
    const q = this.getQueue(QUEUE_PLAID_SYNC);
    if (!q) return;
    await q.add(
      'sync',
      { plaidItemRecordId },
      {
        ...defaultJobOptions,
        jobId: `plaid-sync:${plaidItemRecordId}`,
      },
    );
  }

  async enqueueForecastRecompute(userId: string): Promise<void> {
    const q = this.getQueue(QUEUE_FORECAST_RECOMPUTE);
    if (!q) return;
    await q.add('recompute', { userId }, { ...defaultJobOptions });
  }

  async enqueueRecurringDetection(userId: string): Promise<void> {
    const q = this.getQueue(QUEUE_RECURRING_DETECTION);
    if (!q) return;
    await q.add('detect', { userId }, { ...defaultJobOptions });
  }

  async enqueueAlertGeneration(userId: string): Promise<void> {
    const q = this.getQueue(QUEUE_ALERT_GENERATION);
    if (!q) return;
    await q.add('evaluate', { userId }, { ...defaultJobOptions });
  }

  async onModuleDestroy(): Promise<void> {
    for (const q of this.queues.values()) {
      await q.close();
    }
    this.queues.clear();
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
  }
}
