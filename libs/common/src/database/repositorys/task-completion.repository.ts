import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskCompletionDocument } from '../models/task-completion.schema';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class TaskCompletionRepository extends AbstractRepository<TaskCompletionDocument> {
  protected readonly logger = new Logger(TaskCompletionRepository.name);
  constructor(
    @InjectModel(TaskCompletionDocument.name)
    model: Model<TaskCompletionDocument>,
  ) {
    super(model);
  }
}
