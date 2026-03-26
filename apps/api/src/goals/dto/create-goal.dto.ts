import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalStatus, GoalType } from '@cashflow/db';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export class CreateGoalDto {
  @ApiProperty({ example: 'Emergency fund' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: GoalType, example: GoalType.CASH_BUFFER_TARGET })
  @IsEnum(GoalType)
  type!: GoalType;

  @ApiProperty({ example: '10000.0000', description: 'Decimal string, up to 4 fractional digits' })
  @IsString()
  @Matches(DECIMAL_PATTERN, {
    message: 'targetAmount must be a non-negative decimal string with at most 4 fractional digits',
  })
  targetAmount!: string;

  @ApiPropertyOptional({ example: '6200.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_PATTERN, {
    message: 'currentAmount must be a non-negative decimal string with at most 4 fractional digits',
  })
  currentAmount?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: GoalStatus, default: GoalStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(10_000)
  notes?: string | null;
}
