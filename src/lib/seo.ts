import type { SeoFields } from './types';

export const SITE_SUFFIX = ' | The Pilates Programme';
export const DEFAULT_OG = '/images/og-default.png';

/** Title ≤ 60 chars where possible: "[Primary query] | The Pilates Programme". */
export function pageTitle(primary: string, seo?: SeoFields): string {
  if (seo?.title) return seo.title;
  const t = `${primary}${SITE_SUFFIX}`;
  return t;
}

export function pageDescription(fallback: string, seo?: SeoFields): string {
  return seo?.description || fallback;
}

export function canonical(site: URL | undefined, pathname: string): string {
  const base = site?.origin ?? 'https://www.thepilatesprogramme.co.uk';
  const clean = pathname.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  return `${base}${clean === '/' ? '' : clean}` || base;
}
