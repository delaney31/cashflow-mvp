import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateScenarioDto {
  @ApiProperty({ example: 'What if rent +$200?', description: 'Human-readable label' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: { horizonMonths: 3, expenseDelta: -200 },
    description: 'Structured scenario inputs (MVP: echoed in mock output)',
  })
  @IsObject()
  inputs!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Optional precomputed outputs (ignored in MVP mock)' })
  @IsOptional()
  @IsObject()
  outputs?: Record<string, unknown>;
}
