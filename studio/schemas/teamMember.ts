import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'teamMember', title: 'Team member', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'bio', type: 'text', rows: 6 }),
    defineField({ name: 'credentials', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'image', title: 'Headshot', type: 'imageWithAlt' }),
    defineField({ name: 'founder', type: 'boolean', initialValue: false }),
  ],
});
