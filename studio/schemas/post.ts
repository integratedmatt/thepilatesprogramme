import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'post', title: 'Journal post', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'summary', title: 'Summary (40 to 60 words)', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'category', type: 'reference', to: [{ type: 'category' }], validation: (r) => r.required() }),
    defineField({ name: 'author', type: 'reference', to: [{ type: 'author' }], validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', type: 'date', validation: (r) => r.required() }),
    defineField({ name: 'updatedAt', type: 'date' }),
    defineField({ name: 'image', type: 'imageWithAlt' }),
    defineField({ name: 'bodyHtml', title: 'Body (HTML)', type: 'text', rows: 30, description: 'Use question-led H2s followed by a direct answer.' }),
    defineField({ name: 'relatedCourses', title: 'Related course slugs', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] }],
});
