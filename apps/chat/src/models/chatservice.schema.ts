import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ChatServiceDocument extends AbstractDocument {
  @Prop({ type: String, default: null })
  clientId?: string;

  @Prop({ type: Boolean, default: false })
  status?: boolean;
}

export const ChatServiceSchema =
  SchemaFactory.createForClass(ChatServiceDocument);
