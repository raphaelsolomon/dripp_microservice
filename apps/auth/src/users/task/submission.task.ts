import { SubmissionRepository, UserDocument } from '@app/common';
import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TaskSubmissionDto } from '../dto/submit-task.dto';
import { ITask, ITaskType } from '../../constants/task.constant';

export class TaskSubmission {
  constructor(
    private readonly submissionRepository: SubmissionRepository,
    private readonly user: UserDocument,
    private readonly task: ITask,
  ) {}

  private async validateSubmission(input: Record<string, any>) {
    try {
      await this.submissionRepository.findOne({ ...input });
    } catch (err) {
      return;
    }
    throw new UnprocessableEntityException('Submission already exist.');
  }

  async submitTask(
    payload: {
      submission_url: string;
      submission_text: string;
      submission_images: string[];
      task_id: string;
    },

    callback: VoidFunction,
  ) {
    await this.validateSubmission({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,

      sub_task_uuid: payload?.task_id,
    });

    const result = await this.submissionRepository.create({
      campaign_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      submission_url: payload?.submission_url,
      sub_task_uuid: payload?.task_id,
      submission_images: payload?.submission_images,
      submission_text: payload?.submission_text,
    });

    callback();

    return result;
  }
}
