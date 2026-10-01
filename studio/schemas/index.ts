import course from './course';
import cpd from './cpd';
import courseDate from './courseDate';
import pricingRule from './pricingRule';
import testimonial from './testimonial';
import graduate from './graduate';
import teamMember from './teamMember';
import faq from './faq';
import post from './post';
import category from './category';
import author from './author';
import job from './job';
import studio from './studio';
import siteSettings from './siteSettings';
import redirect from './redirect';
import application from './application';
import { seo, imageWithAlt, financeOption, curriculumGroup, exam, hoursBreakdown } from './objects';

export const schemaTypes = [
  seo, imageWithAlt, financeOption, curriculumGroup, exam, hoursBreakdown,
  course, cpd, courseDate, pricingRule, testimonial, graduate, teamMember, faq, post, category, author, job, studio, siteSettings, redirect, application,
];
