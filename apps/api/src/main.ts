import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function resolveListenPort(config: ConfigService): number {
  const raw = process.env.PORT?.trim() || config.get<string>('PORT')?.trim() || '3000';
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 3000;
}

function resolveListenHost(config: ConfigService): string {
  return process.env.HOST?.trim() || config.get<string>('HOST')?.trim() || '0.0.0.0';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Render (and similar) terminate TLS upstream; trust first proxy hop for req.ip / X-Forwarded-*.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // SIGTERM/SIGINT → run OnModuleDestroy (Prisma $disconnect) to avoid leaking DB connections
  app.enableShutdownHooks();

  app.setGlobalPrefix('v1', {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({ origin: true, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cashflow API')
    .setDescription(
      'MVP REST API. Authenticate via `POST /v1/auth/login`, then `Authorization: Bearer <token>`.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /v1/auth/login',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const config = app.get(ConfigService);
  const port = resolveListenPort(config);
  const host = resolveListenHost(config);
  await app.listen(port, host);
}

void bootstrap();
