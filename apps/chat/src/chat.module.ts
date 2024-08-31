import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatServiceRepository } from './repositories/chat-service.repository';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { MessageRepository } from './repositories/message.repository';
import { ChatGateway } from './chat.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { AUTH_SERVICE, DatabaseModule, LoggerModule } from '@app/common';
import {
  ChatServiceDocument,
  ChatServiceSchema,
} from './models/chatservice.schema';
import { ChatRoomDocument, ChatRoomSchema } from './models/chatroom.schema';
import { MessageDocument, MessageSchema } from './models/message.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        MONGODB_NAME: Joi.string().required(),
        CHAT_TCP_PORT: Joi.number().required(),
        CHAT_HTTP_PORT: Joi.number().required(),
        AUTH_HOST: Joi.string().required(),
        AUTH_TCP_PORT: Joi.number().required(),
      }),
    }),
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: MessageDocument.name, schema: MessageSchema },
      { name: ChatServiceDocument.name, schema: ChatServiceSchema },
      { name: ChatRoomDocument.name, schema: ChatRoomSchema },
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
    LoggerModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatServiceRepository,
    ChatRoomRepository,
    MessageRepository,
  ],
})
export class ChatModule {}
