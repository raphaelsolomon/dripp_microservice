import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AbstractRepository } from './abstract.repository';
import { SubTaskTrackerDocument } from '../models/sub-task-tracker.schema';

@Injectable()
export class SubTaskTrackerRepository extends AbstractRepository<SubTaskTrackerDocument> {
  protected readonly logger = new Logger(SubTaskTrackerRepository.name);
  constructor(
    @InjectModel(SubTaskTrackerDocument.name)
    model: Model<SubTaskTrackerDocument>,
  ) {
    super(model);
  }
}
