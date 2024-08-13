import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BrandDocument } from './brand.schema';

@Schema({ versionKey: false })
export class BrandDiscountDocument extends AbstractDocument {
  @Prop({ required: true })
  product_name: string;

  @Prop({ required: false, default: null })
  discount_details?: string;

  @Prop({ required: false })
  member_discount?: string;

  @Prop({ required: false })
  start_date?: string;

  @Prop({ required: false })
  end_date?: string;

  @Prop({ required: false, default: '#E8ACBC' })
  discount_color?: string;

  @Prop({ required: false, default: 0 })
  discount_amount?: number;

  @Prop({ ref: BrandDocument.name })
  brand: string;
}

export const BrandDiscountSchema = SchemaFactory.createForClass(
  BrandDiscountDocument,
);
