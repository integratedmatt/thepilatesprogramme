import { defineType } from 'sanity';
import { courseFields } from './courseFields';
export default defineType({ name: 'course', title: 'Course', type: 'document', fields: courseFields, preview: { select: { title: 'title', subtitle: 'path' } } });
