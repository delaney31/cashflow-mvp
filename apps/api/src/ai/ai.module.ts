import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BalancesModule } from '../balances/balances.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { ScenariosModule } from '../scenarios/scenarios.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AiController } from './ai.controller';
import { AiExplanationService } from './ai-explanation.service';
import { OpenAiClientService } from './openai-client.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'ai',
          ttl: 60_000,
          limit: 100,
        },
      ],
      getTracker: (req: Record<string, unknown>) => {
        const u = req['user'] as { userId?: string } | undefined;
        return u?.userId ?? String(req['ip'] ?? 'anon');
      },
    }),
    BudgetsModule,
    TransactionsModule,
    BalancesModule,
    ScenariosModule,
  ],
  controllers: [AiController],
  providers: [OpenAiClientService, AiExplanationService],
  exports: [OpenAiClientService, AiExplanationService],
})
export class AiModule {}
