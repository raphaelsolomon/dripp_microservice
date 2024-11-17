import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';
import { Types } from 'mongoose';

@Schema({ versionKey: false })
export class TaskCompletionDocument extends AbstractDocument {
  @Prop({ required: true })
  task_uuid: string;

  @Prop({ required: false, default: false })
  user_uuid: string;

  @Prop({ required: false, default: 1 })
  total_completed?: number;
}
export const TaskCompletionSchema = SchemaFactory.createForClass(
  TaskCompletionDocument,
);
