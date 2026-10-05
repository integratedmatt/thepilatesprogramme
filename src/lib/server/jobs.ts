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

/** Signed approve/decline links in the review email to NOTIFY_EMAIL. Uses JOB_REVIEW_SECRET, falling back to CRON_SECRET. */
export type ReviewAction = 'approve' | 'decline';
const reviewSecret = () => (import.meta.env.JOB_REVIEW_SECRET as string | undefined) || (import.meta.env.CRON_SECRET as string | undefined) || (import.meta.env.PROD ? '' : 'dev-secret');
export const reviewConfigured = () => reviewSecret() !== '';

export function reviewSignature(jobId: string, action: ReviewAction): string {
  return createHmac('sha256', reviewSecret()).update(`review:${action}:${jobId}`).digest('hex');
}
export function verifyReviewSignature(jobId: string, action: ReviewAction, sig: string): boolean {
  if (!reviewConfigured()) return false;
  const a = Buffer.from(reviewSignature(jobId, action));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Opens a confirmation page; nothing changes until the reviewer presses the button there (mail scanners prefetch GET links). */
export function reviewUrl(jobId: string, action: ReviewAction): string {
  return `${SITE}/jobs/review?id=${encodeURIComponent(jobId)}&action=${action}&sig=${reviewSignature(jobId, action)}`;
}
