import type { WelcomeMailData } from '../mail.constants.js';
import { escapeHtml, layout } from './layout.js';

export function welcomeTemplate(data: WelcomeMailData) {
  const name = escapeHtml(data.username);
  return {
    subject: 'Welcome to Medium Clone!',
    html: layout(
      `Welcome, ${name}!`,
      `<p>Your account has been created successfully.</p>
       <p>Start writing your first article and share your ideas with the world.</p>`,
    ),
  };
}
