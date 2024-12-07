import { extend } from 'joi';
import { AbstractDocument } from './abstract.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TrackerStatus = 'started' | 'submitted';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

@Schema({ versionKey: false })
export class SubTaskTrackerDocument extends AbstractDocument {
  @Prop({ required: true })
  sub_task_id: string;

  @Prop({ required: true })
  campaign_uuid: string;

  @Prop({ required: true })
  user_uuid: string;

  @Prop({ required: true })
  status: TrackerStatus;

  @Prop({ required: false, default: '' })
  submissionStatus?: SubmissionStatus;

  @Prop({ required: false, default: '' })
  submitted_at?: string;

  @Prop({ default: '' })
  reviewed_at?: string;

  @Prop({ required: false, default: '' })
  rejectionReason?: string;
}
export const SubTaskTrackerSchema = SchemaFactory.createForClass(
  SubTaskTrackerDocument,
);
