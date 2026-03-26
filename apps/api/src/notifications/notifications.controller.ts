import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('push-devices')
  @ApiOperation({
    summary: 'Register Expo / FCM push token for the current user',
    description: 'Upserts by token. Server uses EXPO_ACCESS_TOKEN to send via Expo Push API.',
  })
  async registerPushDevice(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterPushDeviceDto,
  ): Promise<{ ok: true }> {
    await this.prisma.pushDevice.upsert({
      where: { token: dto.token },
      create: {
        userId: user.userId,
        token: dto.token,
        platform: dto.platform ?? null,
      },
      update: {
        userId: user.userId,
        platform: dto.platform ?? null,
      },
    });
    return { ok: true };
  }
}
