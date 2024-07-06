import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessDocument } from './models/business.schema';

@Injectable()
export class BusinessRepository extends AbstractRepository<BusinessDocument> {
  protected readonly logger = new Logger(BusinessDocument.name);

  constructor(
    @InjectModel(BusinessDocument.name) userModel: Model<BusinessDocument>,
  ) {
    super(userModel);
  }
}
