import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, respond, isHoneypotTripped, verifyTurnstile, zodErrors, email, consent, str } from '@/lib/server/forms';
import { addLead } from '@/lib/server/leads';
export const prerender = false;

const schema = z.object({
  email,
  consent,
  first_name: z.string().trim().max(80).optional(),
  path: z.enum(['qualify', 'continue', 'studio', 'unknown']).catch('unknown'),
  form_id: z.string().trim().max(80).default('lead'),
  source_page: z.string().trim().max(200).default('/'),
  tag: z.string().trim().max(80).optional(),
  course: z.string().trim().max(120).optional(),
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const data = await readForm(request);
  const back = str(data.source_page) || '/';
  if (isHoneypotTripped(data)) return respond(request, { ok: true, message: 'Thanks.' }, back, data);
  if (!(await verifyTurnstile(str(data['cf-turnstile-response']), clientAddress))) return respond(request, { ok: false, message: 'We could not verify you are human. Please try again.' }, back, data);
  const parsed = schema.safeParse(data);
  if (!parsed.success) return respond(request, { ok: false, message: 'Please check the highlighted fields.', errors: zodErrors(parsed.error) }, back, data);
  const d = parsed.data;
  try {
    await addLead({ email: d.email, firstName: d.first_name, path: d.path, sourcePage: d.source_page, formId: d.form_id, tag: d.tag, course: d.course });
    const event = d.tag === 'career-guide' || d.tag === 'course-guide' ? 'lead_submit' : 'lead_submit';
    return respond(request, { ok: true, event, message: d.tag?.includes('guide') ? 'Thanks. The guide is on its way to your inbox.' : 'Thanks. You are on the list.' }, back, data);
  } catch (err) {
    console.error('[lead] failed', err);
    return respond(request, { ok: false, message: 'We could not save that just now. Please try again in a moment.' }, back, data);
  }
};
