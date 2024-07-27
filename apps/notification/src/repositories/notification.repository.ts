import { AbstractRepository } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationDocument } from '../schema/notification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NotifcationRepository extends AbstractRepository<NotificationDocument> {
  protected readonly logger = new Logger(NotificationDocument.name);
  constructor(
    @InjectModel(NotificationDocument.name)
    notificationModel: Model<NotificationDocument>,
  ) {
    super(notificationModel);
  }
}
