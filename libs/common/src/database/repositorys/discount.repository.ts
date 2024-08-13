import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from './abstract.repository';
import { UserDiscountDocument } from '../models/discount.schema';

@Injectable()
export class DiscountRepository extends AbstractRepository<UserDiscountDocument> {
  protected readonly logger = new Logger(DiscountRepository.name);

  constructor(
    @InjectModel(UserDiscountDocument.name)
    discountModel: Model<UserDiscountDocument>,
  ) {
    super(discountModel);
  }
}
