import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, respond, isHoneypotTripped, verifyTurnstile, zodErrors, email, consent, str } from '@/lib/server/forms';
import { sendEmail, NOTIFY_EMAIL } from '@/lib/server/email';
import { getSanityWriteClient } from '@/lib/sanity';
export const prerender = false;

const schema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(120),
  email,
  town: z.string().trim().max(80).optional(),
  story: z.string().trim().min(1, 'Please tell us a little about you.').max(3000),
  barriers: z.string().trim().min(1, 'Please tell us about the barriers you face.').max(2000),
  consent,
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const data = await readForm(request);
  const back = '/elevating-others';
  if (isHoneypotTripped(data)) return respond(request, { ok: true }, back, data);
  if (!(await verifyTurnstile(str(data['cf-turnstile-response']), clientAddress))) return respond(request, { ok: false, message: 'We could not verify you are human. Please try again.' }, back, data);
  const parsed = schema.safeParse(data);
  if (!parsed.success) return respond(request, { ok: false, message: 'Please check the highlighted fields.', errors: zodErrors(parsed.error) }, back, data);
  const d = parsed.data;
  try {
    const client = getSanityWriteClient();
    const doc = { _type: 'application', programme: 'elevating-others', status: 'pending', name: d.name, email: d.email, town: d.town, story: d.story, barriers: d.barriers, submittedAt: new Date().toISOString() };
    if (client) await client.create(doc); else console.info('[application:dry-run]', JSON.stringify(doc));
    await sendEmail({ to: NOTIFY_EMAIL, subject: `Elevating Others application: ${d.name}`, text: `${d.name} (${d.email}${d.town ? `, ${d.town}` : ''}) applied.\n\nAbout them:\n${d.story}\n\nBarriers:\n${d.barriers}\n\nReview in Sanity Studio under Applications > Pending.` });
    await sendEmail({ to: d.email, subject: 'We have your Elevating Others application', text: `Hi ${d.name},\n\nThank you for applying. We read every application and will reply by email once the window closes.\n\nThe Pilates Programme, Altrincham` });
    return respond(request, { ok: true, event: 'application_submit', message: 'Thank you. We have your application and will reply by email.' }, back, data);
  } catch (err) {
    console.error('[elevating-others] failed', err);
    return respond(request, { ok: false, message: 'We could not send your application just now. Your answers are still in the form. Please try again.' }, back, data);
  }
};
