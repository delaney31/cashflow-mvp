import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class TransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter from date (inclusive, ISO date)', example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter to date (inclusive, ISO date)', example: '2025-03-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by linked account id' })
  @IsOptional()
  @IsString()
  linkedAccountId?: string;
}
