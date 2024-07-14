export interface UserDto {
  _id: string;
  avatar: string;
  email: string;
  fullname: string;
  username: string;
  status?: boolean;
  brand_uuid?: string;
  wallet_uuid?: string;
}
