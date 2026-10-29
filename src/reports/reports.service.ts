import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../articles/entities/article.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
import type { TopArticleItem } from '../mail/mail.constants.js';

const CRON_TIMEZONE = process.env.CRON_TIMEZONE ?? 'Asia/Ho_Chi_Minh';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async getTopFavoritedArticles(limit = 5): Promise<TopArticleItem[]> {
    const articles = await this.articlesRepository.find({
      relations: { author: true },
      order: { favoritesCount: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return articles.map((a) => ({
      title: a.title,
      slug: a.slug,
      author: a.author.username,
      favoritesCount: a.favoritesCount,
    }));
  }

  /**
   * Runs at 00:00 every day (Vietnam time).
   * Cron syntax: minute hour day month weekday  => '0 0 * * *'
   */
  @Cron('0 0 * * *', { name: 'daily-top-articles', timeZone: CRON_TIMEZONE })
  async sendDailyTopArticlesReport(): Promise<void> {
    const recipients = await this.getAdminEmails();
    const articles = await this.getTopFavoritedArticles(5);
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: CRON_TIMEZONE,
    }).format(new Date()); // YYYY-MM-DD
    await this.mailService.sendDailyReport({ to: recipients, date, articles });
    this.logger.log(`Queued daily report for ${recipients.join(', ')}`);
  }

  /** Report recipients: users with role=admin, falling back to ADMIN_EMAIL when there are none */
  private async getAdminEmails(): Promise<string[]> {
    const admins = await this.usersRepository.findBy({ role: UserRole.ADMIN });
    if (admins.length) return admins.map((u) => u.email);
    return [this.config.getOrThrow<string>('mail.adminEmail')];
  }
}
