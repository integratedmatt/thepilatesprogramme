export function gbp(amount: number | null | undefined, opts: { decimals?: boolean } = {}): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(amount);
}

const DAY_MONTH = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const LONG = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export function parseDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

/** "27 – 30 Oct 2026" or "20 Nov 2026" or "30 Nov – 2 Dec 2026". */
export function dateRange(start: string, end: string): string {
  const s = parseDate(start);
  const e = parseDate(end);
  if (start === end) return DAY_MONTH_YEAR.format(s);
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  if (sameMonth) return `${s.getUTCDate()} – ${DAY_MONTH_YEAR.format(e)}`;
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  if (sameYear) return `${DAY_MONTH.format(s)} – ${DAY_MONTH_YEAR.format(e)}`;
  return `${DAY_MONTH_YEAR.format(s)} – ${DAY_MONTH_YEAR.format(e)}`;
}

export function longDate(iso: string): string {
  return LONG.format(parseDate(iso));
}

export function monthYear(iso: string): string {
  return MONTH_YEAR.format(parseDate(iso));
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

export function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Price line for cards: "£2,200 or 4 × £550". */
export function priceLine(price: number | null | undefined, finance: { instalments?: number; amount?: number }[] = []): string {
  if (price === null || price === undefined) return '';
  const inst = finance.find((f) => f.instalments && f.amount);
  return inst ? `${gbp(price)} or ${inst.instalments} × ${gbp(inst.amount)}` : gbp(price);
}
