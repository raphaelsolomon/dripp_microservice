import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BrandDocument } from './brand.schema';

@Schema({ versionKey: false })
export class CardDocument extends AbstractDocument {
  @Prop({ required: true })
  card_number: string;

  @Prop({ default: null })
  cvv: string;

  @Prop()
  expiry_month?: string;

  @Prop()
  expiry_year?: string;

  @Prop({ ref: BrandDocument.name })
  brand?: string;
}

export const CardSchema = SchemaFactory.createForClass(CardDocument);
