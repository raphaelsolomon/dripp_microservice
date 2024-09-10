import { AbstractDocument, UserDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { BrandDocument } from './brand.schema';

export class SubmissionType {
  @Prop({ enum: ['file_upload', 'url_submission'], default: 'url_submission' })
  submission_type: string;
}

@Schema({ versionKey: false })
export class TaskDocument extends AbstractDocument {
  @Prop({ required: true })
  campaign_title: string;

  @Prop({ default: null })
  campaign_banner_url: string;

  @Prop({ required: false })
  industry?: string;

  @Prop({ required: true })
  states: string[][];

  @Prop({ required: true })
  countries: string[];

  @Prop({ required: false, default: 0 })
  total_task?: number;

  @Prop({ type: Types.Map })
  campaign_type: Record<
    string,
    Record<string | 'submission_type', string | SubmissionType>
  >;

  @Prop({ default: null })
  non_member_reward?: string;

  @Prop({ default: null })
  member_reward?: string;

  @Prop({ default: 'FIAT', enum: ['FIAT', 'USDT'] })
  currency: string;

  @Prop({ default: 0, required: true })
  campaign_amount: number;

  @Prop({
    type: [{ ref: UserDocument.name, type: SchemaTypes.String }],
    default: [],
  })
  members_completed?: [string];

  @Prop({
    type: [{ ref: UserDocument.name, type: SchemaTypes.String }],
    default: [],
  })
  members_review?: [string];

  @Prop({ default: 0, required: false })
  campaign_engagement?: number;

  @Prop({ ref: BrandDocument.name, type: SchemaTypes.String })
  brand?: string;

  @Prop({ type: Boolean, default: false })
  status: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(TaskDocument);
