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

  async socialSubmision(
    input: TaskSubmissionDto,
    i: number,
    callback: VoidFunction,
  ) {
    //check if the social media platform provided is also part of the task.
    const socialMediaPlatform: string = input?.socialMediaPlatform;

    //check if the social media platform is provided
    if (!socialMediaPlatform)
      throw new BadRequestException('Social media platform is required');

    //get the task type details
    const taskTypeDetails: ITaskType = this.task.task_type[i];

    //check if the task id is valid
    const details = taskTypeDetails.tasks.find((e) => e.id === input.id);

    if (!details) throw new BadRequestException('Invalid task');

    //check if the user has already submitted for this task with the same social media platform
    await this.validateSubmission({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      categoryId: taskTypeDetails.categoryId,
      task_id: input.id,
      socialMediaPlatform: details.socialMediaPlatform,
    });

    //create the submission for this task with correct categoryId
    const result = await this.submissionRepository.create({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      categoryId: taskTypeDetails.categoryId,
      socialMediaPlatform: details.socialMediaPlatform,
      submission_url: input.submission_url,
      task_id: input.id,
    });

    //get total social tasks submitted by user for this task

    callback();

    return result;
  }

  async userGeneratedSubmision(
    input: TaskSubmissionDto,
    i: number,
    callback: VoidFunction,
  ) {
    //get the task type details
    const taskTypeDetails: ITaskType = this.task.task_type[i];

    //check if the task id is valid
    const details = taskTypeDetails.tasks.find((e) => e.id === input.id);
    if (!details) throw new BadRequestException('Invalid task');

    //check if the user has already submitted for this task with the same social media platform
    await this.validateSubmission({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      categoryId: taskTypeDetails.categoryId,
      task_id: input.id,
    });

    //create the submission for this task with correct categoryId
    const result = await this.submissionRepository.create({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      categoryId: taskTypeDetails.categoryId,
      socialMediaPlatform: details.socialMediaPlatform,
      submission_url: input.submission_url,
      task_id: input.id,
    });

    callback();

    return result;
  }

  async customSubmision(
    input: TaskSubmissionDto,
    i: number,
    callback: VoidFunction,
  ) {
    //get the task type details
    const taskTypeDetails: ITaskType = this.task.task_type[i];

    //check if the task id is valid
    const details = taskTypeDetails.tasks.find((e) => e.id === input.id);
    if (!details) throw new BadRequestException('Invalid task');

    //check if the user has already submitted for this task with the same social media platform
    await this.validateSubmission({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      categoryId: taskTypeDetails.categoryId,
      task_id: input.id,
    });

    //create the submission for this task with correct categoryId
    const result = await this.submissionRepository.create({
      task_uuid: this.task.uuid,
      user_uuid: this.user.uuid,
      categoryId: taskTypeDetails.categoryId,
      socialMediaPlatform: details.socialMediaPlatform,
      submission_url: input.submission_url,
      task_id: input.id,
    });

    //get total social tasks submitted by user for this task
    callback();

    return result;
  }
}
