export class TaskSubmissionDto {
  task_uuid: string;

  campaign_type: string;

  submission_file?: Express.Multer.File;

  submission_url?: string;
}
