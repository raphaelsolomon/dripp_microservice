import { Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { ArchiveSingleRoomDto } from './dto/archive-single-room.dto';
import { MarkReadMsgsDto } from './dto/mark-msgs-read.dto';
import { ArchiveMultipleRoomDto } from './dto/archive-mutliple-room.dto';
import { IsTypingDto } from './dto/istyping.dto';
import { MarkReadMsgDto } from './dto/mark-msg-read.dto';
import { ChatServiceRepository } from './repositories/chat-service.repository';
import { MessageRepository } from './repositories/message.repository';
import { ChatEventEnum } from './constants/chats.enums';
import { ChatRoomDocument } from './models/chatroom.schema';
import { ChatMessagesBody, ChatUsersBody } from './constants/types.constant';
import { AUTH_SERVICE, PopulateDto, UserDocument } from '@app/common';
import { MessageDocument } from './models/message.schema';
import { ChatRoomRepository } from './repositories/chat-room.repository';
import { WsException } from '@nestjs/websockets';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatServiceRpository: ChatServiceRepository,
    private readonly messageRepository: MessageRepository,
    private readonly chatRoomRepository: ChatRoomRepository,
    @Inject(AUTH_SERVICE) private readonly authClientproxy: ClientProxy,
  ) {}

  async handleConnection(socket: Socket, server: Server) {
    const uuid: string = socket.handshake.query?.chatUuid as string;
    if (uuid) {
      const updatePayload = { clientId: socket.id, status: true };
      await this.chatServiceRpository.findOneAndUpdate({ uuid }, updatePayload);
      socket.join(uuid);
      const filterQueryMessage = { receiver_uuid: uuid, status: 'SENT' };
      const updateQuery = { status: 'DELIVERED' };
      await this.messageRepository.updateMany(filterQueryMessage, updateQuery);
      const payload = { status: 'online', uuid };
      server.except(socket.id).emit(ChatEventEnum.USER_STATUS_CHANGED, payload);
      // this.logger.log('A user connected:', uuid ?? socket.id);
    } else {
      throw new WsException('chat uuid was not provided');
    }
  }

  async handleDisconnection(socket: Socket, server: Server) {
    const uuid: string = socket.handshake.query?.chatUuid as string;
    const payload = { type: 'offline', status: false };
    const updateQuery = { clientId: null, status: false };
    await this.chatServiceRpository.findOneAndUpdate({ uuid }, updateQuery);
    payload['uuid'] = uuid;
    server.emit(ChatEventEnum.USER_STATUS_CHANGED, payload);
    // this.logger.log('A user disconnected:', uuid ?? socket.id);
  }

  async createMessage(input: CreateMessageDto, socket: Socket) {
    let selectedChatMessage: ChatRoomDocument = undefined;
    /*
      check if the this two user have had a conversion earlier,
      if yes get the room for that message.
    */
    const sender_uuid = input.sender_uuid;
    const receiver_uuid = input.receiver_uuid;
    const content_type: string = input.content_type;

    /*
      check if the this two user have had a conversion earlier,
      if no then create a new for this users
    */
    selectedChatMessage = await this.chatRoomRepository.findOneOrCreate(
      {
        participants: {
          $all: [sender_uuid, receiver_uuid],
        },
      },
      { participants: [sender_uuid, receiver_uuid] },
    );

    // Create a new message instance with appropriate metadata
    const message = await this.messageRepository.create({
      sender_uuid,
      receiver_uuid,
      content_type,
      chat: selectedChatMessage._id.toString(),
      content: {
        sender_uuid: input.content.sender_uuid,
        is_brand: input.content.is_brand,
        message: input.content.message,
      },
    });

    /* 
      check if the receiver is not a guest
      and check if the user is online update the
      message to DELIVERED
    */
    const filterQuery = { uuid: receiver_uuid, status: true };
    await this.chatServiceRpository.findOneAndUpdate(filterQuery, {
      status: 'DELIVERED',
    });

    await this.chatRoomRepository.findOneAndUpdate(selectedChatMessage._id, {
      lastMessage: message._id,
    });

    // logic to emit socket event about the new message created to the other participants
    selectedChatMessage.participants.forEach((uuid: string) => {
      if (uuid.toString() === sender_uuid) {
        // emit the message back to the sender.
        socket.emit(ChatEventEnum.MESSAGE_RECEIVED_EVENT, message);
      }
      // emit the receive message event to the other participants with received message as the payload
      socket.to(uuid).emit(ChatEventEnum.MESSAGE_RECEIVED_EVENT, message);
    });
  }

  async setIsTyping(isTypingDto: IsTypingDto, socket: Socket) {
    const id = isTypingDto.room_id;
    const chatRoom = await this.chatRoomRepository.findOne({ _id: id });
    chatRoom.participants.forEach((uuid: string) => {
      if (uuid.toString() === isTypingDto.sender_uuid) return;
      // emit the receive message event to the other participants with received message as the payload
      socket.in(uuid).emit('isTyping', {
        participant_uuid: isTypingDto.sender_uuid,
        isTyping: isTypingDto.isTyping,
        room_id: id,
      });
    });
    return;
  }

  async getAllChats(input: ChatUsersBody) {
    const page: number = input.page ?? 1;
    const first: number = input.first ?? 20;

    const populateUsers: PopulateDto = {
      path: 'participants',
      model: UserDocument.name,
      localField: 'participants',
      foreignField: 'uuid',
    };

    const populateMessage: PopulateDto = {
      path: 'lastMessage',
      model: MessageDocument.name,
      localField: 'lastMessage',
      foreignField: '_id',
    };

    const chatRooms = await this.chatRoomRepository.getPaginatedDocuments(
      first,
      page,
      {
        participants: { $in: [input.chat_uuid] },
        isArchivedFor: { $nin: [input.chat_uuid] },
      },
      '-updatedAt -__v -createdAt',
      [populateMessage, populateUsers],
    );

    for (let i = 0; i < chatRooms.data.length; i++) {
      const unReadMsgCount = await this.messageRepository.countDocs({
        chat: chatRooms.data[i]._id,
        receiver_uuid: input.chat_uuid,
        $or: [{ status: 'SENT' }, { status: 'DELIVERED' }],
      });
      chatRooms.data[i].unReadCount = unReadMsgCount;
    }

    return chatRooms;
  }

  async getChatMessages(input: ChatMessagesBody) {
    const { first, page, room_id, chat_uuid } = input;

    const defaultResponse = {
      data: [],
      paginatorInfo: {
        total: 0,
        currentPage: 1,
        lastPage: 1,
        perPage: 0,
        hasMorePages: false,
      },
    };

    try {
      await this.chatServiceRpository.findOne({
        uuid: chat_uuid,
      });

      const getChatRoom = await this.chatRoomRepository.findOne({
        _id: room_id,
      });
      return await this.messageRepository.getPaginatedDocuments(first, page, {
        chat: getChatRoom._id,
      });
    } catch (err) {
      return defaultResponse;
    }
  }

  async getArchivedRooms(input: ChatUsersBody) {
    const page: number = input.page ?? 1;
    const first: number = input.first ?? 20;

    const populateUsers: PopulateDto = {
      path: 'participants',
      model: UserDocument.name,
      localField: 'participants',
      foreignField: 'uuid',
    };

    const populateMessage: PopulateDto = {
      path: 'lastMessage',
      model: MessageDocument.name,
      localField: 'lastMessage',
      foreignField: '_id',
    };

    const chatRooms = await this.chatRoomRepository.getPaginatedDocuments(
      first,
      page,
      {
        participants: { $in: [input.chat_uuid] },
        isArchivedFor: { $in: [input.chat_uuid] },
      },
      '-updatedAt -__v -createdAt',
      [populateMessage, populateUsers],
    );

    for (let i = 0; i < chatRooms.data.length; i++) {
      const unReadMsgCount = await this.messageRepository.countDocs({
        chat: chatRooms.data[i]._id,
        receiver_uuid: input.chat_uuid,
        $or: [{ status: 'SENT' }, { status: 'DELIVERED' }],
      });
      chatRooms.data[i].unReadCount = unReadMsgCount;
    }

    return chatRooms;
  }

  async archiveChatByChat(input: ArchiveSingleRoomDto) {
    const chat_uuid = input.chat_uuid;
    const uuid = input.room_uuid;

    const chatRoom = await this.chatRoomRepository.findOne({ uuid });
    if (!chatRoom) return;

    const archivedUsers = chatRoom.isArchivedFor;
    if (!archivedUsers.includes(chat_uuid)) archivedUsers.push(chat_uuid);

    return this.chatRoomRepository.findOneAndUpdate(
      { uuid },
      { isArchivedFor: archivedUsers },
    );
  }

  async unArchiveChatByChat(input: ArchiveSingleRoomDto) {
    const chat_uuid = input.chat_uuid;
    const uuid = input.room_uuid;

    const chatRoom = await this.chatRoomRepository.findOne({ uuid });
    if (!chatRoom) return;
    const archivedUsers = chatRoom.isArchivedFor.filter((e) => e !== chat_uuid);

    return this.chatRoomRepository.findOneAndUpdate(
      { uuid },
      { isArchivedFor: archivedUsers },
    );
  }

  async getArchivedRoomsCount(chat_uuid: string) {
    const count = await this.chatRoomRepository.countDocs({
      participants: { $in: [chat_uuid] },
      isArchivedFor: { $in: [chat_uuid] },
    });
    return count;
  }

  async markMessagesAsRead(input: MarkReadMsgsDto) {
    input.room_ids.forEach(async (id) => {
      await this.messageRepository.updateMany(
        {
          chat: id,
          receiver_uuid: input.chat_uuid,
          $or: [{ status: 'SENT' }, { status: 'DELIVERED' }],
        },
        { status: 'READ' },
      );
    });
    return;
  }

  async markMessageAsRead(input: MarkReadMsgDto, socket: Socket) {
    const _id = input.room_id;
    const message_id = input.message_id;

    const chatRoom = await this.chatRoomRepository.findOne({ _id });
    if (!chatRoom) return;
    await this.messageRepository.findOneAndUpdate(
      {
        chat: chatRoom._id,
        _id: message_id,
        receiver_uuid: input.chat_uuid,
      },
      { status: 'READ' },
    );
    const message = await this.messageRepository.findOne({ _id: message_id });

    chatRoom.participants.forEach((uuid) => {
      if (uuid === input.chat_uuid) return;
      socket.in(uuid).emit(ChatEventEnum.MESSAGE_READ, { chatRoom, message });
    });
    return;
  }

  async archiveMultipleRooms(input: ArchiveMultipleRoomDto) {
    const chat_uuid = input.chat_uuid;
    const room_uuids = input.room_uuids;
    const archivedRooms: string[] = [];

    for (let i = 0; i < room_uuids.length; i++) {
      const chatRoom = await this.chatRoomRepository.findOne({
        uuid: room_uuids[i],
      });
      if (!chatRoom) return;
      const archivedUsers = chatRoom.isArchivedFor;
      if (!archivedUsers.includes(chat_uuid)) {
        archivedUsers.push(chat_uuid);
        archivedRooms.push(chatRoom.uuid);
      }
      await this.chatRoomRepository.findOneAndUpdate(
        { uuid: room_uuids[i] },
        { isArchivedFor: archivedUsers },
      );
    }
    return archivedRooms;
  }
}
