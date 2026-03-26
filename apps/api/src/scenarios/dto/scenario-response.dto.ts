import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ScenarioResponse } from '../../contracts/api-responses';

export class ScenarioResponseDto implements ScenarioResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Structured scenario definition (v1).' })
  inputs!: ScenarioResponse['inputs'];

  @ApiPropertyOptional({ description: 'Deterministic engine output (v1).' })
  outputs!: ScenarioResponse['outputs'];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
