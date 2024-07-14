import { HasMimeType, IsFile, MaxFileSize } from 'nestjs-form-data';

export class CreateTaskDto {
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/jpeg', 'image/png', 'image/webp'])
  campaign_banner: Express.Multer.File;

  campaign_title: string;

  state: string;

  country: string;

  campaign_type: Record<string, any>;

  submission_type: 'file_upload' | 'url_submission';

  non_member_reward?: string;

  member_reward?: string;

  campaign_amount: number;
}
