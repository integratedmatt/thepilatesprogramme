/** Transactional email via Resend. Logs to the console when RESEND_API_KEY is not set. */
import { Resend } from 'resend';

const apiKey = import.meta.env.RESEND_API_KEY as string | undefined;
const from = (import.meta.env.RESEND_FROM as string | undefined) || 'The Pilates Programme <hello@thepilatesprogramme.co.uk>';
export const NOTIFY_EMAIL = (import.meta.env.NOTIFY_EMAIL as string | undefined) || 'info@thepilatesprogramme.co.uk';

export async function sendEmail(opts: { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string }): Promise<void> {
  if (!apiKey) {
    console.info('[email:dry-run]', JSON.stringify({ to: opts.to, subject: opts.subject }));
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html ?? toHtml(opts.text), replyTo: opts.replyTo });
}

export function toHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#111">${esc.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>').replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>`).join('')}</div>`;
}
