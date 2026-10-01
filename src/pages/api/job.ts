import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, respond, isHoneypotTripped, verifyTurnstile, zodErrors, email, str } from '@/lib/server/forms';
import { sendEmail, NOTIFY_EMAIL } from '@/lib/server/email';
import { getSanityWriteClient, sanityConfig } from '@/lib/sanity';
import { plusDays } from '@/lib/server/jobs';
import { slugify } from '@/lib/format';
export const prerender = false;

const schema = z.object({
  studioName: z.string().trim().min(1, 'Please enter the studio name.').max(120),
  studioWebsite: z.string().trim().max(200).optional().refine((v) => !v || /^https?:\/\/\S+$/.test(v), 'Enter a full web address starting with https://'),
  contactName: z.string().trim().min(1, 'Please enter a contact name.').max(120),
  contactEmail: email,
  town: z.string().trim().min(1, 'Please enter the town.').max(80),
  postcode: z.string().trim().max(12).optional(),
  title: z.string().trim().min(1, 'Please enter the job title.').max(120),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'PER_DIEM', 'OTHER'], { message: 'Choose an employment type.' }),
  payMin: z.coerce.number().min(0).max(100000).optional(),
  payMax: z.coerce.number().min(0).max(100000).optional(),
  payUnit: z.enum(['HOUR', 'CLASS', 'DAY', 'MONTH', 'YEAR']).optional(),
  disciplines: z.array(z.string().trim().max(40)).min(1, 'Choose at least one discipline.'),
  requirements: z.string().trim().max(2000).optional(),
  description: z.string().trim().min(1, 'Please describe the role.').max(2000, 'Keep the description under 2,000 characters.'),
  applyUrl: z.string().trim().max(300).optional().refine((v) => !v || /^https?:\/\/\S+$/.test(v), 'Enter a full web address starting with https://'),
  applyEmail: z.string().trim().max(200).optional().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address.'),
  validThrough: z.string().trim().optional(),
  graduateFriendly: z.string().optional(),
}).refine((d) => d.applyUrl || d.applyEmail, { message: 'Add an application link or email.', path: ['applyUrl'] })
  .refine((d) => !(d.payMin && d.payMax) || d.payMax >= d.payMin, { message: 'Maximum pay must be at least the minimum.', path: ['payMax'] });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const raw = await readForm(request);
  const back = '/jobs/post';
  if (isHoneypotTripped(raw)) return respond(request, { ok: true }, back, raw);
  if (!(await verifyTurnstile(str(raw['cf-turnstile-response']), clientAddress))) return respond(request, { ok: false, message: 'We could not verify you are human. Please try again.' }, back, raw);
  const data: Record<string, unknown> = { ...raw };
  data.disciplines = Array.isArray(raw.disciplines) ? raw.disciplines : String(raw.disciplines ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  ['payMin', 'payMax', 'payUnit', 'postcode', 'studioWebsite', 'applyUrl', 'applyEmail', 'requirements', 'validThrough'].forEach((k) => { if (data[k] === '') delete data[k]; });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return respond(request, { ok: false, message: 'Please check the highlighted fields.', errors: zodErrors(parsed.error) }, back, raw);
  const d = parsed.data;
  const validThrough = d.validThrough && /^\d{4}-\d{2}-\d{2}$/.test(d.validThrough) && d.validThrough > new Date().toISOString().slice(0, 10) ? d.validThrough : plusDays(60);
  const slug = `${slugify(`${d.title}-${d.studioName}`)}-${Date.now().toString(36)}`;
  const doc = {
    _type: 'job', status: 'pending', slug: { _type: 'slug', current: slug }, title: d.title,
    studioInline: { name: d.studioName, website: d.studioWebsite, town: d.town, postcode: d.postcode },
    contactName: d.contactName, submitterEmail: d.contactEmail,
    location: `${d.town}${d.postcode ? `, ${d.postcode}` : ''}`, town: d.town, postcode: d.postcode,
    employmentType: d.employmentType, payMin: d.payMin, payMax: d.payMax, payUnit: d.payUnit ?? (d.payMin || d.payMax ? 'HOUR' : undefined),
    disciplines: d.disciplines, requirements: d.requirements, description: d.description,
    applyUrl: d.applyUrl, applyEmail: d.applyEmail, validThrough, featuredGraduateFriendly: d.graduateFriendly === 'yes', submittedAt: new Date().toISOString(),
  };
  try {
    const client = getSanityWriteClient();
    let created = { _id: `dry-${slug}` };
    if (client) created = await client.create(doc); else console.info('[job:dry-run]', JSON.stringify(doc));
    const studioUrl = sanityConfig.projectId ? `https://${sanityConfig.projectId}.sanity.studio/structure/jobs;pending;${created._id}` : '(Sanity Studio not configured)';
    await sendEmail({ to: d.contactEmail, subject: 'We have your job listing', text: `Hi ${d.contactName},\n\nThanks for listing "${d.title}" at ${d.studioName}. We review every listing and publish genuine roles within 2 working days. You will get an email with the live link.\n\nThe Pilates Programme, Altrincham` });
    await sendEmail({ to: NOTIFY_EMAIL, replyTo: d.contactEmail, subject: `New job to review: ${d.title} at ${d.studioName}`, text: `${d.contactName} (${d.contactEmail}) submitted a role.\n\n${d.title} · ${d.studioName} · ${d.town}\n${d.employmentType} · ${d.disciplines.join(', ')}\n\n${d.description}\n\nReview and approve in Sanity Studio: ${studioUrl}\nApprove only genuine roles at real studios.` });
    return respond(request, { ok: true, event: 'job_submit', message: `Thanks. We have your listing for ${d.title}. We review within 2 working days and will email ${d.contactEmail} with the live link.`, redirect: '/jobs/post?sent=1' }, back, raw);
  } catch (err) {
    console.error('[job] failed', err);
    return respond(request, { ok: false, message: 'We could not save the listing just now. Your details are still in the form. Please try again.' }, back, raw);
  }
};
