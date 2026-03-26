import { ApiProperty } from '@nestjs/swagger';

export class PlaidExchangeResponseDto {
  @ApiProperty({ description: 'Internal PlaidItem id' })
  itemId!: string;

  @ApiProperty({ description: 'Plaid item_id string' })
  plaidItemId!: string;

  @ApiProperty()
  accountsLinked!: number;
}
