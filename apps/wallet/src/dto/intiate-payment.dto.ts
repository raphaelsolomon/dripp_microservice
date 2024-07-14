export class InitiatePaymentDto {
  currency: 'USD' | 'NGN';
  amount: number;
  redirect_url?: string;
}
