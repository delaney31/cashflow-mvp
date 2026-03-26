import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsModule } from '../alerts/alerts.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { PlaidModule } from '../plaid/plaid.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RecurringModule } from '../recurring/recurring.module';
import { JobAuditService } from './job-audit.service';
import { JobEnqueueService } from './job-enqueue.service';
import { JobProcessorService } from './job-processor.service';
import { JobsSchedulerService } from './jobs-scheduler.service';
import { JobsWorkerService } from './jobs-worker.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PlaidModule,
    BudgetsModule,
    RecurringModule,
    AlertsModule,
  ],
  providers: [
    JobAuditService,
    JobEnqueueService,
    JobProcessorService,
    JobsWorkerService,
    JobsSchedulerService,
  ],
  exports: [JobEnqueueService],
})
export class JobsModule {}
