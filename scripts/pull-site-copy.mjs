/**
 * Pulls the page copy from the existing Squarespace site into content/old-site/<slug>.md.
 * This is the reference text for the rebuild: the client is happy with the old wording and it is
 * the source of truth for tone and facts (see claude/2026-10-08_tpp-brand-voice.md).
 *
 *   node scripts/pull-site-copy.mjs
 *   SITE_ORIGIN=https://www.thepilatesprogramme.co.uk node scripts/pull-site-copy.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.SITE_ORIGIN || 'https://www.thepilatesprogramme.co.uk';
const UA = 'Mozilla/5.0 (compatible; TPP-rebuild-copy-pull)';
const outDir = new URL('../content/old-site/', import.meta.url);
await mkdir(outDir, { recursive: true });

const sitemap = await (await fetch(`${origin}/sitemap.xml`, { headers: { 'user-agent': UA } })).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => !/\/blog\//.test(u));
if (!urls.includes(`${origin}/`)) urls.unshift(`${origin}/`);

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;|&#x27;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const text = (html) => decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

function toMarkdown(html) {
  // Keep only the page body; drop header, footer, nav, scripts, styles and Squarespace noise.
  let body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  const main = body.match(/<main[\s\S]*?<\/main>/i) || body.match(/<article[\s\S]*?<\/article>/i) || body.match(/<section[^>]*class="[^"]*page-section[\s\S]*<\/section>/i);
  if (main) body = main[0];
  body = body.replace(/<header[\s\S]*?<\/header>/gi, '').replace(/<footer[\s\S]*?<\/footer>/gi, '').replace(/<nav[\s\S]*?<\/nav>/gi, '');
  const out = [];
  const re = /<(h[1-6]|p|li|blockquote|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(body))) {
    const [, tag, attrs, inner] = m;
    const t = text(inner);
    if (!t) continue;
    let line;
    if (/^h\d$/.test(tag)) line = `${'#'.repeat(Number(tag[1]))} ${t}`;
    else if (tag === 'li') line = `- ${t}`;
    else if (tag === 'blockquote') line = `> ${t}`;
    else if (tag === 'a') { if (!/sqs-block-button-element|btn/.test(attrs)) continue; line = `[Button: ${t}]`; }
    else line = t;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out.join('\n\n');
}

for (const url of urls) {
  const slug = url.replace(origin, '').replace(/^\/|\/$/g, '') || 'home';
  let html;
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) { console.warn(`skip ${url}: ${res.status}`); continue; }
    html = await res.text();
  } catch (e) { console.warn(`skip ${url}: ${e.message}`); continue; }
  const title = text((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]);
  const description = decode((html.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1]);
  const md = `---\nsource: ${url}\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\npulled: ${new Date().toISOString().slice(0, 10)}\n---\n\n${toMarkdown(html)}\n`;
  await writeFile(new URL(`${slug}.md`, outDir), md);
  console.log(`✓ ${slug}.md (${md.length} chars)`);
}
