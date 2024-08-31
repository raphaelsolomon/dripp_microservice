import { AbstractDocument, UserDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { MessageDocument } from './message.schema';
import { SchemaTypes } from 'mongoose';

@Schema()
export class ChatRoomDocument extends AbstractDocument {
  @Prop({ type: String, default: 'p2p' })
  name?: string;

  @Prop({ type: Boolean, default: false })
  isGroupChat?: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MessageDocument.name' })
  lastMessage?: string;

  @Prop({ default: [{ ref: UserDocument.name, type: SchemaTypes.String }] })
  participants: string[];

  @Prop({ type: [String], default: [] })
  isArchivedFor?: string[];

  @Prop({ type: Number, default: 0, required: false })
  unReadCount?: number;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoomDocument);
