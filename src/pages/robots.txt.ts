import type { APIContext } from 'astro';

export const GET = (context: APIContext) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', context.site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
