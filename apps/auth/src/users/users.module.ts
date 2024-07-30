import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  BRAND_SERVICE,
  CloudinaryModule,
  DatabaseModule,
  NOTIFICATION_SERVICE,
  WALLET_SERVICE,
} from '@app/common';
import { UserDocument, UserSchema } from '@app/common';
import { UserRepository } from './users.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  VerificationDocument,
  VerificationSchema,
} from './models/verification.schema';
import { VerificationRepository } from './verification.repository';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: VerificationDocument.name, schema: VerificationSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: BRAND_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('BRAND_HOST'),
            port: configService.get<number>('BRAND_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: NOTIFICATION_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('NOTIFICATION_HOST'),
            port: configService.get<number>('NOTIFICATION_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: WALLET_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('WALLET_TCP_HOST'),
            port: configService.get<number>('WALLET_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, VerificationRepository],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
