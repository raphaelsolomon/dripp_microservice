import {
  SubmissionType,
  TaskCategory,
} from 'apps/brand/src/dto/task/create-task.dto';

interface IBrandDetails {
  _id: string;
  brand_name: string;
  bio: string;
  industry: string;
  uuid: string;
  created_at: string;
  updated_at: string;
}

export interface ITask {
  _id: string;
  campaign_title: string;
  campaign_banner_url: string;
  task_type: ITaskType[];
  campaign_type: 'public' | 'private' | 'members';
  campaign_end_date: Date;
  selected_members: string[];
  reward_type: 'FIAT' | 'USDT';
  total_task: number;
  brand: IBrandDetails;
  uuid: string;
}

export interface ICampaignTask {
  url?: string;
  instructions: string;
  submissionType: SubmissionType;
  socialMediaPlatform?: string; // required only if the category id is social media
  reward_amount: number | string;
  _id?: string;
  uuid?: string;
  categoryId?: TaskCategory;
  categoryName?: string;
  brand_uuid?: string;
  campaign_uuid: string;
}

interface ITaskDetails {
  instruction: string;
  submissionType: 'url' | 'image' | 'text';
  url?: string;
  id?: string;
  socialMediaPlatform?: string;
}

export interface ITaskType {
  categoryId: 'social_media' | 'user_generated' | 'custom';
  categoryName: string;
  tasks: ITaskDetails[];
}
