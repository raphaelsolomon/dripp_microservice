import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AbstractDocument } from './abstract.schema';

@Schema({ versionKey: false })
export class TaskSubmissionDocument extends AbstractDocument {
  @Prop({ required: true })
  task_uuid: string;

  @Prop({ required: false, default: false })
  user_uuid: string;

  @Prop({ required: true, type: Types.Map })
  categoryId: string;

  @Prop({ required: false, default: null })
  socialMediaPlatform?: string;

  @Prop({ required: true })
  submission_url: string;

  @Prop({ required: true })
  task_id: string;
}
export const TaskSubmissionSchema = SchemaFactory.createForClass(
  TaskSubmissionDocument,
);
