import { createClient, type SanityClient } from '@sanity/client';

export const sanityConfig = {
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID as string | undefined,
  dataset: (import.meta.env.PUBLIC_SANITY_DATASET as string | undefined) || 'production',
  apiVersion: (import.meta.env.PUBLIC_SANITY_API_VERSION as string | undefined) || '2026-10-01',
};

export function isSanityConfigured(): boolean {
  return Boolean(sanityConfig.projectId);
}

let client: SanityClient | null = null;

/** Read client (CDN, published content). */
export function getSanityClient(): SanityClient {
  if (!client) {
    client = createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      apiVersion: sanityConfig.apiVersion,
      useCdn: true,
    });
  }
  return client;
}

/** Write client for API routes (jobs, graduates, applications). Server only. */
export function getSanityWriteClient(): SanityClient | null {
  const token = import.meta.env.SANITY_WRITE_TOKEN as string | undefined;
  if (!sanityConfig.projectId || !token) return null;
  return createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.dataset,
    apiVersion: sanityConfig.apiVersion,
    token,
    useCdn: false,
  });
}

/** GROQ fragment that resolves an image field to the ImageRef shape. */
export const IMAGE = `{ "url": asset->url, "alt": coalesce(alt, ""), "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`;
