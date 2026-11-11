// The site in the llms.txt format (https://llmstxt.org): name, summary, then lists of links.
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { getPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site!;
  const link = (name: string, path: string, note?: string) => `- [${name}](${new URL(path, site)})${note ? `: ${note}` : ''}`;
  const posts = await getPosts();
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## Pages',
    '',
    link('About', '/about/'),
    link('Feed', '/feeds/all.xml', 'every post, full text'),
    ...(posts.length > 0 ? ['', '## Posts', '', ...posts.map((p) => link(p.data.title, postUrl(p), p.data.subtitle))] : []),
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
