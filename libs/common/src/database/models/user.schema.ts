import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';

export enum AccountType {
  user = 'user',
  business = 'business',
}

@Schema({ versionKey: false })
export class UserDocument extends AbstractDocument {
  @Prop({ required: false, default: '' })
  avatar?: string;

  @Prop({ required: true })
  firstname: string;

  @Prop({ required: false })
  lastname?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: false })
  email_verified?: boolean;

  @Prop({ required: false, unique: true })
  username?: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false, default: null })
  gender: string;

  @Prop({ required: false, default: null })
  state?: string;

  @Prop({ required: false, default: null })
  country?: string;

  @Prop({ default: null })
  account_type: AccountType;

  @Prop({ required: false })
  brand_uuid?: string;

  @Prop({ required: false })
  wallet_uuid?: string;

  @Prop({ required: false })
  chat_uuid?: string;

  @Prop({ required: false, select: false })
  password_reset_token?: string;

  @Prop({ required: false })
  industries?: [string];

  @Prop({ default: true })
  status?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.virtual('fullname').get(function () {
  return `${this.firstname ?? ''} ${this.lastname ?? ''}`;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
