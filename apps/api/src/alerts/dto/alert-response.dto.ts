import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AlertResponse, AlertSeverityApi } from '../../contracts/api-responses';

export class AlertResponseDto implements AlertResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Stable idempotency key (unique per user).' })
  dedupeKey!: string;

  @ApiProperty({
    description: 'Severity tier (INFO / WARNING / CRITICAL preferred; legacy LOW–HIGH may appear).',
  })
  severity!: AlertSeverityApi;

  @ApiProperty()
  alertType!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  body!: string | null;

  @ApiPropertyOptional()
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional()
  resolvedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
