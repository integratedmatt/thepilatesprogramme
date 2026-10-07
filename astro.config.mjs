// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Writes /sitemap.xml: a conventional single sitemap (<urlset> of every page) built from the URLs
 * @astrojs/sitemap collected. Runs after the sitemap integration in the same build output folder.
 */
const conventionalSitemap = () => ({
  name: 'conventional-sitemap',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const source = await readFile(new URL('sitemap-0.xml', dir), 'utf8');
      const urls = [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`).join('\n')}\n</urlset>\n`;
      await writeFile(new URL('sitemap.xml', dir), xml);
      console.log(`[sitemap] wrote sitemap.xml with ${urls.length} URLs`);
    },
  },
});

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
        !page.includes('/jobs/expired') &&
        !page.includes('/jobs/review') &&
        !page.includes('/jobs/post'),
      changefreq: 'weekly',
    }),
    conventionalSitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
