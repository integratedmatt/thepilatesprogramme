import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, respond, isHoneypotTripped, verifyTurnstile, zodErrors, email, str } from '@/lib/server/forms';
import { sendEmail, NOTIFY_EMAIL } from '@/lib/server/email';
export const prerender = false;

const schema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name.').max(120),
  email,
  topic: z.string().trim().max(40).default('other'),
  message: z.string().trim().min(1, 'Please write a message.').max(3000),
  course: z.string().trim().max(120).optional(),
  date: z.string().trim().max(20).optional(),
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const data = await readForm(request);
  if (isHoneypotTripped(data)) return respond(request, { ok: true }, '/contact', data);
  if (!(await verifyTurnstile(str(data['cf-turnstile-response']), clientAddress))) return respond(request, { ok: false, message: 'We could not verify you are human. Please try again.' }, '/contact', data);
  const parsed = schema.safeParse(data);
  if (!parsed.success) return respond(request, { ok: false, message: 'Please check the highlighted fields.', errors: zodErrors(parsed.error) }, '/contact', data);
  const d = parsed.data;
  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: d.email,
      subject: `[Website] ${d.topic === 'waitlist' ? 'Waitlist request' : 'Contact'}: ${d.name}`,
      text: `From: ${d.name} <${d.email}>\nTopic: ${d.topic}${d.course ? `\nCourse: ${d.course}` : ''}${d.date ? `\nDate: ${d.date}` : ''}\n\n${d.message}`,
    });
    await sendEmail({ to: d.email, subject: 'We have your message', text: `Hi ${d.name},\n\nThanks for getting in touch. We reply within two working days.\n\nYour message:\n${d.message}\n\nThe Pilates Programme, Altrincham` });
    return respond(request, { ok: true, event: 'contact_submit', message: 'Thanks. We have your message and will reply within two working days.' }, '/contact', data);
  } catch (err) {
    console.error('[contact] failed', err);
    return respond(request, { ok: false, message: 'We could not send that. Your message is still in the form. Please try again or email us directly.' }, '/contact', data);
  }
};
