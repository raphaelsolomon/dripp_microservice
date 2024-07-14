import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class WalletDocument extends AbstractDocument {
  @Prop({ default: 0.0 })
  amount?: number;
}

export const WalletSchema = SchemaFactory.createForClass(WalletDocument);
