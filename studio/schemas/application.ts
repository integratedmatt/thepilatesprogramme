import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'application', title: 'Application (Elevating Others)', type: 'document',
  fields: [
    defineField({ name: 'programme', type: 'string', initialValue: 'elevating-others' }),
    defineField({ name: 'status', type: 'string', options: { list: ['pending', 'shortlisted', 'accepted', 'declined'] }, initialValue: 'pending' }),
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'town', type: 'string' }),
    defineField({ name: 'story', type: 'text', rows: 8 }),
    defineField({ name: 'barriers', type: 'text', rows: 5 }),
    defineField({ name: 'submittedAt', type: 'datetime', readOnly: true }),
  ],
  preview: { select: { title: 'name', subtitle: 'status' } },
});
