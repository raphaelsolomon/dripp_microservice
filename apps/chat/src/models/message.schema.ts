import { AbstractDocument, UserDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { ChatRoomDocument } from './chatroom.schema';

class ChatContent {
  message: string;
  sender_uuid: string;
  is_brand: boolean;
}

@Schema()
export class MessageDocument extends AbstractDocument {
  @Prop({ type: String, required: true, ref: UserDocument.name })
  sender_uuid: string;

  @Prop({ type: String, required: true, ref: UserDocument.name })
  receiver_uuid: string;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  content: ChatContent;

  @Prop({ type: String, required: true, default: 'text' })
  content_type?: string;

  @Prop({ type: String, enum: ['SENT', 'DELIVERED', 'READ'], default: 'SENT' })
  status?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: ChatRoomDocument.name })
  chat: string;
}

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);
