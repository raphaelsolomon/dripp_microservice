import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import * as pinoMultiStream from 'pino-multi-stream';
import * as pinoSocket from 'pino-socket';

const streams = [
  { stream: process.stdout },
  {
    stream: pinoSocket({
      address: 'localhost',
      port: 5001,
    }),
  },
];

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
        stream: pinoMultiStream.multistream(streams),
      },
    }),
  ],
})
export class LoggerModule {}
