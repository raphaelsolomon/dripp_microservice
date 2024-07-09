import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as session from 'express-session';
import { Transport } from '@nestjs/microservices';
import { WalletModule } from './wallet.module';

const sessionData = {
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
};

async function bootstrap() {
  const app = await NestFactory.create(WalletModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: configService.get<number>('WALLET_TCP_PORT'),
    },
  });
  const secret = configService.get<string>('WALLET_SESSION_SECRET');
  app.use(cookieParser());
  app.use(session({ ...sessionData, secret }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: false }));
  app.useLogger(app.get(Logger));
  await app.startAllMicroservices();
  await app.listen(configService.get<number>('WALLET_HTTP_PORT'));
}
bootstrap();
