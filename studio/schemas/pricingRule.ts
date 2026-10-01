import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'pricingRule', title: 'Pricing rule', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required(), description: 'Keep: double-booking, fitness-qualification-discount, returning-student, apparatus-bundle' }),
    defineField({ name: 'summary', type: 'text', rows: 2 }),
    defineField({ name: 'detail', type: 'text', rows: 2 }),
    defineField({ name: 'amount', title: 'Amount (£)', type: 'number' }),
    defineField({ name: 'saving', title: 'Saving (£)', type: 'number' }),
    defineField({ name: 'percent', title: 'Percent off', type: 'number' }),
    defineField({ name: 'appliesTo', title: 'Applies to (course slugs or "all")', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'howToClaim', type: 'text', rows: 2 }),
  ],
});
