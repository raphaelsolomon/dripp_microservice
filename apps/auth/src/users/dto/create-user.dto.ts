import { AccountType } from '../models/user.schema';

export class CreateUserDto {
  email: string;

  password: string;

  fullname: string;

  gender: string;

  account_type: AccountType;
}
