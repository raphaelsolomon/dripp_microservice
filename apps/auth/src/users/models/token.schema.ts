import { AbstractDocument, UserDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class TokenDocument extends AbstractDocument {
  @Prop({ required: true, ref: UserDocument.name })
  user_id: string;

  @Prop({ required: true, default: null })
  refresh_token?: string;
}
export const TokenSchema = SchemaFactory.createForClass(TokenDocument);
