import { extend } from 'joi';
import { AbstractDocument } from './abstract.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

type TrackerStatus = 'started' | 'submitted';

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
}
export const SubTaskTrackerSchema = SchemaFactory.createForClass(
  SubTaskTrackerDocument,
);
