import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BrandDocument } from './brand.schema';

@Schema({ versionKey: false })
export class MemberShipMailDocument extends AbstractDocument {
  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  body: string;

  @Prop({ ref: BrandDocument.name })
  brand?: string;
}

export const MemberShipMailSchema = SchemaFactory.createForClass(
  MemberShipMailDocument,
);
