import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import { AllExceptionsFilter, BRAND_SERVICE } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({ origin: configService.get<string>('ALLOWED_ORIGINS') });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: BRAND_SERVICE,
    },
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();

  await app.listen(configService.get('BRAND_HTTP_PORT'));
}
bootstrap();
