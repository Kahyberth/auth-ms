import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { sendGreetings } from './html.template';
import { envs } from '../auth/common/envs';
import { sendInvitationTemplate } from './sendInvitation.template';
@Injectable()
export class Mail {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envs.MAIL_HOST,
      port: 465,
      auth: {
        user: envs.MAIL_USERNAME,
        pass: envs.MAIL_PASSWORD,
      },
    });
  }

  async sendGreetingsToUser(to: string) {
    const mailOptions = {
      from: envs.MAIL_USERNAME,
      to,
      subject: 'Bienvenido a nuestra plataforma! 🎉',
      html: sendGreetings(),
    };
    return await this.transporter.sendMail(mailOptions);
  }


  async sendInvitationLink(payload: any) {
    const mailOptions = {
      from: envs.MAIL_USERNAME,
      to: payload.inviteeEmail,
      subject: 'Invitación a nuestro equipo 🚀',
      html: sendInvitationTemplate(payload.teamName, payload.userName, payload.enlace),
    };
    return await this.transporter.sendMail(mailOptions);
  }

}
