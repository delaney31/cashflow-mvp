import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeProtectedHeader, importJWK, jwtVerify, type JWK } from 'jose';
import { PlaidService } from './plaid.service';

function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

@Injectable()
export class PlaidWebhookVerifierService {
  private readonly logger = new Logger(PlaidWebhookVerifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly plaid: PlaidService,
  ) {}

  /**
   * Verifies Plaid-Verification JWT and request body SHA-256 per Plaid docs.
   * Set PLAID_WEBHOOK_VERIFY=false to skip (local dev only).
   */
  async verify(rawBody: Buffer, plaidVerificationHeader: string | undefined): Promise<boolean> {
    if (this.config.get<string>('PLAID_WEBHOOK_VERIFY') === 'false') {
      this.logger.warn('PLAID_WEBHOOK_VERIFY=false: skipping Plaid webhook JWT verification');
      return true;
    }
    if (!plaidVerificationHeader) {
      this.logger.warn('Missing Plaid-Verification header');
      return false;
    }
    try {
      const header = decodeProtectedHeader(plaidVerificationHeader);
      const kid = header.kid;
      if (typeof kid !== 'string' || !kid) {
        return false;
      }
      const keyResp = await this.plaid.client.webhookVerificationKeyGet({ key_id: kid });
      const key = await importJWK(keyResp.data.key as unknown as JWK);
      const plaidIssuers = [
        'https://sandbox.plaid.com',
        'https://production.plaid.com',
        'https://development.plaid.com',
      ];
      const { payload } = await jwtVerify(plaidVerificationHeader, key, {
        algorithms: ['ES256'],
        issuer: plaidIssuers,
        clockTolerance: 60,
      });
      const expectedHash = payload.request_body_sha256;
      if (typeof expectedHash !== 'string') {
        this.logger.warn('JWT missing request_body_sha256 claim');
        return false;
      }
      const actual = sha256Hex(rawBody);
      if (actual !== expectedHash) {
        this.logger.warn('Webhook body SHA-256 does not match JWT claim');
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`Plaid webhook verification failed: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  }
}
