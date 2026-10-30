import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { JobOptions, Queue } from 'bull';
import {
  MAIL_QUEUE,
  DailyReportMailData,
  MailJob,
  NewFollowerMailData,
  WelcomeMailData,
} from './mail.constants.js';

const DEFAULT_JOB_OPTIONS: JobOptions = {
  attempts: 3, // retry up to 3 times on failure
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
};

/**
 * Producer: only pushes jobs onto the queue (Redis) and returns => the API never waits for mail delivery.
 */
@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  async sendWelcome(data: WelcomeMailData): Promise<void> {
    await this.mailQueue.add(MailJob.WELCOME, data, DEFAULT_JOB_OPTIONS);
  }

  async sendNewFollower(data: NewFollowerMailData): Promise<void> {
    await this.mailQueue.add(MailJob.NEW_FOLLOWER, data, DEFAULT_JOB_OPTIONS);
  }

  async sendDailyReport(data: DailyReportMailData): Promise<void> {
    await this.mailQueue.add(MailJob.DAILY_REPORT, data, DEFAULT_JOB_OPTIONS);
  }
}
