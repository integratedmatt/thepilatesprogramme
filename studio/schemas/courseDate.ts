import { defineField, defineType } from 'sanity';
export default defineType({
  name: 'courseDate', title: 'Course date', type: 'document',
  fields: [
    defineField({ name: 'course', type: 'reference', to: [{ type: 'course' }, { type: 'cpd' }], validation: (r) => r.required() }),
    defineField({ name: 'startDate', type: 'date', validation: (r) => r.required() }),
    defineField({ name: 'endDate', type: 'date', validation: (r) => r.required() }),
    defineField({ name: 'dayPattern', type: 'string', options: { list: ['weekday', 'weekend'] }, initialValue: 'weekday' }),
    defineField({ name: 'location', type: 'string', options: { list: ['training-centre', 'partner-studio'] }, initialValue: 'training-centre' }),
    defineField({ name: 'locationName', title: 'Location name (partner studios)', type: 'string' }),
    defineField({ name: 'arketaUrl', title: 'Arketa link for this date', type: 'string', description: 'Path after https://app.arketa.co/iframe/pilatesprogramme/ e.g. schedule?serviceId=…', validation: (r) => r.required() }),
    defineField({ name: 'capacity', type: 'number' }),
    defineField({ name: 'spacesLeft', type: 'number', description: 'Shown when status is "few-spaces".' }),
    defineField({ name: 'status', type: 'string', options: { list: ['open', 'few-spaces', 'full', 'waitlist'] }, initialValue: 'open' }),
    defineField({ name: 'note', title: 'Internal note', type: 'string' }),
  ],
  preview: { select: { title: 'course.shortTitle', subtitle: 'startDate' } },
  orderings: [{ title: 'Start date', name: 'startDate', by: [{ field: 'startDate', direction: 'asc' }] }],
});
