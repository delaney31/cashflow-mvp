import { ApiProperty } from '@nestjs/swagger';
import type { AlertEvaluationResponse } from '../../contracts/api-responses';

export class AlertEvaluationResponseDto implements AlertEvaluationResponse {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  evaluatedAt!: string;

  @ApiProperty({ description: 'Approximate upsert operations during this run.' })
  upserts!: number;

  @ApiProperty({ description: 'Rows marked resolved in this run.' })
  resolves!: number;
}
