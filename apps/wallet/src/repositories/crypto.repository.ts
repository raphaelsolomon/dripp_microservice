import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CryptoPaymentDocument } from '../models/crypto.schema';

@Injectable()
export class CryptoPaymentRepository extends AbstractRepository<CryptoPaymentDocument> {
  protected readonly logger = new Logger(CryptoPaymentDocument.name);
  constructor(
    @InjectModel(CryptoPaymentDocument.name)
    cryptoPaymentModel: Model<CryptoPaymentDocument>,
  ) {
    super(cryptoPaymentModel);
  }
}
