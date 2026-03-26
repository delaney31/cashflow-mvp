import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis';
import { JobAuditService } from './job-audit.service';
import { JobProcessorService } from './job-processor.service';
import {
  QUEUE_ALERT_GENERATION,
  QUEUE_FORECAST_RECOMPUTE,
  QUEUE_PLAID_SYNC,
  QUEUE_RECURRING_DETECTION,
} from './job-queues';

function userIdFromPayload(data: unknown): string | undefined {
  if (data && typeof data === 'object' && 'userId' in data) {
    return String((data as { userId: string }).userId);
  }
  return undefined;
}

/**
 * Runs BullMQ workers in-process when REDIS_URL is set and WORKER_ENABLED is not false.
 * Split to a dedicated process later by bootstrapping the same module with worker-only providers.
 */
@Injectable()
export class JobsWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsWorkerService.name);
  private connection: Redis | null = null;
  private workers: Worker[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly processor: JobProcessorService,
    private readonly audit: JobAuditService,
  ) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL');
    const enabled = this.config.get<string>('WORKER_ENABLED', 'true') !== 'false';
    if (!url || !enabled) {
      this.logger.warn('BullMQ workers not started (set REDIS_URL and WORKER_ENABLED=true)');
      return;
    }
    this.connection = new Redis(url, { maxRetriesPerRequest: null });

    const register = (queueName: string, fn: (job: Job) => Promise<unknown>): void => {
      const worker = new Worker(queueName, fn, { connection: this.connection! });
      worker.on('failed', (job, err) => {
        const e = err instanceof Error ? err : new Error(String(err));
        void this.onFailed(queueName, job, e);
      });
      this.workers.push(worker);
    };

    register(QUEUE_PLAID_SYNC, (job) => this.processor.processPlaidSync(job as Job<{ plaidItemRecordId: string }>));
    register(QUEUE_FORECAST_RECOMPUTE, (job) =>
      this.processor.processForecastRecompute(job as Job<{ userId: string }>),
    );
    register(QUEUE_RECURRING_DETECTION, (job) =>
      this.processor.processRecurringDetection(job as Job<{ userId: string }>),
    );
    register(QUEUE_ALERT_GENERATION, (job) =>
      this.processor.processAlertGeneration(job as Job<{ userId: string }>),
    );

    this.logger.log(`BullMQ workers listening on ${this.workers.length} queues`);
  }

  private async onFailed(queueName: string, job: Job | undefined, err: Error): Promise<void> {
    await this.audit.logFailure({
      queueName,
      jobName: job?.name ?? 'unknown',
      bullJobId: job?.id,
      payload: job?.data,
      error: err.message,
      attempts: job?.attemptsMade ?? 0,
      userId: userIdFromPayload(job?.data),
    });
  }

  async onModuleDestroy(): Promise<void> {
    for (const w of this.workers) {
      await w.close();
    }
    this.workers = [];
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
  }
}
