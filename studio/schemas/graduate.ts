import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'graduate', title: 'Graduate profile', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'email', type: 'string', description: 'Never published.' }),
    defineField({ name: 'course', title: 'Course slug', type: 'string' }),
    defineField({ name: 'cohort', type: 'string' }),
    defineField({ name: 'studios', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'town', type: 'string' }),
    defineField({ name: 'timeToFirstClass', type: 'string' }),
    defineField({ name: 'quote', type: 'text', rows: 3 }),
    defineField({ name: 'image', type: 'imageWithAlt' }),
    defineField({ name: 'status', type: 'string', options: { list: ['pending', 'approved', 'rejected'] }, initialValue: 'pending' }),
    defineField({ name: 'submittedAt', type: 'datetime', readOnly: true }),
  ],
  preview: { select: { title: 'name', subtitle: 'status' } },
});
