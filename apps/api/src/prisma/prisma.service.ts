import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@cashflow/db';
import { assertRuntimeDatabaseUrl } from './runtime-database-url';

/**
 * Single PrismaClient for the API process (`PrismaModule` is `@Global()` singleton).
 * Connections use the pooled `DATABASE_URL` only (passed explicitly below).
 * `main.ts` enables shutdown hooks so `$disconnect` runs on SIGTERM/SIGINT (e.g. Render).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = assertRuntimeDatabaseUrl(process.env.DATABASE_URL);
    super({
      datasources: {
        db: { url },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
