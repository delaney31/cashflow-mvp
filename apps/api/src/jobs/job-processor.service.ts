import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { AlertEngineService } from '../alerts/alert-engine.service';
import { ForecastSnapshotService } from '../budgets/forecast-snapshot.service';
import { PlaidSyncService } from '../plaid/plaid-sync.service';
import { RecurringDetectionService } from '../recurring/recurring-detection.service';

export type PlaidSyncJobData = { plaidItemRecordId: string };
export type UserScopedJobData = { userId: string };

/**
 * Pure orchestration of domain services — no queue primitives here (testable in isolation).
 */
@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);

  constructor(
    private readonly plaidSync: PlaidSyncService,
    private readonly forecastSnapshot: ForecastSnapshotService,
    private readonly recurringDetection: RecurringDetectionService,
    private readonly alertEngine: AlertEngineService,
  ) {}

  async processPlaidSync(job: Job<PlaidSyncJobData>): Promise<{ ok: true }> {
    const { plaidItemRecordId } = job.data;
    this.logger.log(`Job plaid-sync start item=${plaidItemRecordId} jobId=${job.id}`);
    await this.plaidSync.syncPlaidItemByRecordId(plaidItemRecordId);
    return { ok: true };
  }

  async processForecastRecompute(job: Job<UserScopedJobData>): Promise<{ daysWritten: number }> {
    const { userId } = job.data;
    this.logger.log(`Job forecast-recompute user=${userId} jobId=${job.id}`);
    return this.forecastSnapshot.recomputeDailySnapshotsForUser(userId);
  }

  async processRecurringDetection(job: Job<UserScopedJobData>): Promise<{ patternsUpserted: number }> {
    const { userId } = job.data;
    this.logger.log(`Job recurring-detection user=${userId} jobId=${job.id}`);
    return this.recurringDetection.detectForUser(userId);
  }

  async processAlertGeneration(job: Job<UserScopedJobData>): Promise<Awaited<ReturnType<AlertEngineService['evaluateForUser']>>> {
    const { userId } = job.data;
    this.logger.log(`Job alert-generation user=${userId} jobId=${job.id}`);
    return this.alertEngine.evaluateForUser(userId);
  }
}
