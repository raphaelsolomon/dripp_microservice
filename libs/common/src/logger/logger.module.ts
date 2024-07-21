import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import * as pinoMultiStream from 'pino-multi-stream';
import * as pinoTcp from 'pino-tcp';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configservice: ConfigService) => ({
        pinoHttp: {
          autoLogging: true,
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              singleLine: true,
            },
          },
          stream: pinoMultiStream.multistream([
            { stream: process.stdout },
            {
              stream: pinoTcp.createWriteStream({
                host: configservice.get<string>('LOGSTASH_HOST'),
                port: configservice.get<number>('LOGSTASH_PORT') ?? 5044,
              }),
            },
          ]),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class LoggerModule {}
