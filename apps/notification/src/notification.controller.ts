import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotifyRegisterDto } from './dto/notify-register.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UsePipes(new ValidationPipe())
  @EventPattern('mail_register')
  async mailRegister(@Payload() data: NotifyRegisterDto) {
    this.notificationService.sendRegisterMail(data);
  }
}
