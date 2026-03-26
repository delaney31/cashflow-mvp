import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'Bearer access token (JWT)' })
  accessToken!: string;

  @ApiProperty({ description: 'Seconds until expiry', example: 604800 })
  expiresIn!: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType!: string;
}
