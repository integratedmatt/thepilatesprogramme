import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '@/lib/sanity';
import { sendEmail } from '@/lib/server/email';
import { renewUrl, plusDays, SITE } from '@/lib/server/jobs';
export const prerender = false;

/**
 * Daily (vercel.json crons). Marks approved jobs past validThrough as expired and emails studios
 * 7 days before expiry with a signed renew link. Protected by CRON_SECRET (Vercel sends it as a Bearer token).
 */
export const GET: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET as string | undefined;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  const client = getSanityWriteClient();
  if (!client) return Response.json({ ok: false, reason: 'Sanity write client not configured' }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const soon = plusDays(7);
  const expiring = await client.fetch<{ _id: string; title: string; validThrough: string; submitterEmail?: string; contactName?: string; slug: string; reminderSentFor?: string }[]>(
    `*[_type == "job" && status == "approved" && validThrough <= $soon]{ _id, title, validThrough, submitterEmail, contactName, "slug": slug.current, reminderSentFor }`, { soon },
  );
  let expired = 0, reminded = 0;
  for (const job of expiring) {
    if (job.validThrough < today) {
      await client.patch(job._id).set({ status: 'expired', expiredAt: new Date().toISOString() }).commit();
      expired++;
    } else if (job.submitterEmail && job.reminderSentFor !== job.validThrough) {
      await sendEmail({ to: job.submitterEmail, subject: `Your listing "${job.title}" expires on ${job.validThrough}`, text: `Hi ${job.contactName ?? ''},\n\nYour listing "${job.title}" on The Pilates Programme jobs board expires on ${job.validThrough}.\n\nStill hiring? Renew it for another 60 days with one click:\n${renewUrl(job._id)}\n\nView the listing: ${SITE}/jobs/${job.slug}\n\nThe Pilates Programme, Altrincham` });
      await client.patch(job._id).set({ reminderSentFor: job.validThrough }).commit();
      reminded++;
    }
  }
  return Response.json({ ok: true, expired, reminded, checked: expiring.length });
};
