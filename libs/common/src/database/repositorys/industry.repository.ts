import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from './abstract.repository';
import { IndustryDocument } from '../models/industry.schema';

@Injectable()
export class IndustryRepository extends AbstractRepository<IndustryDocument> {
  protected readonly logger = new Logger(IndustryRepository.name);

  constructor(
    @InjectModel(IndustryDocument.name)
    model: Model<IndustryDocument>,
  ) {
    super(model);
  }
}
