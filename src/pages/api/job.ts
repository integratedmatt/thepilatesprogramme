import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, respond, isHoneypotTripped, verifyTurnstile, zodErrors, email, str } from '@/lib/server/forms';
import { sendEmail, NOTIFY_EMAIL, escapeHtml } from '@/lib/server/email';
import { getSanityWriteClient, sanityConfig } from '@/lib/sanity';
import { plusDays, reviewUrl } from '@/lib/server/jobs';
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
    const approve = reviewUrl(created._id, 'approve');
    const decline = reviewUrl(created._id, 'decline');
    const pay = d.payMin || d.payMax ? `£${[d.payMin, d.payMax].filter(Boolean).join('–')} per ${(d.payUnit ?? 'HOUR').toLowerCase()}` : 'Not given';
    const rows: [string, string][] = [['Role', d.title], ['Studio', `${d.studioName}, ${d.town}${d.postcode ? ` ${d.postcode}` : ''}`], ['Website', d.studioWebsite ?? 'Not given'], ['Type', d.employmentType], ['Disciplines', d.disciplines.join(', ')], ['Pay', pay], ['Apply via', d.applyUrl ?? d.applyEmail ?? ''], ['Submitted by', `${d.contactName} (${d.contactEmail})`]];
    const text = `${d.contactName} (${d.contactEmail}) submitted a role for the jobs board.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${d.description}${d.requirements ? `\n\nRequirements: ${d.requirements}` : ''}\n\nApprove and publish: ${approve}\nDecline: ${decline}\n\nEach link opens a confirmation page. Or review in Sanity Studio: ${studioUrl}\nApprove only genuine roles at real studios.`;
    const btn = (href: string, label: string, primary: boolean) => `<a href="${href}" style="display:inline-block;padding:14px 24px;margin-right:12px;font-weight:600;text-decoration:none;border:1px solid #111;${primary ? 'background:#111;color:#fff' : 'background:#fff;color:#111'}">${label}</a>`;
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#111;max-width:600px"><p>${escapeHtml(d.contactName)} submitted a role for the jobs board.</p><table style="border-collapse:collapse;margin:16px 0">${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`).join('')}</table><p style="white-space:pre-line">${escapeHtml(d.description)}</p>${d.requirements ? `<p style="white-space:pre-line"><strong>Requirements</strong><br>${escapeHtml(d.requirements)}</p>` : ''}<p style="margin:28px 0">${btn(approve, 'Approve and publish', true)}${btn(decline, 'Decline', false)}</p><p style="font-size:14px;color:#666">Each button opens a confirmation page, so nothing changes until you confirm. The studio is emailed automatically either way. Approve only genuine roles at real studios.</p></div>`;
    await sendEmail({ to: NOTIFY_EMAIL, replyTo: d.contactEmail, subject: `New job to review: ${d.title} at ${d.studioName}`, text, html });
    return respond(request, { ok: true, event: 'job_submit', message: `Thanks. We have your listing for ${d.title}. We review within 2 working days and will email ${d.contactEmail} with the live link.`, redirect: '/jobs/post?sent=1' }, back, raw);
  } catch (err) {
    console.error('[job] failed', err);
    return respond(request, { ok: false, message: 'We could not save the listing just now. Your details are still in the form. Please try again.' }, back, raw);
  }
};
