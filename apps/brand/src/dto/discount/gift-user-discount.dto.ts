export class GiftUserDiscountDto {
  product_name: string;
  discount_details: string;
  discount_amount: number;
  discount_color?: string | '#E8ACBC';
  start_date: string;
  end_date: string;
  receiver_user_uuid: string;
}
