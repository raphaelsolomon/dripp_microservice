import { AccountType } from '@app/common';

export class CreateUserDto {
  email: string;

  password: string;

  fullname: string;

  gender: string;

  account_type: AccountType;
}
