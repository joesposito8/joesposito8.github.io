import type { APIContext } from 'astro';
import { SITE } from '../../config';
import { postFeed } from '../../lib/feed';

export const GET = (context: APIContext) => postFeed(context, { path: '/feeds/all.xml', title: SITE.name });
