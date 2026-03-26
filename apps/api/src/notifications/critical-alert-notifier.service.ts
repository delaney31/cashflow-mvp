import { Injectable, Logger } from '@nestjs/common';
import type { Alert } from '@cashflow/db';
import { PushNotificationService } from './push-notification.service';

/**
 * Bridges alert engine → push (critical only). Keeps alert evaluation free of transport details.
 */
@Injectable()
export class CriticalAlertNotifierService {
  private readonly logger = new Logger(CriticalAlertNotifierService.name);

  constructor(private readonly push: PushNotificationService) {}

  async notifyAlertCreated(userId: string, alert: Alert): Promise<void> {
    if (!this.push.shouldNotifyForSeverity(alert.severity)) {
      return;
    }
    await this.push.sendToUser(userId, {
      title: alert.title,
      body: alert.body ?? 'Open Cashflow for details.',
      data: {
        alertId: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
      },
    });
    this.logger.log(`Critical alert push queued user=${userId} alert=${alert.id}`);
  }
}
