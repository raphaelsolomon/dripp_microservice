import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as session from 'express-session';
import { Transport } from '@nestjs/microservices';
import { WalletModule } from './wallet.module';
import { AllExceptionsFilter, WALLET_SERVICE } from '@app/common';

const sessionData = {
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
};

async function bootstrap() {
  const app = await NestFactory.create(WalletModule);

  const configService = app.get(ConfigService);

  app.enableCors({ origin: configService.get<string>('ALLOWED_ORIGINS') });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: WALLET_SERVICE,
    },
  });

  const secret = configService.get<string>('WALLET_SESSION_SECRET');

  app.use(cookieParser());

  app.use(session({ ...sessionData, secret }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: false }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();

  await app.listen(configService.get<number>('WALLET_HTTP_PORT'));
}
bootstrap();
