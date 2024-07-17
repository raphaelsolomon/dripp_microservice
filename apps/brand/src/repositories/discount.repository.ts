import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { DiscountDocument } from '../models/discount.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DiscountRepository extends AbstractRepository<DiscountDocument> {
  protected readonly logger = new Logger(DiscountDocument.name);

  constructor(
    @InjectModel(DiscountDocument.name) discountModel: Model<DiscountDocument>,
  ) {
    super(discountModel);
  }
}
