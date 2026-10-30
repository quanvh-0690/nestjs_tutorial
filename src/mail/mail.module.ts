import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MAIL_QUEUE } from './mail.constants.js';
import { MailService } from './mail.service.js';
import { MailerService } from './mailer.service.js';
import { MailProcessor } from './mail.processor.js';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [MailService, MailerService, MailProcessor],
  exports: [MailService, MailerService],
})
export class MailModule {}
