import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const DECIMAL_NONNEG = /^\d+(\.\d{1,4})?$/;

export class AffordabilityCoachDto {
  @ApiProperty({ example: '25000.00', description: 'Proposed one-time cost (decimal string).' })
  @IsString()
  @Matches(DECIMAL_NONNEG, { message: 'proposedAmount must be a non-negative decimal string' })
  proposedAmount!: string;

  @ApiPropertyOptional({ example: 'Used car purchase' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Optional horizon for comparing cost to surplus (informational for the model).',
    default: 1,
    minimum: 1,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  compareHorizonMonths?: number;
}
