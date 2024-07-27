import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberShipMailDto } from './create-membership-mail.dto';

export class UpdateMemberShipMailDto extends PartialType(
  CreateMemberShipMailDto,
) {}
