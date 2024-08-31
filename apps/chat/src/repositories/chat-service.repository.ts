import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatServiceDocument } from '../models/chatservice.schema';

@Injectable()
export class ChatServiceRepository extends AbstractRepository<ChatServiceDocument> {
  protected readonly logger = new Logger(ChatServiceDocument.name);

  constructor(
    @InjectModel(ChatServiceRepository.name) model: Model<ChatServiceDocument>,
  ) {
    super(model);
  }
}
