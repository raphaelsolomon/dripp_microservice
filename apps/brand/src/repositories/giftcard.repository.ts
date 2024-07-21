import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GiftCardDocument } from '../models/giftcard.schema';

@Injectable()
export class GiftCardRepository extends AbstractRepository<GiftCardDocument> {
  protected readonly logger = new Logger(GiftCardDocument.name);

  constructor(
    @InjectModel(GiftCardDocument.name) giftcardModel: Model<GiftCardDocument>,
  ) {
    super(giftcardModel);
  }
}
