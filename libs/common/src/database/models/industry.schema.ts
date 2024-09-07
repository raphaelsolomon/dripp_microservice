import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';

@Schema({ versionKey: false })
export class IndustryDocument extends AbstractDocument {
  @Prop({ required: true })
  name: string;
}

export const IndustrySchema = SchemaFactory.createForClass(IndustryDocument);
