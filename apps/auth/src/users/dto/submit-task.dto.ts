export class TaskSubmissionDto {
  categoryId: string;

  submission_file?: Express.Multer.File;

  submission_url?: string;

  id: string;

  socialMediaPlatform?: string;
}
