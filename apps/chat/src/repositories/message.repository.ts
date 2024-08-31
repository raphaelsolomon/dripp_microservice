import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageDocument } from '../models/message.schema';

@Injectable()
export class MessageRepository extends AbstractRepository<MessageDocument> {
  protected readonly logger = new Logger(MessageRepository.name);

  constructor(
    @InjectModel(MessageDocument.name) model: Model<MessageDocument>,
  ) {
    super(model);
  }
}
