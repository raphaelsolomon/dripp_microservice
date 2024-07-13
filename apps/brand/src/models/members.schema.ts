import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AbstractDocument } from '../../../../libs/common/src/database/models/abstract.schema';

@Schema({ versionKey: false })
export class MemberDocument extends AbstractDocument {
  @Prop({ unique: true, default: uuidv4 })
  uuid?: string;

  @Prop({ default: null, ref: 'userdocuments' })
  member_uuid?: string;

  @Prop({ default: null })
  brand_uuid?: string;
}

export const MemberSchema = SchemaFactory.createForClass(MemberDocument);
