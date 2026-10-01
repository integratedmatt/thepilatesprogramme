import { defineType } from 'sanity';
import { courseFields } from './courseFields';
export default defineType({ name: 'cpd', title: 'CPD', type: 'document', fields: courseFields, preview: { select: { title: 'title', subtitle: 'format' } } });
