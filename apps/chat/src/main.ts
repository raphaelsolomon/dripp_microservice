import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import { AllExceptionsFilter, CHAT_SERVICE } from '@app/common';
import { ChatModule } from './chat.module';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);

  const configService = app.get(ConfigService);

  app.enableCors({ origin: configService.get<string>('ALLOWED_ORIGINS') });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: CHAT_SERVICE,
    },
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();

  await app.listen(configService.get('CHAT_HTTP_PORT'));
}
bootstrap();
