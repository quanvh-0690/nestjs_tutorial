import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/** Sends real mail over SMTP (locally via Mailpit: http://localhost:8025) */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('mail.user');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('mail.host'),
      port: config.get<number>('mail.port'),
      secure: config.get<number>('mail.port') === 465,
      auth: user
        ? { user, pass: config.get<string>('mail.password') }
        : undefined,
    });
    this.from = config.getOrThrow<string>('mail.from');
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...options });
    this.logger.log(`Sent "${options.subject}" to ${options.to}`);
  }
}
