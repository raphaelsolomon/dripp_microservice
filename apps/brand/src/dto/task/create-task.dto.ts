import { IsDateString } from 'class-validator';

export class CreateTaskDto {
  campaign_banner_url: string;

  campaign_title: string;

  locations: ILocation[];

  task_type: ICampaignTaskItem[];

  reward_type: 'FIAT' | 'USDT';

  campaign_type?: 'public' | 'private' | 'members';

  campaign_amount: number;

  selected_members?: string[];

  @IsDateString()
  campaign_end_date: Date;

  reward_per_engagement?: string;
}

interface ICampaignTask {
  url?: string;
  id?: string;
  instructions: string;
  submissionType: 'url' | 'image' | 'text';
  socialMediaPlatform?: string; // required only if the category id is social media
}

export interface ICampaignTaskItem {
  categoryId: 'social_media' | 'user_generated' | 'custom';
  categoryName: string; // social media, User generated or custom name when user selects new type
  tasks: ICampaignTask[];
}

export interface ILocation {
  country: string;
  states: string[];
}
