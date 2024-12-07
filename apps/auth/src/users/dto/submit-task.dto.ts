export class TaskSubmissionDto {
  categoryId: string;

  submission_file?: Express.Multer.File[] | Express.Multer.File;

  submission_url?: string;

  submission_text?: string;

  id: string;

  socialMediaPlatform?: string;
}
