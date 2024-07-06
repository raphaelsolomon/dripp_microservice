import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { VerifyMailDto } from './dto/verify-email.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UsePipes(new ValidationPipe())
  @EventPattern('mail_verify')
  async mailRegister(@Payload() data: VerifyMailDto) {
    this.notificationService.sendVerifyMail(data);
  }

  @UsePipes(new ValidationPipe())
  @EventPattern('reset_password')
  async resetPassword(@Payload() data: { [key: string]: string }) {
    this.notificationService.sendResetPassword(data);
  }
}
