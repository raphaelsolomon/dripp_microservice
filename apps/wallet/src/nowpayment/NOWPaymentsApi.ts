import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface INowPaymentCurrency {
  id: number;
  code: string;
  name: string;
  enable: boolean;
  wallet_regex: string;
  priority: number;
  extra_id_exists: boolean;
  extra_id_regex: string;
  logo_url: string;
  track: boolean;
  cg_id: string;
  is_maxlimit: string;
  network: string;
  smart_contract: string;
  network_precision: any;
}

export interface NowPaymentsError {
  message: string;
  errors: any[];
}

export interface ICreateNowPaymentsInvoicePayload {
  price_currency: string;
  price_amount: number;
  pay_currency?: string;
  ipn_callback_url: string;
  order_id?: string;
  order_description?: string;
}
export interface NowPaymentsInvoice {
  id: string;
  order_id: string;
  order_description: string;
  price_amount: string;
  price_currency: string;
  pay_currency: null;
  ipn_callback_url: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: Date;
  updated_at: Date;
}
export type NowPaymentStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'partially_paid'
  | 'finished'
  | 'failed'
  | 'expired';

export interface INotificationBody {
  payment_id: number;
  invoice_id: null;
  payment_status: NowPaymentStatus;
  pay_address: string;
  payin_extra_id: null;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: number;
  outcome_amount: null;
  outcome_currency: string;
  payout_hash: null;
  payin_hash: null;
  created_at: Date;
  updated_at: Date;
  burning_percent: string;
  type: string;
}
class NOWPaymentsApi {
  private readonly apiKey: string;

  private readonly configService: ConfigService;

  private readonly baseUrl: string;

  private readonly ipnKey: string;

  constructor() {
    this.configService = new ConfigService();

    this.apiKey = this.configService.get('NOW_PAYMENTS_API_KEY');

    this.baseUrl = this.configService.get('NOW_PAYMENTS_BASE_URL');

    this.ipnKey = this.configService.get('NOW_PAYMENTS_IPN');
  }

  private fetchUrl(url: string, init: RequestInit = {}) {
    return fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      ...init,
    });
  }

  private getUrl(endpoint: string) {
    return `${this.baseUrl}/${endpoint}`;
  }

  private body<T extends object>(body: T) {
    return JSON.stringify(body);
  }

  async getCurrencies() {
    const result: NowPaymentsError | { currencies: INowPaymentCurrency[] } =
      await (await this.fetchUrl(this.getUrl('full-currencies'), {})).json();

    return result;
  }

  async createInvoice(payload: ICreateNowPaymentsInvoicePayload) {
    const res: NowPaymentsInvoice = await (
      await this.fetchUrl(this.getUrl('invoice'), {
        method: 'post',
        body: this.body(payload),
      })
    ).json();

    return res;
  }
  isValidSignature<T extends object>(
    body: T,
    now_payment_sig: string | string[],
  ) {
    const hmac = crypto.createHmac('sha512', this.ipnKey);

    function sortObject(obj: T) {
      return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
          result[key] =
            obj[key] && typeof obj[key] === 'object'
              ? sortObject(obj[key])
              : obj[key];
          return result;
        }, {});
    }

    hmac.update(JSON.stringify(body, sortObject(body) as any));

    const signature = hmac.digest('hex');

    console.log(signature);

    return now_payment_sig === signature;
  }

  async convertAmountToUSDT({ amount, currency }) {
    const res: {
      currency_from: string;
      amount_from: number;
      currency_to: string;
      estimated_amount: number;
    } = await (
      await this.fetchUrl(
        this.getUrl(
          `estimate?amount=${amount}&currency_from=${currency}&currency_to=usdttrc20`,
        ),
      )
    ).json();

    return res;
  }
}

export default NOWPaymentsApi;
