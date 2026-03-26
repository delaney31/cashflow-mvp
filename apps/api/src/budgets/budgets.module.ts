import { Module } from '@nestjs/common';
import { BudgetEngineService } from './budget-engine.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { ForecastSnapshotService } from './forecast-snapshot.service';

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetEngineService, ForecastSnapshotService],
  exports: [BudgetsService, BudgetEngineService, ForecastSnapshotService],
})
export class BudgetsModule {}
