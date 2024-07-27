import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configservice: ConfigService) => ({
        pinoHttp: {
          autoLogging: true,
          level: 'info',
          transport:
            configservice.get<string>('NODE_ENV') === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                  },
                }
              : {
                  target: 'pino-socket',
                  options: {
                    address: configservice.get<string>('LOGSTASH_HOST'),
                    port: configservice.get<number>('LOGSTASH_PORT') ?? 5044,
                    mode: 'tcp',
                    reconnect: true,
                    recovery: true,
                  },
                },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class LoggerModule {}
