export interface UserDto {
  _id: string;
  avatar: string;
  email: string;
  fullname: string;
  username: string;
  state?: string;
  country?: string;
  status?: boolean;
  brand_uuid?: string;
  wallet_uuid?: string;
  account_type?: string;
}
