import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import { NotificationModule } from './notification.module';
import { AllExceptionsFilter, NOTIFICATION_SERVICE } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  const configService = app.get(ConfigService);

  app.enableCors({ origin: configService.get<string>('ALLOWED_ORIGINS') });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: NOTIFICATION_SERVICE,
    },
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: false }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();

  await app.listen(configService.get<number>('NOTIFICATION_HTTP_PORT'));
}
bootstrap();
