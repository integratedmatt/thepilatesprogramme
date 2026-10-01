/** Job helpers shared by the API routes and the cron. */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SITE = (import.meta.env.PUBLIC_SITE_URL as string | undefined) || 'https://www.thepilatesprogramme.co.uk';
const secret = () => (import.meta.env.CRON_SECRET as string | undefined) || 'dev-secret';

export function renewSignature(jobId: string): string {
  return createHmac('sha256', secret()).update(`renew:${jobId}`).digest('hex');
}
export function verifyRenewSignature(jobId: string, sig: string): boolean {
  const a = Buffer.from(renewSignature(jobId));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function renewUrl(jobId: string): string {
  return `${SITE}/api/jobs/renew?id=${encodeURIComponent(jobId)}&sig=${renewSignature(jobId)}`;
}
export function plusDays(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
