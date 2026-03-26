import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

@Injectable()
export class TokenEncryptionService implements OnModuleInit {
  private readonly logger = new Logger(TokenEncryptionService.name);
  private key!: Buffer;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const raw = this.config.get<string>('PLAID_TOKEN_ENCRYPTION_KEY');
    if (!raw) {
      throw new Error(
        'PLAID_TOKEN_ENCRYPTION_KEY is required (base64-encoded 32-byte key for AES-256-GCM)',
      );
    }
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== KEY_LEN) {
      throw new Error('PLAID_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64)');
    }
    this.key = buf;
    this.logger.log('Plaid access token encryption key loaded');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(ciphertextB64: string): string {
    const buf = Buffer.from(ciphertextB64, 'base64');
    if (buf.length < IV_LEN + TAG_LEN) {
      throw new Error('Invalid encrypted token payload');
    }
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }
}
