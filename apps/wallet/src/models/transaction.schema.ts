import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type TransactionCurrencyType = 'fiat' | 'usdt';

@Schema({ versionKey: false })
export class TransactionDocument extends AbstractDocument {
  @Prop({ required: true })
  wallet_uuid: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, type: Types.Map })
  transaction_details?: Record<string, any>;

  @Prop({ required: true })
  tx_ref: string;

  @Prop({ required: true })
  transaction_type: 'topup' | 'withdraw' | 'transfer';

  @Prop()
  transaction: 'debit' | 'credit';

  @Prop({
    enum: ['fiat', 'usdt'] as TransactionCurrencyType[],
    default: 'fiat',
  })
  currency_type?: TransactionCurrencyType;
}

export const TransactionSchema =
  SchemaFactory.createForClass(TransactionDocument);
