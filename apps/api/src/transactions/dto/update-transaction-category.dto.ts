import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTransactionCategoryDto {
  @ApiPropertyOptional({
    description: 'User category id, or omit / send empty string to clear override',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  userCategoryId?: string;
}
