import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  task_uuid: string;
  protected campaign_banner_url?: string;

  set bannerUrl(value: string) {
    if (!value) throw new Error('Invalid url supplied');
    this.campaign_banner_url = value;
  }
}
