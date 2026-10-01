// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL || 'https://www.thepilatesprogramme.co.uk';

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel({
    imageService: true,
    webAnalytics: { enabled: false },
  }),
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/studio') &&
        !page.includes('/thank-you') &&
        !page.includes('/404') &&
        !page.includes('/jobs/expired'),
      changefreq: 'weekly',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
