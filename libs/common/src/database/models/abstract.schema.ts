import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema()
export class AbstractDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop({ default: Date.now, required: false })
  created_at?: Date;

  @Prop({ default: Date.now, required: false })
  updated_at?: Date;
}
