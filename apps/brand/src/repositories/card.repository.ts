import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CardDocument } from '../models/card.schema';

@Injectable()
export class CardRepository extends AbstractRepository<CardDocument> {
  protected readonly logger = new Logger(CardDocument.name);

  constructor(@InjectModel(CardDocument.name) card: Model<CardDocument>) {
    super(card);
  }
}
