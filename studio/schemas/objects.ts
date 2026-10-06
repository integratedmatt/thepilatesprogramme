import { defineField, defineType } from 'sanity';

export const imageWithAlt = defineType({
  name: 'imageWithAlt', title: 'Image', type: 'image', options: { hotspot: true },
  fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string', description: 'Describe the teaching scene. Leave empty only for purely decorative images.', validation: (r) => r.max(160) })],
});

export const seo = defineType({
  name: 'seo', title: 'SEO', type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title tag', type: 'string', description: 'Format: [Primary query] | The Pilates Programme. 60 characters or fewer.', validation: (r) => r.max(70).warning('Keep under 60 characters') }),
    defineField({ name: 'description', title: 'Meta description', type: 'text', rows: 3, description: '140 to 155 characters with a benefit and a proof point.', validation: (r) => r.max(160).warning('Keep under 155 characters') }),
    defineField({ name: 'ogImage', title: 'Share image', type: 'imageWithAlt' }),
  ],
});

export const financeOption = defineType({
  name: 'financeOption', title: 'Finance option', type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'instalments', title: 'Number of instalments', type: 'number' }),
    defineField({ name: 'amount', title: 'Amount per instalment (£)', type: 'number' }),
  ],
});

export const curriculumGroup = defineType({
  name: 'curriculumGroup', title: 'Curriculum group', type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Group', type: 'string', description: 'Repertoire, Teaching skills, Career' }),
    defineField({ name: 'items', title: 'Items', type: 'array', of: [{ type: 'string' }] }),
  ],
});

export const exam = defineType({
  name: 'exam', title: 'Exam', type: 'object',
  fields: [defineField({ name: 'title', type: 'string' }), defineField({ name: 'detail', type: 'string' })],
});

export const hoursBreakdown = defineType({
  name: 'hoursBreakdown', title: 'Hours breakdown', type: 'object',
  fields: [
    defineField({ name: 'observation', title: 'Observation hours', type: 'number' }),
    defineField({ name: 'personalStudy', title: 'Personal study hours', type: 'number' }),
    defineField({ name: 'practiceTeaching', title: 'Practice teaching hours', type: 'number' }),
    defineField({ name: 'inPersonHours', title: 'In-person hours (for cost per hour)', type: 'number', description: 'Leave empty to assume 7 hours per course day.' }),
  ],
});
