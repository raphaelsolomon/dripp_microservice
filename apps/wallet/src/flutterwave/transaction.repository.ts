import { Injectable, Logger } from '@nestjs/common';
import { TransactionDocument } from './models/transaction.schema';
import { AbstractRepository } from '@app/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TransactionRepository extends AbstractRepository<TransactionDocument> {
  protected readonly logger = new Logger(TransactionRepository.name);
  constructor(
    @InjectModel(TransactionDocument.name)
    transactionModel: Model<TransactionDocument>,
  ) {
    super(transactionModel);
  }
}
