import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ versionKey: false })
export class TaskDocument extends AbstractDocument {
  @Prop({ default: null })
  campaign_title: string;

  @Prop({ default: null })
  campaign_banner_url: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ type: Types.Map })
  campaign_type: Record<string, any>;

  @Prop({ enum: ['file_upload', 'url_submission'], default: 'file_upload' })
  submission_type: string;

  @Prop({ default: null })
  non_member_reward?: string;

  @Prop({ default: null })
  member_reward?: string;

  @Prop({ default: 0, required: true })
  campaign_amount: number;

  @Prop({ required: true })
  brand_uuid?: string;
}

export const TaskSchema = SchemaFactory.createForClass(TaskDocument);
