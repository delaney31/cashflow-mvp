import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const DECIMAL_SIGNED = /^-?\d+(\.\d{1,4})?$/;
const DECIMAL_NONNEG = /^\d+(\.\d{1,4})?$/;

export enum ScenarioAdjustmentKind {
  ONE_TIME_CASH = 'one_time_cash',
  RECURRING_MONTHLY = 'recurring_monthly',
  DEBT_PAYOFF = 'debt_payoff',
}

export class ScenarioAdjustmentDto {
  @ApiProperty({ enum: ScenarioAdjustmentKind })
  @IsEnum(ScenarioAdjustmentKind)
  type!: ScenarioAdjustmentKind;

  @ApiPropertyOptional({ example: 'Down payment' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({
    description: 'For one_time_cash: positive = cash in, negative = cash out.',
  })
  @ValidateIf((o) => o.type === ScenarioAdjustmentKind.ONE_TIME_CASH)
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_SIGNED, {
    message: 'amount must be a decimal string (optional leading minus)',
  })
  amount?: string;

  @ApiPropertyOptional({ description: 'For recurring_monthly: positive = higher surplus.' })
  @ValidateIf((o) => o.type === ScenarioAdjustmentKind.RECURRING_MONTHLY)
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_SIGNED, {
    message: 'netMonthlyImpact must be a decimal string',
  })
  netMonthlyImpact?: string;

  @ApiPropertyOptional({ description: 'For debt_payoff: cash paid toward principal.' })
  @ValidateIf((o) => o.type === ScenarioAdjustmentKind.DEBT_PAYOFF)
  @IsNotEmpty()
  @IsString()
  @Matches(DECIMAL_NONNEG, {
    message: 'principalPayment must be a non-negative decimal string',
  })
  principalPayment?: string;

  @ApiPropertyOptional({ description: 'Monthly payment obligation removed after payoff.' })
  @ValidateIf((o) => o.type === ScenarioAdjustmentKind.DEBT_PAYOFF)
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_NONNEG, {
    message: 'monthlyPaymentRemoved must be a non-negative decimal string',
  })
  monthlyPaymentRemoved?: string;
}
