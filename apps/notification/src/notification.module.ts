import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { AUTH_SERVICE, DatabaseModule, LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { NotifcationRepository } from './repositories/notification.repository';
import {
  NotificationDocument,
  NotificationSchema,
} from './schema/notification.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        MONGODB_NAME: Joi.string().required(),
        NOTIFICATION_HTTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        CLIENT_URL: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: NotificationDocument.name, schema: NotificationSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_HOST'),
            port: configService.get<number>('AUTH_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotifcationRepository],
})
export class NotificationModule {}
