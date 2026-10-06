/**
 * Affiliate links. Any link to the equipment partner's domain, whatever the page or path, carries the
 * tracking parameters from the affiliate URL in site settings, opens in a new tab and is marked
 * rel="sponsored" (Google's requirement for paid links). Disclosure copy sits next to each placement.
 */
import type { SiteSettings } from './types';

type Partner = NonNullable<SiteSettings['equipmentPartner']>;
const host = (u: URL) => u.hostname.replace(/^www\./, '');

export function affiliateHref(href: string, partner?: Partner): string {
  if (!partner?.url) return href;
  let target: URL, aff: URL;
  try { target = new URL(href); aff = new URL(partner.url); } catch { return href; }
  if (host(target) !== host(aff)) return href;
  aff.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  return target.toString();
}

export const AFFILIATE_REL = 'sponsored noopener';

/** Rewrites partner links inside CMS HTML (articles, FAQ answers). */
export function withAffiliateLinks(html: string, partner?: Partner): string {
  if (!partner?.url) return html;
  return html.replace(/<a\b([^>]*?)\shref="([^"]+)"([^>]*)>/gi, (tag, pre: string, href: string, post: string) => {
    const decoded = href.replace(/&amp;/g, '&');
    const next = affiliateHref(decoded, partner);
    if (next === decoded) return tag;
    const attrs = `${pre}${post}`.replace(/\s(rel|target)="[^"]*"/gi, '');
    return `<a${attrs} href="${next.replace(/&/g, '&amp;')}" rel="${AFFILIATE_REL}" target="_blank">`;
  });
}
