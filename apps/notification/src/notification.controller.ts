import {
  Controller,
  Get,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { VerifyMailDto } from './dto/verify-email.dto';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { Request } from 'express';

export enum NotificationPattern {
  CreateNotification = 'create_notification',
  ResetPassword = 'reset_password',
  SendFund = 'send_fund',
  CampaignCreated = 'campaign_created',
  MailVerify = 'mail_verify',
  MembershipMail = 'membership_mail',
}

export type NotificationType = 'task_approved' | 'task_rejected';

export interface CreateNotificationPayload {
  to: string;
  from: {
    isBrand: boolean;
    sender: string;
  };
  title: string;
  body: string;
  type: NotificationType;
  metadata?: any;
}

@Controller('notifications')
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

  @UsePipes(new ValidationPipe())
  @EventPattern('membership_mail')
  async sendmemberShipMail(@Payload() data: { [key: string]: string }) {
    this.notificationService.sendmemberShipMail(data);
  }

  @UsePipes(new ValidationPipe())
  @EventPattern('create_notification')
  async createNotification(@Payload() data: CreateNotificationPayload) {
    this.notificationService.createNotification(data);
  }

  @UsePipes(new ValidationPipe())
  @EventPattern('send_fund')
  async sendfund(@Payload() data: { [key: string]: any }) {
    this.notificationService.sendfundNotification(data);
  }

  @UsePipes(new ValidationPipe())
  @EventPattern('campaign_created')
  async campaignCreated(@Payload() data: { [key: string]: any }) {
    this.notificationService.sendfundNotification(data);
  }

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getNotification(@CurrentUser() user: UserDto, @Req() req: Request) {
    const result = await this.notificationService.getNotifications(user, req);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/healthcheck')
  healthCheck(@Req() req: Request) {
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: 'OK',
    };
  }
}
