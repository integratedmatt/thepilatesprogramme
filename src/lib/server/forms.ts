/** Shared helpers for API routes: parsing, honeypot, Turnstile, JSON-or-redirect responses. */
import { z } from 'zod';

export type FormResult = { ok: true; message?: string; event?: string; redirect?: string } | { ok: false; message: string; errors?: Record<string, string> };

export type FormValue = string | File | string[];

/** Reads JSON or form data. Repeated keys (checkbox groups) become arrays. */
export async function readForm(request: Request): Promise<Record<string, FormValue>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return (await request.json()) as Record<string, FormValue>;
  const fd = await request.formData();
  const out: Record<string, FormValue> = {};
  fd.forEach((v, k) => {
    const existing = out[k];
    if (existing === undefined) out[k] = v;
    else if (Array.isArray(existing)) existing.push(String(v));
    else out[k] = [String(existing), String(v)];
  });
  return out;
}

export function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

export function respond(request: Request, result: FormResult, fallbackRedirect: string, data?: Record<string, FormValue>): Response {
  if (wantsJson(request)) {
    return new Response(JSON.stringify(result), { status: result.ok ? 200 : 400, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  // No-JS fallback: redirect with a status flag.
  const target = result.ok ? (result.redirect || String(data?.redirect || fallbackRedirect)) : fallbackRedirect;
  const url = new URL(target, 'https://placeholder.local');
  url.searchParams.set(result.ok ? 'sent' : 'error', '1');
  return Response.redirect(target.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`, 303);
}

export function isHoneypotTripped(data: Record<string, unknown>): boolean {
  return Boolean(data.website);
}

export async function verifyTurnstile(token: string | undefined, ip?: string | null): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY as string | undefined;
  if (!secret) return true; // not configured (local / preview)
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
    });
    const json = (await res.json()) as { success: boolean };
    return Boolean(json.success);
  } catch {
    return false;
  }
}

export function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const email = z.string().trim().email('Enter a valid email address, like name@example.com.');
export const consent = z.literal('yes', { message: 'Please tick the consent box to continue.' });

export function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
