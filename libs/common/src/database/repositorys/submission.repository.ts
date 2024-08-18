import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskSubmissionDocument } from '../models/submission.schema';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class SubmissionRepository extends AbstractRepository<TaskSubmissionDocument> {
  protected readonly logger = new Logger(SubmissionRepository.name);
  constructor(
    @InjectModel(TaskSubmissionDocument.name)
    submissionModel: Model<TaskSubmissionDocument>,
  ) {
    super(submissionModel);
  }
}
