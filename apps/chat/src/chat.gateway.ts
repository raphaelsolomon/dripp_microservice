import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { ChatEventEnum } from './constants/chats.enums';
import { CreateMessageDto } from './dto/create-message.dto';
import { IsTypingDto } from './dto/istyping.dto';
import { MarkReadMsgDto } from './dto/mark-msg-read.dto';
import { ChatMessagesBody, ChatUsersBody } from './constants/types.constant';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(socket: Socket) {
    return this.chatService.handleConnection(socket, this.server);
  }

  handleDisconnect(socket: Socket) {
    return this.chatService.handleDisconnection(socket, this.server);
  }

  /* emit a message event to the other user/participants websocket event */
  @SubscribeMessage(ChatEventEnum.CREATE_MESSAGE_EVENT)
  async createMessage(
    @MessageBody() input: CreateMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.createMessage(input, socket);
  }

  /* emit a typing event to the other user/participants websocket event */
  @SubscribeMessage(ChatEventEnum.TYPING_EVENT_EVENT)
  async setIsTyping(
    @MessageBody() input: IsTypingDto,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.setIsTyping(input, socket);
  }

  /* Get list of all chat user websocket event */
  @SubscribeMessage(ChatEventEnum.GET_CHAT_USERS_EVENT)
  getAllChats(
    @MessageBody() body: ChatUsersBody,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.getAllChats(body, socket);
  }

  /* Get archive chat websocket event */
  @SubscribeMessage(ChatEventEnum.GET_ARCHIVED_CHAT_EVENT)
  getArchivedRooms(
    @MessageBody() body: ChatUsersBody,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.getArchivedRooms(body, socket);
  }

  /* Get message betwen two users websocket event */
  @SubscribeMessage(ChatEventEnum.GET_MESSAGES_EVENT)
  getChatMessages(
    @MessageBody() body: ChatMessagesBody,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.getChatMessages(body, socket);
  }

  /* Archive chat websocket event */
  @SubscribeMessage(ChatEventEnum.ARCHIVE_ROOM_EVENT)
  archiveChatByChatUuid(
    @MessageBody('room_id') _id: string,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.archiveChatByChat(_id, socket);
  }

  /* Unarchive chat websocket event */
  @SubscribeMessage(ChatEventEnum.UNARCHIVE_ROOM_EVENT)
  unArchiveChatByChatUuid(
    @MessageBody('room_id') _id: string,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.unArchiveChatByChat(_id, socket);
  }

  /* Get archive chat count websocket event */
  @SubscribeMessage(ChatEventEnum.GET_ARCHIVED_CHAT_COUNT_EVENT)
  getArchivedRoomsCount(@ConnectedSocket() socket: Socket) {
    return this.chatService.getArchivedRoomsCount(socket);
  }

  /* mark chats as read websocket event */
  @SubscribeMessage(ChatEventEnum.MARK_MESSAGES_AS_READ)
  markMessagesAsRead(
    @MessageBody('room_ids') _ids: string[],
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.markMessagesAsRead(_ids, socket);
  }

  /* mark chats as read websocket event */
  @SubscribeMessage(ChatEventEnum.MARK_MESSAGE_AS_READ)
  markMessageAsRead(
    @MessageBody() input: MarkReadMsgDto,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.markMessageAsRead(input, socket);
  }

  /* archive multiple chat rooms websocket event */
  @SubscribeMessage(ChatEventEnum.ARCHIVE_MULTIPLE_ROOM_EVENT)
  archiveMultipleRooms(
    @MessageBody('room_ids') _ids: string[],
    @ConnectedSocket() socket: Socket,
  ) {
    return this.chatService.archiveMultipleRooms(_ids, socket);
  }
}
