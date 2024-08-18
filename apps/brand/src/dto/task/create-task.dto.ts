import { HasMimeType, IsFile, MaxFileSize } from 'nestjs-form-data';

class SubmissionType {
  submission_type: 'file_upload' | 'url_submission';
}

export class CampaignType {
  type: Record<
    string,
    Record<string | 'submission_type', string | SubmissionType | any>
  >;
}

export class CreateTaskDto {
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/jpeg', 'image/png', 'image/webp'])
  campaign_banner?: Express.Multer.File;

  campaign_title: string;

  state: string;

  country: string;

  campaign_type: string;

  non_member_reward?: string;

  member_reward?: string;

  general_reward?: number;

  campaign_amount: number;
}
