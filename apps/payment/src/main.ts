import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: false }));
  app.useLogger(app.get(Logger));
  await app.listen(configService.get<string>('PAYMENT_PORT'));
}
bootstrap();
