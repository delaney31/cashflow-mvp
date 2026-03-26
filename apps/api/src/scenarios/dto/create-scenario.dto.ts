import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ScenarioAdjustmentDto } from './scenario-adjustment.dto';

export class CreateScenarioDto {
  @ApiProperty({ example: 'Buy a car' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Months to project buffer forward after one-time effects (linear, deterministic).',
    default: 12,
    minimum: 1,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  horizonMonths?: number;

  @ApiProperty({ type: [ScenarioAdjustmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScenarioAdjustmentDto)
  adjustments!: ScenarioAdjustmentDto[];
}
