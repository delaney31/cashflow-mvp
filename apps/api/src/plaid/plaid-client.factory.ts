import { ConfigService } from '@nestjs/config';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export function createPlaidApi(config: ConfigService): PlaidApi {
  const clientId = config.get<string>('PLAID_CLIENT_ID');
  const secret = config.get<string>('PLAID_SECRET');
  const env = config.get<string>('PLAID_ENV', 'sandbox');

  if (!clientId || !secret) {
    throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set');
  }

  const basePath =
    env === 'production'
      ? PlaidEnvironments.production
      : env === 'development'
        ? 'https://development.plaid.com'
        : PlaidEnvironments.sandbox;

  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  return new PlaidApi(configuration);
}
