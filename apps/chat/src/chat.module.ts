import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatServiceRepository } from './repositories/chat-service.repository';
import { ChatGateway } from './chat.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import {
  AUTH_SERVICE,
  DatabaseModule,
  LoggerModule,
  UserDocument,
  UserSchema,
} from '@app/common';
import {
  ChatServiceDocument,
  ChatServiceSchema,
} from './models/chatservice.schema';
import { ChatRoomDocument, ChatRoomSchema } from './models/chatroom.schema';
import { MessageDocument, MessageSchema } from './models/message.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatController } from './chat.controller';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { MessageRepository } from './repositories/message.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        MONGODB_NAME: Joi.string().required(),
        CHAT_HTTP_PORT: Joi.number().required(),
      }),
    }),
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: MessageDocument.name, schema: MessageSchema },
      { name: ChatServiceDocument.name, schema: ChatServiceSchema },
      { name: ChatRoomDocument.name, schema: ChatRoomSchema },
      { name: UserDocument.name, schema: UserSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: AUTH_SERVICE,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    LoggerModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatServiceRepository,
    ChatRoomRepository,
    MessageRepository,
  ],
})
export class ChatModule {}
