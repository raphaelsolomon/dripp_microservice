import { AbstractDocument, UserDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { BrandDocument } from './brand.schema';
import { ILocation } from '../dto/task/create-task.dto';

@Schema({ versionKey: false })
export class TaskDocument extends AbstractDocument {
  //=============================Important fields==========================
  @Prop({ required: true })
  campaign_title: string;

  @Prop({ default: null })
  campaign_banner_url: string;

  @Prop({ required: true, type: Types.Array })
  locations: ILocation[];

  @Prop({ type: Types.Array, required: true })
  task_type: Record<string, any>[];

  @Prop({ default: 'public', enum: ['public', 'private', 'members'] })
  campaign_type?: string;

  @Prop({ default: null })
  reward_per_engagement?: string;

  @Prop({ default: [] })
  selected_members?: string[];

  @Prop({ default: 'FIAT', enum: ['FIAT', 'USDT'] })
  reward_type: string;

  @Prop({ default: 0, required: true })
  campaign_amount: number;
  // =========================Other fields=========================
  @Prop({ required: false })
  industry?: string;

  @Prop({ required: false, default: 0 })
  total_task?: number;

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
