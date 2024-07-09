import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ versionKey: false })
export class WalletDocument extends AbstractDocument {
  @Prop({ unique: true, default: uuidv4 })
  uuid?: string;

  @Prop({ default: 0.0 })
  amount?: number;
}

export const WalletSchema = SchemaFactory.createForClass(WalletDocument);
