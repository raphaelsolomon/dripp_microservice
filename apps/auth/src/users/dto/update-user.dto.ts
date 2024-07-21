import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  industries?: [string];
  brand_uuids?: [string];
  state?: string;
  country?: string;
}
