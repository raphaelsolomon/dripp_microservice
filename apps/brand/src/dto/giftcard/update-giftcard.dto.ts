import { PartialType } from '@nestjs/mapped-types';
import { CreateGiftCardDto } from './create-giftcard.dto';

export class UpdateGiftCardDto extends PartialType(CreateGiftCardDto) {
  gift_card_uuid: string;
}
