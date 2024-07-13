import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  DatabaseModule,
  LoggerModule,
  AUTH_SERVICE,
  CloudinaryModule,
} from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrandRepository } from './repositories/brand.repository';
import { BrandDocument, BrandSchema } from './models/brand.schema';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { MemberDocument, MemberSchema } from './models/members.schema';
import { MemberRepository } from './repositories/member.repository';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: BrandDocument.name, schema: BrandSchema },
      { name: MemberDocument.name, schema: MemberSchema },
    ]),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        BRAND_HTTP_PORT: Joi.number().required(),
        BRAND_TCP_PORT: Joi.number().required(),
        AUTH_HOST: Joi.string().required(),
        AUTH_PORT: Joi.number().required(),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_HOST'),
            port: configService.get<number>('AUTH_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService, BrandRepository, MemberRepository],
})
export class AppModule {}
