import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { VerificationDocument } from './models/verification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class VerificationRepository extends AbstractRepository<VerificationDocument> {
  protected readonly logger = new Logger(VerificationRepository.name);
  constructor(
    @InjectModel(VerificationDocument.name)
    verificationModel: Model<VerificationDocument>,
  ) {
    super(verificationModel);
  }
}
