/** Shared HTML layout for every email */
export function layout(title: string, content: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f6f6f6; padding:24px">
    <div style="max-width:560px; margin:auto; background:#fff; padding:24px; border-radius:8px">
      <h2 style="color:#5cb85c; margin-top:0">${title}</h2>
      ${content}
      <hr style="border:none; border-top:1px solid #eee; margin:24px 0" />
      <p style="color:#999; font-size:12px">Medium Clone - NestJS tutorial</p>
    </div>
  </body>
</html>`;
}

/** Escape HTML to prevent injection from user data (username, title...) */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
