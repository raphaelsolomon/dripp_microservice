import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class BrandDocument extends AbstractDocument {
  @Prop({ default: null })
  brand_name?: string;

  @Prop({ default: null })
  bio?: string;

  @Prop({ default: null })
  industry?: string;
}

export const BrandSchema = SchemaFactory.createForClass(BrandDocument);
