import type { NewFollowerMailData } from '../mail.constants.js';
import { escapeHtml, layout } from './layout.js';

export function newFollowerTemplate(data: NewFollowerMailData) {
  const follower = escapeHtml(data.followerUsername);
  return {
    subject: `${data.followerUsername} started following you`,
    html: layout(
      'You have a new follower',
      `<p>Hi ${escapeHtml(data.username)},</p>
       <p><strong>${follower}</strong> is now following you. Keep writing great articles!</p>`,
    ),
  };
}
