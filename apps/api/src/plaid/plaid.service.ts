import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PlaidApi } from 'plaid';
import { createPlaidApi } from './plaid-client.factory';

@Injectable()
export class PlaidService implements OnModuleInit {
  private readonly logger = new Logger(PlaidService.name);
  readonly client: PlaidApi;

  constructor(private readonly config: ConfigService) {
    this.client = createPlaidApi(config);
  }

  onModuleInit(): void {
    this.logger.log(
      `Plaid client initialized (PLAID_ENV=${this.config.get('PLAID_ENV', 'sandbox')})`,
    );
  }
}
