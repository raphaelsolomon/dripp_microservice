import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { BrandDiscountDocument } from '../models/discount.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DiscountRepository extends AbstractRepository<BrandDiscountDocument> {
  protected readonly logger = new Logger(DiscountRepository.name);

  constructor(
    @InjectModel(BrandDiscountDocument.name)
    discountModel: Model<BrandDiscountDocument>,
  ) {
    super(discountModel);
  }
}
