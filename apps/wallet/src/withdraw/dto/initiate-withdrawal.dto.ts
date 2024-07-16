export class InitiateWithdrawalDto {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: 'NGN' | 'USD';
  callback_url?: string;
}
