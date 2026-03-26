import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum AlertListStatusFilter {
  active = 'active',
  resolved = 'resolved',
  all = 'all',
}

export class ListAlertsQueryDto {
  @ApiPropertyOptional({
    enum: AlertListStatusFilter,
    description: '`active` (default): unresolved only. `resolved`: resolved only. `all`: both.',
    default: AlertListStatusFilter.active,
  })
  @IsOptional()
  @IsEnum(AlertListStatusFilter)
  status?: AlertListStatusFilter;
}
