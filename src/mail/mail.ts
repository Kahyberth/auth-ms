import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { htmlTemplate } from './html.template';
import { envs } from 'src/auth/common/envs';
@Injectable()
export class Mail {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envs.MAIL_HOST,
      port: 2525,
      auth: {
        user: envs.MAIL_USERNAME,
        pass: envs.MAIL_PASSWORD,
      },
    });
  }

  async sendOtpEmail(to: string, otpCode: string) {
    console.log(to);
    const mailOptions = {
      from: 'no-reply@ejemplo.com',
      to,
      subject: 'Tu código de verificación',
      html: htmlTemplate(otpCode),
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
