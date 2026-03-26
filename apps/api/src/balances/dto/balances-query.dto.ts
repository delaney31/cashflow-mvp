import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class BalancesQueryDto {
  @ApiPropertyOptional({
    description: 'If true, calls Plaid balances before returning latest snapshots',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  refresh?: boolean;
}
