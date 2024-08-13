import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BrandDocument } from './brand.schema';

@Schema({ versionKey: false })
export class BrandGiftCardDocument extends AbstractDocument {
  @Prop({ required: true })
  gift_card_product: string;

  @Prop({ required: false, default: null })
  state?: string;

  @Prop({ required: false, default: null })
  country?: string;

  @Prop({ required: true })
  actual_amount: number;

  @Prop({ required: true })
  gift_card_amount: number;

  @Prop({ required: false, default: '#E8ACBC' })
  gift_card_color?: string;

  @Prop({ required: false, default: 0 })
  gift_card_campaign_amount?: number;

  @Prop({ ref: BrandDocument.name })
  brand: string;
}

export const BrandGiftCardSchema = SchemaFactory.createForClass(
  BrandGiftCardDocument,
);
