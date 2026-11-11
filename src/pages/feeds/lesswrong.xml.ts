// LessWrong imports this feed as drafts; its URL is registered with LessWrong, so the path is fixed.
import type { APIContext } from 'astro';
import { SITE } from '../../config';
import { postFeed } from '../../lib/feed';

export const GET = (context: APIContext) =>
  postFeed(context, { path: '/feeds/lesswrong.xml', title: `${SITE.name}: LessWrong`, include: (post) => post.data.lesswrong });
