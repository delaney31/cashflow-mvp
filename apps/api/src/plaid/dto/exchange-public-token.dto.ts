import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class ExchangePublicTokenDto {
  @ApiProperty({ description: 'public_token from Plaid Link onSuccess' })
  @IsString()
  @MinLength(12)
  @MaxLength(500)
  @Matches(/^public-[A-Za-z0-9_-]+$/, {
    message: 'public_token must look like a Plaid public token (public-...)',
  })
  public_token!: string;
}
