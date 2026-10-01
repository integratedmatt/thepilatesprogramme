import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'testimonial', title: 'Testimonial', type: 'document',
  description: 'Real customer words only. Full name and current studio required.',
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'name', title: 'Full name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'course', type: 'string' }),
    defineField({ name: 'teachesAt', title: 'Where they teach now', type: 'string' }),
    defineField({ name: 'image', type: 'imageWithAlt' }),
    defineField({ name: 'approved', title: 'Approved to publish (consent received)', type: 'boolean', initialValue: false }),
  ],
  preview: { select: { title: 'name', subtitle: 'teachesAt' } },
});
