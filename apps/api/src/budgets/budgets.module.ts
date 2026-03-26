import { Module } from '@nestjs/common';
import { BudgetEngineService } from './budget-engine.service';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetEngineService],
  exports: [BudgetsService, BudgetEngineService],
})
export class BudgetsModule {}
