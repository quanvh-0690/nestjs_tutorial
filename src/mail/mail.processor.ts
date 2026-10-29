import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from './mailer.service.js';
import {
  MAIL_QUEUE,
  DailyReportMailData,
  MailJob,
  NewFollowerMailData,
  WelcomeMailData,
} from './mail.constants.js';
import { welcomeTemplate } from './templates/welcome.template.js';
import { newFollowerTemplate } from './templates/new-follower.template.js';
import { dailyReportTemplate } from './templates/daily-report.template.js';

/**
 * Consumer: takes jobs from the queue and processes them.
 * Runs in the same process as the app; can be split into a separate worker to scale.
 */
@Processor(MAIL_QUEUE)
export class MailProcessor {
  constructor(private readonly mailer: MailerService) {}

  @Process(MailJob.WELCOME)
  async handleWelcome(job: Job<WelcomeMailData>): Promise<void> {
    await this.mailer.send({
      to: job.data.email,
      ...welcomeTemplate(job.data),
    });
  }

  @Process(MailJob.NEW_FOLLOWER)
  async handleNewFollower(job: Job<NewFollowerMailData>): Promise<void> {
    await this.mailer.send({
      to: job.data.email,
      ...newFollowerTemplate(job.data),
    });
  }

  @Process(MailJob.DAILY_REPORT)
  async handleDailyReport(job: Job<DailyReportMailData>): Promise<void> {
    const { subject, html } = dailyReportTemplate(job.data);
    await this.mailer.send({ to: job.data.to.join(','), subject, html });
  }
}
