import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import { AllExceptionsFilter } from '@app/common';
import { ChatModule } from './chat.module';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: configService.get<number>('CHAT_TCP_PORT'),
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
