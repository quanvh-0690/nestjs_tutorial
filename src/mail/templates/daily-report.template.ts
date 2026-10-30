import type { DailyReportMailData } from '../mail.constants.js';
import { escapeHtml, layout } from './layout.js';

export function dailyReportTemplate(data: DailyReportMailData) {
  const rows = data.articles
    .map(
      (a, i) => `<tr>
        <td style="padding:6px">${i + 1}</td>
        <td style="padding:6px">${escapeHtml(a.title)}</td>
        <td style="padding:6px">${escapeHtml(a.author)}</td>
        <td style="padding:6px; text-align:right">${a.favoritesCount}</td>
      </tr>`,
    )
    .join('');
  const content = data.articles.length
    ? `<table style="width:100%; border-collapse:collapse">
         <thead><tr style="background:#f0f0f0">
           <th style="padding:6px">#</th><th style="padding:6px">Title</th>
           <th style="padding:6px">Author</th><th style="padding:6px">Favorites</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>`
    : '<p>No articles yet.</p>';
  return {
    subject: `[Daily report ${data.date}] Top ${data.articles.length} most favorited articles`,
    html: layout(`Top favorited articles - ${data.date}`, content),
  };
}
