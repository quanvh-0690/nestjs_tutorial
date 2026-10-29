export const MAIL_QUEUE = 'mail';

/** Job names in the "mail" queue */
export enum MailJob {
  WELCOME = 'welcome',
  NEW_FOLLOWER = 'new-follower',
  DAILY_REPORT = 'daily-report',
}

export interface WelcomeMailData {
  email: string;
  username: string;
}

export interface NewFollowerMailData {
  email: string; // email of the author being followed
  username: string;
  followerUsername: string;
}

export interface TopArticleItem {
  title: string;
  slug: string;
  author: string;
  favoritesCount: number;
}

export interface DailyReportMailData {
  to: string[];
  date: string; // YYYY-MM-DD
  articles: TopArticleItem[];
}
