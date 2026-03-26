import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AiExplanationResponse, AiStructuredExplanation } from '../../contracts/api-responses';

export class AiStructuredExplanationDto implements AiStructuredExplanation {
  @ApiProperty()
  headline!: string;

  @ApiProperty({ type: [String] })
  keyPoints!: string[];

  @ApiPropertyOptional({ type: [String] })
  cautions?: string[];

  @ApiPropertyOptional({ type: [String] })
  nextSteps?: string[];

  @ApiProperty()
  narrative!: string;
}

export class AiExplanationResponseDto implements AiExplanationResponse {
  @ApiProperty({ type: AiStructuredExplanationDto })
  structured!: AiStructuredExplanationDto;

  @ApiProperty()
  text!: string;

  @ApiProperty({ description: 'OpenAI model id, or "deterministic" when no LLM call.' })
  model!: string;

  @ApiProperty()
  disclaimer!: string;
}
