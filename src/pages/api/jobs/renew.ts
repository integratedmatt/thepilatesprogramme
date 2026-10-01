import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '@/lib/sanity';
import { verifyRenewSignature, plusDays } from '@/lib/server/jobs';
export const prerender = false;

/** Signed one-click renewal link sent 7 days before expiry: extends validThrough by 60 days. */
export const GET: APIRoute = async ({ url, redirect }) => {
  const id = url.searchParams.get('id') ?? '';
  const sig = url.searchParams.get('sig') ?? '';
  if (!id || !sig || !verifyRenewSignature(id, sig)) return new Response('Invalid or expired renewal link.', { status: 400 });
  const client = getSanityWriteClient();
  if (!client) return new Response('Renewals are not configured.', { status: 503 });
  const job = await client.fetch<{ _id: string; slug: string; status: string } | null>(`*[_type == "job" && _id == $id][0]{ _id, "slug": slug.current, status }`, { id });
  if (!job) return new Response('Listing not found.', { status: 404 });
  await client.patch(job._id).set({ validThrough: plusDays(60), status: job.status === 'expired' ? 'approved' : job.status, renewedAt: new Date().toISOString() }).commit();
  return redirect(`/jobs/${job.slug}?renewed=1`, 303);
};
