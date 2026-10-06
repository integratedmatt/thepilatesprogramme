/** JSON-LD builders. All values come from CMS content. */
import type { Course, CourseDate, Faq, Job, Post, SiteSettings } from './types';

const CONTEXT = 'https://schema.org';

export function organizationSchema(s: SiteSettings, siteUrl: string) {
  return {
    '@context': CONTEXT,
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': `${siteUrl}/#organization`,
    name: s.entityName,
    alternateName: s.siteName,
    url: siteUrl,
    logo: s.logo?.url ? absolute(siteUrl, s.logo.url) : undefined,
    email: s.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address.street,
      addressLocality: s.address.town,
      postalCode: s.address.postcode,
      addressCountry: s.address.country,
    },
    geo: s.geo ? { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng } : undefined,
    sameAs: [s.instagramUrl, s.googleBusinessUrl].filter(Boolean),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[], siteUrl: string) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(siteUrl, item.url),
    })),
  };
}

export function faqSchema(faqs: Faq[]) {
  if (!faqs.length) return null;
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) },
    })),
  };
}

export function courseInstanceSchema(d: CourseDate, s: SiteSettings, days?: number) {
  const onsite = d.location !== 'partner-studio';
  return {
    '@type': 'CourseInstance',
    courseMode: 'onsite',
    courseWorkload: days ? `P${days}D` : undefined,
    startDate: d.startDate,
    endDate: d.endDate,
    courseSchedule: {
      '@type': 'Schedule',
      startDate: d.startDate,
      endDate: d.endDate,
      repeatFrequency: 'Daily',
      byDay: d.dayPattern === 'weekend' ? ['Saturday', 'Sunday'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    location: {
      '@type': 'Place',
      name: d.locationName || (onsite ? s.entityName : 'Partner studio'),
      address: onsite
        ? { '@type': 'PostalAddress', streetAddress: s.address.street, addressLocality: s.address.town, postalCode: s.address.postcode, addressCountry: s.address.country }
        : { '@type': 'PostalAddress', addressLocality: 'Manchester', addressCountry: 'GB' },
    },
  };
}

export function courseSchema(c: Course, dates: CourseDate[], s: SiteSettings, siteUrl: string, url: string) {
  return {
    '@context': CONTEXT,
    '@type': 'Course',
    name: c.title,
    description: c.answerSummary,
    url: absolute(siteUrl, url),
    provider: { '@type': 'EducationalOrganization', name: s.entityName, '@id': `${siteUrl}/#organization` },
    image: c.heroImage?.url ? absolute(siteUrl, c.heroImage.url) : undefined,
    offers: c.price != null
      ? { '@type': 'Offer', price: c.price, priceCurrency: 'GBP', category: 'Paid', availability: 'https://schema.org/InStock', url: absolute(siteUrl, url) }
      : undefined,
    hasCourseInstance: dates.length
      ? dates.map((d) => courseInstanceSchema(d, s, c.durationDays))
      : c.format === 'online'
        ? [{ '@type': 'CourseInstance', courseMode: 'online', courseWorkload: c.durationDays ? `P${c.durationDays}D` : 'PT4H' }]
        : undefined,
  };
}

export function jobPostingSchema(j: Job, siteUrl: string) {
  return {
    '@context': CONTEXT,
    '@type': 'JobPosting',
    title: j.title,
    description: j.description,
    datePosted: j.datePosted,
    validThrough: j.validThrough,
    employmentType: j.employmentType,
    hiringOrganization: { '@type': 'Organization', name: j.studio.name, sameAs: j.studio.website || undefined },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: j.town, postalCode: j.postcode, addressCountry: 'GB' },
    },
    baseSalary: j.payMin || j.payMax
      ? {
          '@type': 'MonetaryAmount',
          currency: 'GBP',
          value: { '@type': 'QuantitativeValue', minValue: j.payMin, maxValue: j.payMax ?? j.payMin, unitText: j.payUnit === 'CLASS' ? 'HOUR' : j.payUnit ?? 'HOUR' },
        }
      : undefined,
    url: `${siteUrl}/jobs/${j.slug}`,
    directApply: Boolean(j.applyUrl || j.applyEmail),
  };
}

export function articleSchema(p: Post, s: SiteSettings, siteUrl: string, url: string) {
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline: p.title,
    description: p.summary,
    image: p.image?.url ? absolute(siteUrl, p.image.url) : undefined,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt || p.publishedAt,
    author: {
      '@type': 'Person',
      name: p.author?.name,
      jobTitle: p.author?.role,
      description: p.author?.credentials?.length ? p.author.credentials.join(', ') : undefined,
      url: p.author?.slug ? `${siteUrl}/about/${p.author.slug}` : undefined,
    },
    publisher: { '@type': 'Organization', name: s.entityName, '@id': `${siteUrl}/#organization` },
    mainEntityOfPage: absolute(siteUrl, url),
  };
}

export function absolute(siteUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Remove undefined keys so the JSON-LD output is clean. */
export function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
