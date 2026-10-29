export const MAIL_QUEUE = 'mail';

/** Job names in the "mail" queue */
export enum MailJob {
  WELCOME = 'welcome',
  NEW_FOLLOWER = 'new-follower',
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
