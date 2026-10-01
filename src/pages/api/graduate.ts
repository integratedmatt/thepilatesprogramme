import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, respond, isHoneypotTripped, verifyTurnstile, zodErrors, email, consent, str } from '@/lib/server/forms';
import { sendEmail, NOTIFY_EMAIL } from '@/lib/server/email';
import { getSanityWriteClient } from '@/lib/sanity';
export const prerender = false;

const schema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(120),
  email,
  course: z.string().trim().min(1).max(120),
  cohort: z.string().trim().max(60).optional(),
  studios: z.string().trim().min(1, 'Tell us where you teach.').max(300),
  town: z.string().trim().max(80).optional(),
  timeToFirstClass: z.string().trim().max(80).optional(),
  quote: z.string().trim().max(300).optional(),
  consent,
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const data = await readForm(request);
  if (isHoneypotTripped(data)) return respond(request, { ok: true }, '/graduates', data);
  if (!(await verifyTurnstile(str(data['cf-turnstile-response']), clientAddress))) return respond(request, { ok: false, message: 'We could not verify you are human. Please try again.' }, '/graduates', data);
  const parsed = schema.safeParse(data);
  if (!parsed.success) return respond(request, { ok: false, message: 'Please check the highlighted fields.', errors: zodErrors(parsed.error) }, '/graduates', data);
  const d = parsed.data;
  try {
    const client = getSanityWriteClient();
    let imageRef: { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined;
    const photo = data.photo;
    if (client && photo instanceof File && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) return respond(request, { ok: false, message: 'Photo must be under 5MB.', errors: { photo: 'Photo must be under 5MB.' } }, '/graduates', data);
      const asset = await client.assets.upload('image', Buffer.from(await photo.arrayBuffer()), { filename: photo.name, contentType: photo.type });
      imageRef = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }
    const doc = { _type: 'graduate', status: 'pending', name: d.name, email: d.email, course: d.course, cohort: d.cohort, studios: d.studios.split(',').map((s) => s.trim()).filter(Boolean), town: d.town, timeToFirstClass: d.timeToFirstClass, quote: d.quote, image: imageRef, submittedAt: new Date().toISOString() };
    if (client) await client.create(doc); else console.info('[graduate:dry-run]', JSON.stringify(doc));
    await sendEmail({ to: NOTIFY_EMAIL, subject: `New graduate profile to review: ${d.name}`, text: `${d.name} (${d.email}) submitted a graduate profile.\nCourse: ${d.course}\nTeaches at: ${d.studios}${d.town ? `, ${d.town}` : ''}\n\nApprove it in Sanity Studio under Graduates > Pending.` });
    await sendEmail({ to: d.email, subject: 'Thanks for your graduate profile', text: `Hi ${d.name},\n\nThanks for adding your profile. We check every profile before it goes live and will email you when it is published.\n\nThe Pilates Programme, Altrincham` });
    return respond(request, { ok: true, event: 'graduate_submit', message: 'Thanks. We will check your profile and email you when it is live.' }, '/graduates', data);
  } catch (err) {
    console.error('[graduate] failed', err);
    return respond(request, { ok: false, message: 'We could not save your profile just now. Your details are still in the form. Please try again.' }, '/graduates', data);
  }
};
