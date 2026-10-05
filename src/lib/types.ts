/**
 * Content types shared by the Sanity GROQ projections and the local seed.
 * Every price, date and claim rendered on the site comes through these shapes.
 */

export type Path = 'qualify' | 'continue';
export type CourseKind = 'teacher-training' | 'apparatus' | 'cpd' | 'bundle';
export type DateStatus = 'open' | 'few-spaces' | 'full' | 'waitlist';
export type DayPattern = 'weekday' | 'weekend';
export type LocationKind = 'training-centre' | 'partner-studio';
export type Format = 'in-person' | 'online';

export interface SeoFields {
  title?: string;
  description?: string;
  ogImage?: ImageRef;
}

export interface ImageRef {
  /** Absolute URL or site-relative path. From Sanity this is the CDN URL. */
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface FinanceOption {
  label: string;           // "Pay in full" | "4 monthly interest-free payments"
  instalments?: number;    // 4
  amount?: number;         // 550 (per instalment)
}

export interface CurriculumGroup {
  title: string;           // Repertoire | Teaching skills | Career
  items: string[];
}

export interface HoursBreakdown {
  observation: number;
  personalStudy: number;
  practiceTeaching: number;
  inPersonDays?: number;
  inPersonHours?: number;  // used for cost per in-person hour
}

export interface Exam {
  title: string;
  detail: string;
}

export interface GoogleReview { author: string; authorUrl?: string; rating: number | null; text: string; publishTime?: string; relativeTime?: string; url?: string }
export interface GoogleReviews { rating: number | null; count: number | null; url: string; fetchedAt: string; reviews: GoogleReview[] }

export interface Faq {
  _id: string;
  question: string;
  answer: string;          // plain text or simple HTML
  group?: string;          // FAQ page grouping
  order?: number;
}

export interface Testimonial {
  _id: string;
  quote: string;
  name: string;
  course?: string;
  teachesAt?: string;
  image?: ImageRef;
}

export interface TeamMember {
  _id: string;
  name: string;
  slug: string;
  role: string;
  bio?: string;
  credentials?: string[];
  image?: ImageRef;
  founder?: boolean;
}

export interface Course {
  _id: string;
  _type: 'course' | 'cpd';
  title: string;
  slug: string;
  path: Path;
  kind: CourseKind;
  discipline: string;      // Mat | Reformer | Barre | Chair | Cadillac | Barrels | Prenatal ...
  level?: string;
  format: Format;
  shortTitle: string;      // "Mat" for cards and nav
  outcome: string;         // one-line outcome
  bestFor?: string;        // "best for" line used on hubs
  eyebrow?: string;        // "Teacher training · 5 in-person days"
  price?: number;          // undefined = [CLIENT TO CONFIRM]
  financeOptions: FinanceOption[];
  prerequisites?: string[];
  inclusions: string[];
  curriculum: CurriculumGroup[];
  hoursBreakdown?: HoursBreakdown;
  exams: Exam[];
  forYou?: string[];
  notForYou?: string[];
  afterBooking?: string[];
  unlocks?: string[];      // slugs of courses this unlocks
  heroImage?: ImageRef;
  gallery?: ImageRef[];
  faqs: string[];          // faq ids
  testimonials: string[];  // testimonial ids
  seo: SeoFields;
  answerSummary: string;   // 40-60 words
  answerQuestion?: string; // H2 for the answer box
  arketaFallbackUrl?: string;
  order?: number;
  guideUrl?: string;       // course guide PDF
}

export interface CourseDate {
  _id: string;
  course: string;          // course id
  startDate: string;       // ISO date
  endDate: string;         // ISO date
  dayPattern: DayPattern;
  location: LocationKind;
  locationName?: string;
  arketaUrl: string;       // path relative to the Arketa base
  capacity?: number;
  spacesLeft?: number;
  status: DateStatus;
  note?: string;
}

export interface PricingRule {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  detail?: string;
  saving?: number;
  amount?: number;
  percent?: number;
  appliesTo: string[];     // course slugs or 'all'
  howToClaim?: string;
}

export interface Studio {
  _id: string;
  name: string;
  slug: string;
  website?: string;
  town?: string;
  postcode?: string;
}

export type EmploymentType =
  | 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN' | 'VOLUNTEER' | 'PER_DIEM' | 'OTHER';

export interface Job {
  _id: string;
  slug: string;
  title: string;
  studio: Studio;
  location: string;
  town: string;
  postcode?: string;
  employmentType: EmploymentType;
  payMin?: number;
  payMax?: number;
  payUnit?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CLASS';
  disciplines: string[];
  requirements?: string;
  description: string;
  applyUrl?: string;
  applyEmail?: string;
  datePosted?: string;
  validThrough: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  featuredGraduateFriendly?: boolean;
  submitterEmail?: string;
}

export interface Graduate {
  _id: string;
  name: string;
  course: string;          // course slug
  cohort?: string;
  studios?: string[];
  town?: string;
  timeToFirstClass?: string;
  quote?: string;
  image?: ImageRef;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Category { _id: string; title: string; slug: string; description?: string }
export interface Author { _id: string; name: string; slug: string; role?: string; bio?: string; credentials?: string[]; image?: ImageRef }

export interface Post {
  _id: string;
  title: string;
  slug: string;
  summary: string;         // 40-60 words
  category: Category;
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  image?: ImageRef;
  body: string;            // HTML
  relatedCourses?: string[]; // course slugs
  seo: SeoFields;
}

export interface Redirect { _id: string; from: string; to: string; permanent: boolean }

export interface ProofStat { label: string; value?: string }
export interface TravelTime { from: string; minutes?: number; mode?: string }

export interface SiteSettings {
  siteName: string;
  entityName: string;      // "The Pilates Programme, Altrincham"
  tagline: string;
  email: string;
  instagram: string;
  instagramUrl: string;
  address: { street: string; town: string; postcode: string; country: string };
  geo?: { lat: number; lng: number };
  mapUrl?: string;
  logo?: ImageRef;
  accreditationBadges: { name: string; image?: ImageRef; url?: string }[];
  accreditationStatements: string[];   // approved wording per body [CLIENT TO CONFIRM]
  accreditationCareer?: string;        // [CLIENT TO CONFIRM]
  accreditationEmployerNote?: string;  // [CLIENT TO CONFIRM inclusion]
  proofStats: ProofStat[];             // hide any without a value
  googleReviewUrl?: string;
  googleBusinessUrl?: string;
  studioHireRate?: number;             // single figure [CLIENT TO CONFIRM]
  equipmentHireRate?: number;
  appMonthlyPrice?: number;
  appStoreUrl?: string;
  typicalClassRate?: number;           // payback maths [CLIENT TO CONFIRM]
  insuranceNote?: string;
  travelTimes: TravelTime[];           // [CLIENT TO CONFIRM]
  parkingNote?: string;
  accessibilityNote?: string;
  partnerStudios: string[];
  elevatingOthers: {
    open: boolean;
    windowNote?: string;
    placesPerYear?: number;
    story?: string;
    eligibility?: string[];
  };
  freeGuide: { title: string; bullets: string[]; coverImage?: ImageRef; fileUrl?: string };
  cohortCap?: number;
  weekendCohorts?: boolean;
  continueInclusions: string[];
  teachingMap?: {
    eyebrow?: string;
    heading: string;
    lead?: string;
    home: { name: string; lat: number; lng: number };
    locations: { name: string; region?: string; lat: number; lng: number; labelDx?: number; labelDy?: number; anchor?: 'start' | 'middle' | 'end' }[];
  };                // "What's included" on the Continuing Education hub
  heroTrustLine?: string;                      // e.g. "Trusted by 850+ students"
  pressLogos: { name: string; image?: ImageRef; url?: string }[];   // "As seen in"; image optional, text wordmark fallback
}
