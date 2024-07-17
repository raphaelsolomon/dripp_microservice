import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../../../../libs/common/src/database/models/abstract.schema';

@Schema({ versionKey: false })
export class MemberDocument extends AbstractDocument {
  @Prop({ default: null, ref: 'userdocuments' })
  member_uuid?: string;

  @Prop({ default: null })
  brand?: string;
}

export const MemberSchema = SchemaFactory.createForClass(MemberDocument);
