import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from './abstract.schema';

@Schema({ versionKey: false })
export class TaskSubmissionDocument extends AbstractDocument {
  @Prop({ required: true })
  campaign_uuid: string;

  @Prop({ required: false, default: false })
  user_uuid: string;

  @Prop({ required: false, default: '' })
  submission_url?: string;

  @Prop({ required: false, default: [] })
  submission_images?: string[];

  @Prop({ required: false, default: '' })
  submission_text?: string;

  @Prop({ required: true })
  sub_task_uuid: string;
}
export const TaskSubmissionSchema = SchemaFactory.createForClass(
  TaskSubmissionDocument,
);
