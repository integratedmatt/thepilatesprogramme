import type { APIRoute } from 'astro';
import { sendEmail } from '@/lib/server/email';
export const prerender = false;

/**
 * Sanity webhook target. Triggers a Vercel deploy hook so static pages rebuild, and emails a studio
 * when their job is approved or rejected. Secured by a shared secret header (x-revalidate-secret).
 * Configure the Sanity webhook with projection:
 *   { _type, status, "slug": slug.current, title, submitterEmail, contactName, rejectReason, approvedAt }
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.SANITY_REVALIDATE_SECRET as string | undefined;
  if (secret && request.headers.get('x-revalidate-secret') !== secret) return new Response('Unauthorized', { status: 401 });
  let body: Record<string, string> = {};
  try { body = (await request.json()) as Record<string, string>; } catch {}
  const site = (import.meta.env.PUBLIC_SITE_URL as string | undefined) || 'https://www.thepilatesprogramme.co.uk';

  if (body._type === 'job' && body.submitterEmail) {
    if (body.status === 'approved') {
      await sendEmail({ to: body.submitterEmail, subject: `Your listing is live: ${body.title}`, text: `Hi ${body.contactName ?? ''},\n\nYour listing "${body.title}" is now live on The Pilates Programme jobs board:\n${site}/jobs/${body.slug}\n\nIt runs for 60 days. We will email you a renewal link a week before it expires.\n\nThe Pilates Programme, Altrincham` });
    } else if (body.status === 'rejected') {
      await sendEmail({ to: body.submitterEmail, subject: `About your listing: ${body.title}`, text: `Hi ${body.contactName ?? ''},\n\nWe were not able to publish "${body.title}" on the jobs board.${body.rejectReason ? `\n\nReason: ${body.rejectReason}` : ''}\n\nReply to this email if you think we have got it wrong.\n\nThe Pilates Programme, Altrincham` });
    }
  }

  const hook = import.meta.env.VERCEL_DEPLOY_HOOK_URL as string | undefined;
  let deployed = false;
  if (hook) { try { const r = await fetch(hook, { method: 'POST' }); deployed = r.ok; } catch (e) { console.warn('[revalidate] deploy hook failed', e); } }
  return Response.json({ ok: true, deployed, type: body._type, status: body.status });
};
