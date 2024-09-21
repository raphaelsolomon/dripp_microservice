import { AccountType } from '@app/common';

export class CreateUserDto {
  email: string;

  password: string;

  firstname: string;

  lastname: string;

  gender: string;

  username?: string;

  account_type: AccountType;

  protected fullname?: string;

  setFullname(params: string) {
    this.fullname = params;
  }
}
