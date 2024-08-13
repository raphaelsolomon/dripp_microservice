import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BrandGiftCardDocument } from '../models/giftcard.schema';

@Injectable()
export class GiftCardRepository extends AbstractRepository<BrandGiftCardDocument> {
  protected readonly logger = new Logger(GiftCardRepository.name);

  constructor(
    @InjectModel(BrandGiftCardDocument.name)
    giftcardModel: Model<BrandGiftCardDocument>,
  ) {
    super(giftcardModel);
  }
}
