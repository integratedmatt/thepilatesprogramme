import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';
import { structure } from './structure';
import { approveJob, rejectJob, approveGraduate } from './actions';

export default defineConfig({
  name: 'thepilatesprogramme',
  title: 'The Pilates Programme',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'replace-me',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, ctx) => {
      if (ctx.schemaType === 'job') return [approveJob, rejectJob, ...prev];
      if (ctx.schemaType === 'graduate') return [approveGraduate, ...prev];
      return prev;
    },
  },
});
