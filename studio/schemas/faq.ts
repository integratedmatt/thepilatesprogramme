import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'faq', title: 'FAQ', type: 'document',
  fields: [
    defineField({ name: 'question', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'answer', type: 'text', rows: 5, validation: (r) => r.required() }),
    defineField({ name: 'group', type: 'string', options: { list: ['Choosing a course', 'Cost and finance', 'Practice hours and exams', 'Accreditation', 'After you qualify', 'Continuing education', 'The training centre'] } }),
    defineField({ name: 'order', type: 'number' }),
  ],
});
