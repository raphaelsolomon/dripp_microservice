import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskDocument } from '../models/task.schema';
import { SubTaskDocument } from '../models/sub-task.schema';

@Injectable()
export class SubTaskRepository extends AbstractRepository<SubTaskDocument> {
  protected readonly logger = new Logger(SubTaskRepository.name);

  constructor(
    @InjectModel(SubTaskDocument.name) subtaskModel: Model<SubTaskDocument>,
  ) {
    super(subtaskModel);
  }
}
