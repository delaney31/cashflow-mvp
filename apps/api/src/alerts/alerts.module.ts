import { Module } from '@nestjs/common';
import { BudgetsModule } from '../budgets/budgets.module';
import { AlertEngineService } from './alert-engine.service';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  imports: [BudgetsModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertEngineService],
})
export class AlertsModule {}
