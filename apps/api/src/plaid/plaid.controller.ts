import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { ExchangePublicTokenDto } from './dto/exchange-public-token.dto';
import { LinkTokenResponseDto } from './dto/link-token-response.dto';
import { PlaidExchangeResponseDto } from './dto/plaid-exchange-response.dto';
import { PlaidSyncService } from './plaid-sync.service';

@ApiTags('plaid')
@ApiBearerAuth('JWT-auth')
@Controller('plaid')
export class PlaidController {
  constructor(private readonly plaidSync: PlaidSyncService) {}

  @Post('link-token')
  @ApiOperation({
    summary: 'Create Plaid Link token',
    description: 'Starts Link for the authenticated user (client_user_id = user id).',
  })
  @ApiCreatedResponse({ type: LinkTokenResponseDto })
  async createLinkToken(@CurrentUser() user: AuthUser): Promise<LinkTokenResponseDto> {
    return this.plaidSync.createLinkToken(user);
  }

  @Post('exchange-token')
  @ApiOperation({
    summary: 'Exchange public token for access token',
    description:
      'Completes Link: exchanges `public_token`, stores encrypted access token, upserts accounts, pulls balances and transactions.',
  })
  @ApiOkResponse({ type: PlaidExchangeResponseDto })
  async exchange(
    @CurrentUser() user: AuthUser,
    @Body() body: ExchangePublicTokenDto,
  ): Promise<PlaidExchangeResponseDto> {
    return this.plaidSync.exchangePublicToken(user, body.public_token);
  }

  @Post('items/:itemId/sync')
  @ApiOperation({
    summary: 'Manual resync for a Plaid item',
    description:
      'Refreshes balances and runs `/transactions/sync` for the item (`itemId` is the internal PlaidItem id).',
  })
  @ApiOkResponse({ description: 'Sync completed' })
  async resync(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
  ): Promise<{ ok: true }> {
    await this.plaidSync.syncItemForUser(user, itemId);
    return { ok: true };
  }
}
