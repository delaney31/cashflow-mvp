import { Module } from '@nestjs/common';
import { BudgetsModule } from '../budgets/budgets.module';
import { ScenarioEngineService } from './scenario-engine.service';
import { ScenariosController } from './scenarios.controller';
import { ScenariosService } from './scenarios.service';

@Module({
  imports: [BudgetsModule],
  controllers: [ScenariosController],
  providers: [ScenariosService, ScenarioEngineService],
  exports: [ScenariosService],
})
export class ScenariosModule {}
