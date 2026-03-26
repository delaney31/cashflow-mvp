import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalStatus, GoalType } from '@cashflow/db';
import type { GoalResponse } from '../../contracts/api-responses';

export class GoalResponseDto implements GoalResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: GoalType })
  type!: GoalType;

  @ApiProperty({ example: '10000.0000' })
  targetAmount!: string;

  @ApiProperty({ example: '6200.0000' })
  currentAmount!: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  dueDate!: string | null;

  @ApiProperty({ enum: GoalStatus })
  status!: GoalStatus;

  @ApiProperty()
  priority!: number;

  @ApiPropertyOptional()
  notes!: string | null;

  @ApiPropertyOptional()
  archivedAt!: string | null;

  @ApiPropertyOptional()
  deletedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
