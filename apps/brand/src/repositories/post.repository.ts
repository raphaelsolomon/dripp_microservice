import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostDocument } from '../models/post.schema';

@Injectable()
export class PostRepository extends AbstractRepository<PostDocument> {
  protected readonly logger = new Logger(PostRepository.name);

  constructor(@InjectModel(PostDocument.name) postModel: Model<PostDocument>) {
    super(postModel);
  }
}
