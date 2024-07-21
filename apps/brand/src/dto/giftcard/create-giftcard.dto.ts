export class CreateGiftCardDto {
  gift_card_product: string;
  state: string;
  country: string;
  actual_amount: number;
  gift_card_amount: number;
  gift_card_color?: string | '#E8ACBC';
  gift_card_campaign_amount?: number;
}
