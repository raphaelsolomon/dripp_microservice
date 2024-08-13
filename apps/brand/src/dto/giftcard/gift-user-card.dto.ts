export class GiftUserCardDto {
  gift_card_product: string;
  gift_card_description: string;
  gift_card_amount: number;
  gift_card_color?: string | '#E8ACBC';
  receiver_user_uuid: string;
}
