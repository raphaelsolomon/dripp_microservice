import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';

@Schema({ versionKey: false })
export class UserDiscountDocument extends AbstractDocument {
  @Prop({ required: true })
  product_name: string;

  @Prop({ required: false, default: null })
  discount_details?: string;

  @Prop({ required: false, default: 0 })
  discount_amount?: number;

  @Prop({ required: false, default: '#E8ACBC' })
  discount_color?: string;

  @Prop({ required: true })
  user_uuid: string;

  @Prop({ required: true })
  brand_uuid: string;
}

export const UserDiscountSchema =
  SchemaFactory.createForClass(UserDiscountDocument);
