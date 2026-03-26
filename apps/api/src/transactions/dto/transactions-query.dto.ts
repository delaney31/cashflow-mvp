import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@cashflow/db';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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

  @ApiPropertyOptional({ enum: TransactionStatus, description: 'Posted vs pending' })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by user-assigned category id' })
  @IsOptional()
  @IsString()
  userCategoryId?: string;

  @ApiPropertyOptional({ description: 'Search name or merchant (case-insensitive)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
