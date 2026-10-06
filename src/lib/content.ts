/**
 * Unified content access. Reads from Sanity when PUBLIC_SANITY_PROJECT_ID is set,
 * otherwise from the local seed in src/content/seed (same document shapes).
 * Pages never import seed files directly.
 */
import { getSanityClient, isSanityConfigured, IMAGE } from './sanity';
import type {
  Author, Category, Course, CourseDate, Faq, GoogleReviews, Graduate, Job, Post, PricingRule, Redirect,
  SiteSettings, Studio, TeamMember, Testimonial,
} from './types';

import seedSettings from '../content/seed/siteSettings.json';
import seedCourses from '../content/seed/courses.json';
import seedDates from '../content/seed/courseDates.json';
import seedPricing from '../content/seed/pricingRules.json';
import seedFaqs from '../content/seed/faqs.json';
import seedTeam from '../content/seed/teamMembers.json';
import seedTestimonials from '../content/seed/testimonials.json';
import seedGraduates from '../content/seed/graduates.json';
import seedJobs from '../content/seed/jobs.json';
import seedStudios from '../content/seed/studios.json';
import seedCategories from '../content/seed/categories.json';
import seedAuthors from '../content/seed/authors.json';
import seedPosts from '../content/seed/posts.json';
import seedRedirects from '../content/seed/redirects.json';
import googleReviewsData from '../content/seed/googleReviews.json';

const cache = new Map<string, Promise<unknown>>();
function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as Promise<T>;
}

async function fetchOrSeed<T>(key: string, groq: string, seed: () => T): Promise<T> {
  return memo(key, async () => {
    if (!isSanityConfigured()) return seed();
    try {
      const result = await getSanityClient().fetch<T>(groq);
      return (result ?? seed()) as T;
    } catch (err) {
      console.warn(`[content] Sanity fetch failed for ${key}; falling back to seed.`, err);
      return seed();
    }
  });
}

const SEO = `"seo": { "title": seo.title, "description": seo.description, "ogImage": seo.ogImage${IMAGE} }`;

const COURSE_PROJECTION = `{
  _id, _type, order, title, shortTitle, "slug": slug.current, path, kind, discipline, level, format, eyebrow,
  outcome, bestFor, price, financeOptions, prerequisites, inclusions, curriculum, hoursBreakdown, durationDays, exams,
  forYou, notForYou, afterBooking, unlocks, "heroImage": heroImage${IMAGE}, heroVideo, "gallery": gallery[]${IMAGE},
  "faqs": faqs[]._ref, "testimonials": testimonials[]._ref, ${SEO}, answerQuestion, answerSummary,
  arketaFallbackUrl, guideUrl
}`;

export async function getSiteSettings(): Promise<SiteSettings> {
  return fetchOrSeed<SiteSettings>(
    'siteSettings',
    `*[_type == "siteSettings"][0]{
      ..., "logo": logo${IMAGE},
      "accreditationBadges": accreditationBadges[]{ name, url, "image": image${IMAGE} },
      "pressLogos": pressLogos[]{ name, url, "image": image${IMAGE} },
      equipmentPartner,
      "freeGuide": { "title": freeGuide.title, "bullets": freeGuide.bullets, "coverImage": freeGuide.coverImage${IMAGE}, "fileUrl": freeGuide.file.asset->url }
    }`,
    () => seedSettings as unknown as SiteSettings,
  );
}

export async function getCourses(): Promise<Course[]> {
  const all = await fetchOrSeed<Course[]>(
    'courses',
    `*[_type in ["course", "cpd"]] | order(order asc) ${COURSE_PROJECTION}`,
    () => seedCourses as unknown as Course[],
  );
  return [...all].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  return (await getCourses()).find((c) => c.slug === slug);
}

export async function getQualifyCourses(): Promise<Course[]> {
  return (await getCourses()).filter((c) => c.path === 'qualify');
}
export async function getContinueCourses(): Promise<Course[]> {
  return (await getCourses()).filter((c) => c.path === 'continue');
}
export async function getApparatusCourses(): Promise<Course[]> {
  return (await getCourses()).filter((c) => c.kind === 'apparatus');
}
export async function getCpdCourses(): Promise<Course[]> {
  return (await getCourses()).filter((c) => c.kind === 'cpd');
}

export async function getCourseDates(): Promise<CourseDate[]> {
  const dates = await fetchOrSeed<CourseDate[]>(
    'courseDates',
    `*[_type == "courseDate"] | order(startDate asc) {
      _id, "course": course._ref, startDate, endDate, dayPattern, location, locationName, arketaUrl, capacity, spacesLeft, status, note
    }`,
    () => seedDates as unknown as CourseDate[],
  );
  return [...dates].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Upcoming dates only (end date today or later). Past dates disappear automatically. */
export async function getUpcomingDates(courseId?: string): Promise<CourseDate[]> {
  const today = new Date().toISOString().slice(0, 10);
  return (await getCourseDates()).filter((d) => d.endDate >= today && (!courseId || d.course === courseId));
}

export async function getPricingRules(): Promise<PricingRule[]> {
  return fetchOrSeed<PricingRule[]>(
    'pricingRules',
    `*[_type == "pricingRule"]{ _id, "slug": slug.current, title, summary, detail, saving, amount, percent, appliesTo, howToClaim }`,
    () => seedPricing as unknown as PricingRule[],
  );
}

export async function getFaqs(): Promise<Faq[]> {
  const faqs = await fetchOrSeed<Faq[]>(
    'faqs',
    `*[_type == "faq"] | order(order asc){ _id, question, answer, group, order }`,
    () => seedFaqs as unknown as Faq[],
  );
  return [...faqs].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export async function getFaqsByIds(ids: string[]): Promise<Faq[]> {
  const all = await getFaqs();
  return ids.map((id) => all.find((f) => f._id === id)).filter((f): f is Faq => Boolean(f));
}

export async function getTeam(): Promise<TeamMember[]> {
  return fetchOrSeed<TeamMember[]>(
    'team',
    `*[_type == "teamMember"] | order(founder desc, name asc){ _id, name, "slug": slug.current, role, bio, credentials, founder, "image": image${IMAGE} }`,
    () => seedTeam as unknown as TeamMember[],
  );
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return fetchOrSeed<Testimonial[]>(
    'testimonials',
    `*[_type == "testimonial" && approved == true]{ _id, quote, name, course, teachesAt, "image": image${IMAGE} }`,
    () => seedTestimonials as unknown as Testimonial[],
  );
}

export async function getTestimonialsByIds(ids: string[]): Promise<Testimonial[]> {
  const all = await getTestimonials();
  return ids.map((id) => all.find((t) => t._id === id)).filter((t): t is Testimonial => Boolean(t));
}

/**
 * Google rating and reviews, fetched at build time from the official Places API (scripts/fetch-google-reviews.mjs).
 * Only 4 and 5 star reviews that talk about training, teaching or the centre are shown, so they fit the social proof.
 */
const RELEVANT = /\b(course|training|trained|train|teacher|teaching|teach|trainer|instructor|qualif|certif|exam|reformer|mat|barre|cpd|centre|center|studio|learn|knowledge|support)/i;
export function getGoogleReviews(): GoogleReviews & { relevant: GoogleReviews['reviews'] } {
  const d = googleReviewsData as unknown as GoogleReviews;
  const relevant = (d.reviews ?? []).filter((r) => (r.rating ?? 0) >= 4 && r.text && r.text.length >= 40 && RELEVANT.test(r.text));
  return { ...d, relevant };
}

export async function getGraduates(): Promise<Graduate[]> {
  const grads = await fetchOrSeed<Graduate[]>(
    'graduates',
    `*[_type == "graduate" && status == "approved"]{ _id, name, course, cohort, studios, town, timeToFirstClass, quote, status, "image": image${IMAGE} }`,
    () => seedGraduates as unknown as Graduate[],
  );
  return grads.filter((g) => g.status === 'approved');
}

export async function getJobs(): Promise<Job[]> {
  const jobs = await fetchOrSeed<Job[]>(
    'jobs',
    `*[_type == "job"]{
      _id, "slug": slug.current, title,
      "studio": coalesce(studio->{ _id, name, "slug": slug.current, website, town, postcode }, studioInline),
      location, town, postcode, employmentType, payMin, payMax, payUnit, disciplines, requirements, description,
      applyUrl, applyEmail, datePosted, validThrough, status, featuredGraduateFriendly
    }`,
    () => seedJobs as unknown as Job[],
  );
  return jobs;
}

/** Approved, unexpired jobs sorted newest first. */
export async function getLiveJobs(): Promise<Job[]> {
  const today = new Date().toISOString().slice(0, 10);
  return (await getJobs())
    .filter((j) => j.status === 'approved' && j.validThrough >= today)
    .sort((a, b) => (b.datePosted ?? '').localeCompare(a.datePosted ?? ''));
}

export async function getStudios(): Promise<Studio[]> {
  return fetchOrSeed<Studio[]>(
    'studios',
    `*[_type == "studio"]{ _id, name, "slug": slug.current, website, town, postcode }`,
    () => seedStudios as unknown as Studio[],
  );
}

export async function getCategories(): Promise<Category[]> {
  return fetchOrSeed<Category[]>(
    'categories',
    `*[_type == "category"]{ _id, title, "slug": slug.current, description }`,
    () => seedCategories as unknown as Category[],
  );
}

export async function getAuthors(): Promise<Author[]> {
  return fetchOrSeed<Author[]>(
    'authors',
    `*[_type == "author"]{ _id, name, "slug": slug.current, role, bio, credentials, "image": image${IMAGE} }`,
    () => seedAuthors as unknown as Author[],
  );
}

interface RawPost extends Omit<Post, 'category' | 'author'> { category: string | Category; author: string | Author }

export async function getPosts(): Promise<Post[]> {
  const [raw, categories, authors] = await Promise.all([
    fetchOrSeed<RawPost[]>(
      'posts',
      `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc){
        _id, title, "slug": slug.current, summary, publishedAt, updatedAt, "image": image${IMAGE},
        "category": category->{ _id, title, "slug": slug.current, description },
        "author": author->{ _id, name, "slug": slug.current, role, bio, credentials, "image": image${IMAGE} },
        "body": coalesce(bodyHtml, ""), relatedCourses, ${SEO}
      }`,
      () => seedPosts as unknown as RawPost[],
    ),
    getCategories(),
    getAuthors(),
  ]);
  const posts = raw.map((p) => ({
    ...p,
    category: typeof p.category === 'string' ? (categories.find((c) => c._id === p.category) as Category) : p.category,
    author: typeof p.author === 'string' ? (authors.find((a) => a._id === p.author) as Author) : p.author,
  })) as Post[];
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getRedirects(): Promise<Redirect[]> {
  return fetchOrSeed<Redirect[]>(
    'redirects',
    `*[_type == "redirect"]{ _id, from, to, permanent }`,
    () => seedRedirects as unknown as Redirect[],
  );
}

/** Course URL by path. */
export function courseUrl(course: Pick<Course, 'slug' | 'path' | 'kind'>): string {
  if (course.path === 'qualify') return `/become-a-pilates-instructor/${course.slug}`;
  if (course.kind === 'cpd') return `/continuing-education/cpd/${course.slug}`;
  return `/continuing-education/${course.slug}`;
}

export function hubUrl(path: 'qualify' | 'continue'): string {
  return path === 'qualify' ? '/become-a-pilates-instructor' : '/continuing-education';
}
