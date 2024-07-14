import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskDocument } from '../models/task.schema';

@Injectable()
export class TaskRepository extends AbstractRepository<TaskDocument> {
  protected readonly logger = new Logger(TaskRepository.name);

  constructor(@InjectModel(TaskDocument.name) taskModel: Model<TaskDocument>) {
    super(taskModel);
  }
}
