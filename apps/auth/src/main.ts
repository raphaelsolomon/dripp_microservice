import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import { AllExceptionsFilter, AUTH_SERVICE } from '@app/common';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  const configService = app.get(ConfigService);

  app.enableCors({ origin: configService.get<string>('ALLOWED_ORIGINS') });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: AUTH_SERVICE,
    },
  });

  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: true },
    }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useLogger(app.get(Logger));

  await app.startAllMicroservices();

  await app.listen(configService.get<number>('AUTH_HTTP_PORT'));
}
bootstrap();
