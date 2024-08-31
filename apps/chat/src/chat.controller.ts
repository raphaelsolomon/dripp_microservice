import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrentUser, JwtAuthGuard, UserDocument } from '@app/common';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  createChatServiceRoute(@CurrentUser() user: UserDocument) {
    if (user.chat_uuid !== undefined) {
      throw new BadRequestException('Chat service already exists');
    }
    this.chatService.createChatService(user);
  }

  @MessagePattern('create_chat')
  createChatService(@Payload() payload: { [key: string]: string }) {
    return this.chatService.createChatService(payload);
  }
}
