import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterPushDeviceDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Expo push token or FCM-compatible token string',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  token!: string;

  @ApiPropertyOptional({ example: 'ios', description: 'Client platform hint' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  platform?: string;
}
