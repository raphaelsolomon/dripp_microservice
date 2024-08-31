import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatRoomDocument } from '../models/chatroom.schema';

@Injectable()
export class ChatRoomRepository extends AbstractRepository<ChatRoomDocument> {
  protected readonly logger = new Logger(ChatRoomRepository.name);

  constructor(
    @InjectModel(ChatRoomDocument.name) model: Model<ChatRoomDocument>,
  ) {
    super(model);
  }
}
