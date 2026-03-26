import { Module } from '@nestjs/common';
import { PlaidController } from './plaid.controller';
import { PlaidService } from './plaid.service';
import { PlaidSyncService } from './plaid-sync.service';
import { PlaidWebhookController } from './plaid-webhook.controller';
import { PlaidWebhookVerifierService } from './plaid-webhook-verifier.service';
import { TokenEncryptionService } from './token-encryption.service';

@Module({
  controllers: [PlaidController, PlaidWebhookController],
  providers: [
    PlaidService,
    TokenEncryptionService,
    PlaidSyncService,
    PlaidWebhookVerifierService,
  ],
  exports: [PlaidService, PlaidSyncService, TokenEncryptionService],
})
export class PlaidModule {}
