import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

class FromSender {
  @Prop()
  isBrand: boolean;

  @Prop()
  sender: string;
}

const FromSenderSchema = SchemaFactory.createForClass(FromSender);

@Schema()
export class NotificationDocument extends AbstractDocument {
  @Prop()
  title: string;

  @Prop()
  body: string;

  @Prop()
  type: string;

  @Prop()
  to: string;

  @Prop({ type: FromSenderSchema })
  from: FromSender;

  @Prop({ type: Types.Map, required: false, default: {} })
  metadata?: Record<string, any>;
}

export const NotificationSchema =
  SchemaFactory.createForClass(NotificationDocument);
