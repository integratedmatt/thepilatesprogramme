/** Arketa booking links. Checkout stays in Arketa; every link opens in a new tab with UTMs. */
export const ARKETA_BASE = 'https://app.arketa.co/iframe/pilatesprogramme/';

export interface ArketaLinkOptions {
  courseSlug: string;
  dateId?: string;
}

export function arketaUrl(path: string, { courseSlug, dateId }: ArketaLinkOptions): string {
  const clean = path.replace(/^\/+/, '');
  const [base, query = ''] = clean.split('?');
  const params = new URLSearchParams(query);
  if (base.startsWith('schedule') && !params.has('showPrivate')) params.set('showPrivate', 'true');
  params.set('utm_source', 'website');
  params.set('utm_medium', 'book_button');
  params.set('utm_campaign', courseSlug);
  if (dateId) params.set('utm_content', dateId);
  return `${ARKETA_BASE}${base}?${params.toString()}`;
}
