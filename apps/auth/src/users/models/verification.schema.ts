import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class VerificationDocument extends AbstractDocument {
  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: false })
  code: string;

  @Prop({ required: false })
  expires_at: number;
}
export const VerificationSchema =
  SchemaFactory.createForClass(VerificationDocument);
