import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as ejs from 'ejs';
import { VerifyMailDto } from './dto/verify-email.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly configService: ConfigService) {}
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: this.configService.get('SMTP_USER'),
      clientId: this.configService.get('GOOGLE_OAUTH_CLIENT_ID'),
      clientSecret: this.configService.get('GOOGLE_OAUTH_CLIENT_SECRET'),
      refreshToken: this.configService.get('GOOGLE_OAUTH_REFRESH_TOKEN'),
      accessToken: this.configService.get('GOOGLE_OAUTH_ACCESS_TOKEN'),
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
    await this.sendMail(verifyMailDto.email, 'Verify your account', template);
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
    await this.sendMail(data.email, 'Reset password', template);
  }
}
