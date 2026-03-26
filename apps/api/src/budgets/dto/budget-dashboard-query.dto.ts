import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class BudgetDashboardQueryDto {
  @ApiPropertyOptional({ description: 'Calendar year', example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Month 1-12', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    enum: ['posted', 'pending', 'all'],
    description:
      'Which transactions to include for spend math: posted only, pending only, or both.',
    default: 'posted',
  })
  @IsOptional()
  @IsIn(['posted', 'pending', 'all'])
  transactionView?: 'posted' | 'pending' | 'all';
}
