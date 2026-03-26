import { Module } from '@nestjs/common';
import { RecurringController } from './recurring.controller';
import { RecurringDetectionService } from './recurring-detection.service';
import { RecurringService } from './recurring.service';

@Module({
  controllers: [RecurringController],
  providers: [RecurringService, RecurringDetectionService],
  exports: [RecurringService, RecurringDetectionService],
})
export class RecurringModule {}
