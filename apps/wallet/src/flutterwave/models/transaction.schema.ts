import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

const enum TransactionType {
  'topup' = 'topup',
  'withdraw' = 'withdraw',
  'transfer' = 'transfer',
}

@Schema({ versionKey: false })
export class TransactionDocument extends AbstractDocument {
  @Prop({ unique: true, default: uuidv4 })
  uuid: string;

  @Prop({ required: true })
  wallet_uuid: string;

  @Prop({ required: true })
  tx_ref: string;

  @Prop({ default: new Date() })
  created_at: Date;

  @Prop({ required: true })
  transaction_type: TransactionType;
}

export const TransactionSchema =
  SchemaFactory.createForClass(TransactionDocument);
