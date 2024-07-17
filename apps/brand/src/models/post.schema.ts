import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BrandDocument } from './brand.schema';

@Schema({ versionKey: false })
export class PostDocument extends AbstractDocument {
  @Prop({ default: null })
  post_title?: string;

  @Prop({ default: null })
  post_content: string;

  @Prop({ default: null, enum: ['image', 'video'] })
  media_type?: string;

  @Prop({ default: null })
  media_url?: string;

  @Prop({ ref: BrandDocument.name })
  brand: string;

  @Prop({ default: [] })
  post_likes?: [string];
}

export const PostSchema = SchemaFactory.createForClass(PostDocument);
