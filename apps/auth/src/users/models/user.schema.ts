import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum AccountType {
  user = 'user',
  business = 'business',
}

@Schema({ versionKey: false })
export class UserDocument extends AbstractDocument {
  @Prop({ required: false, default: '' })
  avatar?: string;

  @Prop({ required: false })
  fullname: string;

  @Prop({ unique: true, default: uuidv4 })
  uuid?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: false })
  email_verified?: boolean;

  @Prop({ required: false })
  username?: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false, default: null })
  gender: string;

  @Prop({ default: null })
  account_type: AccountType;

  @Prop({ required: false })
  business_id?: string;
}
export const UserSchema = SchemaFactory.createForClass(UserDocument);
