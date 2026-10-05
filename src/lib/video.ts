import type { HeroVideo } from '@/components/Hero.astro';

/**
 * Hero video sources from a base path such as "/video/advanced-reformer". Expects four files encoded
 * from one 1920×1080 master: -1080 and -720 in WebM (VP9) and MP4 (H.264). See README, "Home hero video".
 */
export function heroVideoSources(base?: string): HeroVideo | undefined {
  if (!base || !/^\/video\/[a-z0-9-]+$/.test(base)) return undefined;
  return {
    sources: [
      { src: `${base}-1080.webm`, type: 'video/webm; codecs="vp9"', minWidth: 1024 },
      { src: `${base}-720.webm`, type: 'video/webm; codecs="vp9"', minWidth: 0 },
      { src: `${base}-1080.mp4`, type: 'video/mp4; codecs="avc1.640028"', minWidth: 1024 },
      { src: `${base}-720.mp4`, type: 'video/mp4; codecs="avc1.64001f"', minWidth: 0 },
    ],
  };
}
