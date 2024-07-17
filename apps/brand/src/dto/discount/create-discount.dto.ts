export class CreateDiscountDto {
  product_name: string;
  discount_details: string;
  member_discount?: string;
  start_date: string;
  end_date: string;
  discount_color?: string | '#E8ACBC';
  discount_amount?: number;
}
