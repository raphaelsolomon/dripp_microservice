import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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

  @Prop({ required: true })
  brand_uuid: string;

  @Prop({ default: [] })
  post_likes?: [string];
}

export const PostSchema = SchemaFactory.createForClass(PostDocument);
