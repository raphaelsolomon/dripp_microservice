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
import { ArchiveSingleRoomDto } from './dto/archive-single-room.dto';
import { MarkReadMsgsDto } from './dto/mark-msgs-read.dto';
import { MarkReadMsgDto } from './dto/mark-msg-read.dto';
import { ArchiveMultipleRoomDto } from './dto/archive-mutliple-room.dto';
import { ChatMessagesBody, ChatUsersBody } from './constants/types.constant';

@WebSocketGateway({ namespace: 'message', cors: { origin: '*' } })
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
  getAllChats(@MessageBody() body: ChatUsersBody) {
    return this.chatService.getAllChats(body);
  }

  /* Get archive chat websocket event */
  @SubscribeMessage(ChatEventEnum.GET_ARCHIVED_CHAT_EVENT)
  getArchivedRooms(@MessageBody() body: ChatUsersBody) {
    return this.chatService.getArchivedRooms(body);
  }

  /* Get message betwen two users websocket event */
  @SubscribeMessage(ChatEventEnum.GET_MESSAGES_EVENT)
  getChatMessages(@MessageBody() body: ChatMessagesBody) {
    return this.chatService.getChatMessages(body);
  }

  /* Archive chat websocket event */
  @SubscribeMessage(ChatEventEnum.ARCHIVE_ROOM_EVENT)
  archiveChatByChatUuid(@MessageBody() archivedChat: ArchiveSingleRoomDto) {
    return this.chatService.archiveChatByChat(archivedChat);
  }

  /* Unarchive chat websocket event */
  @SubscribeMessage(ChatEventEnum.UNARCHIVE_ROOM_EVENT)
  unArchiveChatByChatUuid(@MessageBody() archivedChat: ArchiveSingleRoomDto) {
    return this.chatService.unArchiveChatByChat(archivedChat);
  }

  /* Get archive chat count websocket event */
  @SubscribeMessage(ChatEventEnum.GET_ARCHIVED_CHAT_COUNT_EVENT)
  getArchivedRoomsCount(@MessageBody('chat_uuid') chat_uuid: string) {
    return this.chatService.getArchivedRoomsCount(chat_uuid);
  }

  /* mark chats as read websocket event */
  @SubscribeMessage(ChatEventEnum.MARK_MESSAGES_AS_READ)
  markMessagesAsRead(@MessageBody() input: MarkReadMsgsDto) {
    return this.chatService.markMessagesAsRead(input);
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
  archiveMultipleRooms(@MessageBody() input: ArchiveMultipleRoomDto) {
    return this.chatService.archiveMultipleRooms(input);
  }
}
