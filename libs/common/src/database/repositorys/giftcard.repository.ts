import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from './abstract.repository';
import { UserGiftCardDocument } from '../models/giftcard.schema';

@Injectable()
export class GiftCardRepository extends AbstractRepository<UserGiftCardDocument> {
  protected readonly logger = new Logger(UserGiftCardDocument.name);

  constructor(
    @InjectModel(UserGiftCardDocument.name)
    gifcardModel: Model<UserGiftCardDocument>,
  ) {
    super(gifcardModel);
  }
}
