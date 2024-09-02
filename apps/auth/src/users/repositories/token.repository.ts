import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenDocument } from '../models/token.schema';

@Injectable()
export class TokenRepository extends AbstractRepository<TokenDocument> {
  protected readonly logger = new Logger(TokenRepository.name);

  constructor(@InjectModel(TokenDocument.name) token: Model<TokenDocument>) {
    super(token);
  }
}
