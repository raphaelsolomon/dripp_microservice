import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema()
export class AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop({ unique: true, default: uuidv4 })
  uuid?: string;

  @Prop({ default: Date.now, required: false })
  created_at?: Date;

  @Prop({ default: Date.now, required: false })
  updated_at?: Date;
}
