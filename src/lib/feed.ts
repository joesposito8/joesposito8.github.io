import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { getPosts, postUrl, type Post } from './posts';

// Feed readers, and LessWrong's importer, show the HTML away from the site, so every
// root-relative link and footnote anchor has to point back at the post's own URL.
function absolutize(html: string, page: URL): string {
  return html.replace(/(src|href)="\/(?!\/)/g, `$1="${page.origin}/`).replace(/href="#/g, `href="${page.href}#`);
}

interface FeedOptions {
  /** The feed's own path, for its rel="self" link. */
  path: string;
  title: string;
  include?: (post: Post) => boolean;
}

/**
 * An RSS feed with each post's full HTML in `content:encoded`. The guid is the post's URL,
 * so it stays the same across rebuilds: LessWrong's importer deduplicates on it.
 */
export async function postFeed(context: APIContext, { path, title, include = () => true }: FeedOptions): Promise<Response> {
  const site = context.site!;
  const posts = (await getPosts()).filter(include);
  return rss({
    title,
    description: SITE.description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<atom:link href="${new URL(path, site)}" rel="self" type="application/rss+xml"/>`,
    items: posts.map((post) => {
      const url = new URL(postUrl(post), site);
      return {
        title: post.data.title,
        link: url.href,
        pubDate: post.data.date,
        description: post.data.subtitle,
        categories: post.data.tags,
        content: absolutize(post.rendered?.html ?? '', url),
      };
    }),
  });
}
