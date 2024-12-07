import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SubmissionType, TaskCategory } from '../dto/task/create-task.dto';
import { Types } from 'mongoose';

@Schema({ versionKey: false })
export class SubTaskDocument extends AbstractDocument {
  @Prop({ required: false, default: '' })
  url?: string;

  @Prop({ required: true })
  instructions: string;

  @Prop({
    required: true,
    type: String,
    enum: ['text', 'url', 'image'] as SubmissionType[],
  })
  submissionType: SubmissionType;

  @Prop({ required: false, default: '' })
  socialMediaPlatform?: string;

  @Prop({
    required: true,
    type: String,
    enum: ['social_media', 'user_generated', 'custom'] as TaskCategory[],
  })
  categoryId: TaskCategory;

  @Prop({ required: true })
  categoryName: string;

  @Prop({ required: true })
  reward_amount: number;

  @Prop({ required: true })
  campaign_uuid: string;

  @Prop({ required: true })
  brand_uuid: string;
}

export const SubTaskSchema = SchemaFactory.createForClass(SubTaskDocument);
