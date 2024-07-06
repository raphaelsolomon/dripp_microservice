import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ versionKey: false })
export class BusinessDocument extends AbstractDocument {
  @Prop({ required: true })
  userId: string;

  @Prop({ unique: true, default: uuidv4 })
  uuid: string;
}

export const BusinessSchema = SchemaFactory.createForClass(BusinessDocument);
