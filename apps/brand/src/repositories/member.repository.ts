import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberDocument } from '../models/member.schema';

@Injectable()
export class MemberRepository extends AbstractRepository<MemberDocument> {
  protected readonly logger = new Logger(MemberRepository.name);

  constructor(
    @InjectModel(MemberDocument.name) memberModel: Model<MemberDocument>,
  ) {
    super(memberModel);
  }
}
