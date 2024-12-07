import { Currency } from 'apps/wallet/src/models/wallet.schema';
import { IsDateString } from 'class-validator';

export class CreateTaskDto {
  campaign_banner_url: string;

  campaign_title: string;

  locations: ILocation[];

  task_type: ICampaignTaskItem[];

  reward_type: Currency;

  campaign_type?: 'public' | 'private' | 'members';

  campaign_amount: number;

  selected_members?: string[];

  @IsDateString()
  campaign_end_date: Date;

  // reward_per_engagement?: string;
}


export type SubmissionType = 'url' | 'image' | 'text';

interface ICampaignTask {
  url?: string;
  instructions: string;
  submissionType: SubmissionType;
  socialMediaPlatform?: string; // required only if the category id is social media
  reward_amount: number;
}

export type TaskCategory = 'social_media' | 'user_generated' | 'custom';

export interface ICampaignTaskItem {
  categoryId: TaskCategory;
  categoryName: string; // social media, User generated or custom name when user selects new type
  tasks: ICampaignTask[];
}

export interface ILocation {
  country: string;
  states: string[];
}
