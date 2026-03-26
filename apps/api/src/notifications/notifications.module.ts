import { Module } from '@nestjs/common';
import { CriticalAlertNotifierService } from './critical-alert-notifier.service';
import { NotificationsController } from './notifications.controller';
import { PushNotificationService } from './push-notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [PushNotificationService, CriticalAlertNotifierService],
  exports: [PushNotificationService, CriticalAlertNotifierService],
})
export class NotificationsModule {}
