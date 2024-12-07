import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as ejs from 'ejs';
import { VerifyMailDto } from './dto/verify-email.dto';
import { NotifcationRepository } from './repositories/notification.repository';
import { UserDto } from '@app/common';
import { Request } from 'express';
import { CreateNotificationPayload } from './notification.controller';

@Injectable()
export class NotificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly notificationRepository: NotifcationRepository,
  ) {}
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: this.configService.get('SMTP_USER'),
      pass: this.configService.get('SMTP_PASS'),
    },
  });

  sendMail = async (to: string, subject: string, body: string) => {
    return await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: to,
      subject: subject,
      html: body,
    });
  };

  async sendVerifyMail(verifyMailDto: VerifyMailDto) {
    const templatePath = path.join(
      __dirname,
      'templates',
      'verify.template',
      'verify.template.ejs',
    );

    const template = await ejs.renderFile(templatePath, {
      ...verifyMailDto,
    });
    try {
      await this.sendMail(verifyMailDto.email, 'Verify your account', template);
    } catch (err) {
      console.error(err);
    }
  }

  async sendResetPassword(data: { [key: string]: string }) {
    const templatePath = path.join(
      __dirname,
      'templates',
      'reset.template',
      'reset.template.ejs',
    );

    const template = await ejs.renderFile(templatePath, {
      url: `${this.configService.get<string>('CLIENT_URL')}/${data.token}`,
    });
    try {
      await this.sendMail(data.email, 'Reset password', template);
    } catch (err) {
      console.error(err);
    }
  }

  async sendmemberShipMail(data: { [key: string]: any }) {
    const notification = {
      title: data.title,
      body: data.body,
      type: data.type,
      to: data.to,
      from: data.from,
    };
    await this.notificationRepository.create({ ...notification });
  }

  async getNotifications(user: UserDto, req: Request) {
    const first: number = Number.parseInt(`${req.query.first ?? 20}`);
    const page: number = Number.parseInt(`${req.query.page ?? 1}`);
    return await this.notificationRepository.getPaginatedDocuments(
      first,
      page,
      {
        to: user.uuid,
      },
    );
  }

  async createNotification(data: CreateNotificationPayload) {
    const { to, from, title, body, type, metadata } = data;
    await this.notificationRepository.create({
      to,
      from,
      title,
      body,
      type,
      metadata,
    });
  }

  async sendfundNotification(data: { [key: string]: any }) {
    console.log(data);
  }
}
