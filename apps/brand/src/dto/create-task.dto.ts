import { HasMimeType, IsFile, MaxFileSize } from 'nestjs-form-data';

export class CreateTaskDto {
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/jpeg', 'image/png'])
  campaign_banner: Express.Multer.File;

  campaign_title: string;

  campaign_state: string;

  campaign_country: string;

  campaign_type: string;

  submission_type: string;

  non_member_reward?: string;

  member_reward?: string;

  campaign_amount: string;
}
