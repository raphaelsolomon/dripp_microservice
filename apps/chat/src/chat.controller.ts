import {
  BadRequestException,
  Controller,
  Post,
  Req,
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
  async createChatServiceRoute(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    if (user.chat_uuid !== undefined) {
      throw new BadRequestException('Chat service already exists');
    }
    await this.chatService.createChatService(user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      success: true,
      message: 'Successful',
    };
  }

  @MessagePattern('create_chat')
  createChatService(@Payload() payload: { [key: string]: string }) {
    return this.chatService.createChatService(payload);
  }
}
