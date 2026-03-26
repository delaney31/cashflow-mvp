import { ApiProperty } from '@nestjs/swagger';

export class LinkTokenResponseDto {
  @ApiProperty()
  linkToken!: string;

  @ApiProperty()
  expiration!: string;
}
