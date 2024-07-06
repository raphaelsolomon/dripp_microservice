import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  BUSINESS_SERVICE,
  DatabaseModule,
  NOTIFICATION_SERVICE,
} from '@app/common';
import { UserDocument, UserSchema } from './models/user.schema';
import { UserRepository } from './users.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  VerificationDocument,
  VerificationSchema,
} from './models/verification.schema';
import { VerificationRepository } from './verification.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: VerificationDocument.name, schema: VerificationSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: BUSINESS_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('BUSINESS_HOST'),
            port: configService.get<number>('BUSINESS_TCP_PORT'),
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
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, VerificationRepository],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
