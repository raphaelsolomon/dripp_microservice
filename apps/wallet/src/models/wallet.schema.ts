import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CurrencyCode = 'usd' | 'ngn' | 'usdttrc20';

export type CurrencyType = 'crypto' | 'fiat';

export interface Currency {
  name: string;
  code: CurrencyCode;
  type: CurrencyType;
  symbol: string;
}

export const currencies: Currency[] = [
  { code: 'ngn', name: 'Naira', symbol: '₦', type: 'fiat' },
  { code: 'usd', name: 'Dollars', symbol: '$', type: 'fiat' },
  {
    code: 'usdttrc20',
    name: 'Tether (USDT TRON)',
    symbol: 'USDT',
    type: 'crypto',
  },
];

interface Balance {
  amount: number;
  name: string;
  code: CurrencyCode;
  type: CurrencyType;
  symbol: string;
  updated_at: string;
}

@Schema({ versionKey: false })
export class WalletDocument extends AbstractDocument {
  // @Prop({ default: 0.0 })
  // amount_in_fiat?: number;

  // @Prop({ default: 0.0 })
  // amount_in_usdt?: number;

  @Prop({ default: [] })
  balances: Balance[];

  @Prop({ default: '' })
  pin?: string;

  @Prop({
    required: true,
    type: String,
    enum: ['ngn', 'usd', 'usdttrc20'] as CurrencyCode[],
    default: 'usd',
  })
  default_wallet?: CurrencyCode;

  @Prop({
    default: false,
  })
  pinLocked?: boolean;

  @Prop({ default: 0 })
  pinAttempts?: number;
}

export const WalletSchema = SchemaFactory.createForClass(WalletDocument);
