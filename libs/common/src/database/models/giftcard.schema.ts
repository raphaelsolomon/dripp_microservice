import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';

@Schema({ versionKey: false })
export class UserGiftCardDocument extends AbstractDocument {
  @Prop({ required: true })
  gift_card_product: string;

  @Prop({ required: false, default: null })
  gift_card_description?: string;

  @Prop({ required: true })
  gift_card_amount: number;

  @Prop({ required: false, default: '#E8ACBC' })
  gift_card_color?: string;

  @Prop({ required: true })
  user_uuid: string;

  @Prop({ required: true })
  brand_uuid: string;
}

export const UserGiftCardSchema =
  SchemaFactory.createForClass(UserGiftCardDocument);
