import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertSeverity } from '@cashflow/db';
import { PrismaService } from '../prisma/prisma.service';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Expo Push API (mobile can register tokens via POST /notifications/push-devices).
 * When EXPO_ACCESS_TOKEN is unset, sends are logged only (dev-friendly).
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const devices = await this.prisma.pushDevice.findMany({ where: { userId } });
    if (devices.length === 0) {
      this.logger.debug(`push: no devices for user ${userId}`);
      return;
    }

    const expoAccessToken = this.config.get<string>('EXPO_ACCESS_TOKEN');
    const url = 'https://exp.host/--/api/v2/push/send';

    for (const d of devices) {
      const body = {
        to: d.token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
        priority: 'high' as const,
        channelId: 'critical-alerts',
      };

      if (!expoAccessToken) {
        this.logger.log(
          `push (dry-run, set EXPO_ACCESS_TOKEN): user=${userId} title=${payload.title} token=${d.token.slice(0, 12)}…`,
        );
        continue;
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${expoAccessToken}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          this.logger.warn(`Expo push failed ${res.status}: ${text.slice(0, 200)}`);
        }
      } catch (e) {
        this.logger.warn(`Expo push error for device ${d.id}`, e);
      }
    }
  }

  shouldNotifyForSeverity(severity: AlertSeverity): boolean {
    return severity === AlertSeverity.CRITICAL;
  }
}
