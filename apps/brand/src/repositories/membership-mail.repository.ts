import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberShipMailDocument } from '../models/membership-mail.schema';

@Injectable()
export class MemberShipMailRepository extends AbstractRepository<MemberShipMailDocument> {
  protected readonly logger = new Logger(MemberShipMailDocument.name);

  constructor(
    @InjectModel(MemberShipMailDocument.name)
    membership: Model<MemberShipMailDocument>,
  ) {
    super(membership);
  }
}
