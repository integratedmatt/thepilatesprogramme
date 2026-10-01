import { defineField, defineType } from 'sanity';
export default defineType({ name: 'category', title: 'Category', type: 'document', fields: [defineField({ name: 'title', type: 'string' }), defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }), defineField({ name: 'description', type: 'text', rows: 2 })] });
