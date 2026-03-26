import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AccountsModule } from './accounts/accounts.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { BalancesModule } from './balances/balances.module';
import { BudgetsModule } from './budgets/budgets.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GoalsModule } from './goals/goals.module';
import { HealthModule } from './health/health.module';
import { PlaidModule } from './plaid/plaid.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    PlaidModule,
    AuthModule,
    HealthModule,
    UsersModule,
    AccountsModule,
    BalancesModule,
    TransactionsModule,
    BudgetsModule,
    GoalsModule,
    AlertsModule,
    ScenariosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
