import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ versionKey: false })
export class CryptoPaymentDocument extends AbstractDocument {
  @Prop({ required: true })
  created_by: string;

  @Prop({ default: false })
  paid_to_user_wallet?: boolean;

  @Prop({ required: true })
  invoice_id: string;
}

export const CryptoPaymentSchema = SchemaFactory.createForClass(
  CryptoPaymentDocument,
);
