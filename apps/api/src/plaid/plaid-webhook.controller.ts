import { createHash } from 'crypto';
import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PlaidSyncService } from './plaid-sync.service';
import { PlaidWebhookVerifierService } from './plaid-webhook-verifier.service';

type RequestWithRaw = Request & { rawBody?: Buffer };

@ApiExcludeController()
@Public()
@Controller('webhooks')
export class PlaidWebhookController {
  private readonly logger = new Logger(PlaidWebhookController.name);

  constructor(
    private readonly verifier: PlaidWebhookVerifierService,
    private readonly plaidSync: PlaidSyncService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('plaid')
  @HttpCode(200)
  async handle(
    @Req() req: RequestWithRaw,
    @Headers('plaid-verification') verification: string | undefined,
  ): Promise<{ received: true }> {
    const raw = req.rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new BadRequestException('Raw body required for webhook verification');
    }
    const ok = await this.verifier.verify(raw, verification);
    if (!ok) {
      throw new UnauthorizedException('Invalid Plaid webhook signature');
    }

    const bodyHash = createHash('sha256').update(raw).digest('hex');
    try {
      await this.prisma.plaidWebhookDedupe.create({
        data: { bodyHash },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        this.logger.log(`Duplicate Plaid webhook payload ${bodyHash.slice(0, 12)}…; skipping handler`);
        return { received: true };
      }
      throw e;
    }

    const body =
      typeof req.body === 'object' && req.body !== null
        ? (req.body as Record<string, unknown>)
        : (JSON.parse(raw.toString('utf8')) as Record<string, unknown>);
    await this.plaidSync.handleWebhookPayload({
      webhook_type: body.webhook_type as string | undefined,
      webhook_code: body.webhook_code as string | undefined,
      item_id: body.item_id as string | undefined,
    });
    return { received: true };
  }
}
