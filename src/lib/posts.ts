import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const TYPE_LABELS: Record<Post['data']['type'], string> = {
  essay: 'Essay',
  note: 'Note',
  til: 'TIL',
  link: 'Link',
};

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postUrl(post: Post): string {
  return `/posts/${post.id}/`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Dates render in UTC so a post dated 2026-10-28 never shows as the 27th.
export function formatDate(date: Date, style: 'long' | 'short' | 'iso' | 'day-month' = 'long'): string {
  if (style === 'iso') return date.toISOString().slice(0, 10);
  // en-GB abbreviates September as "Sept", which breaks a column of three-letter months.
  if (style === 'day-month') return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    ...(style === 'long' ? { year: 'numeric' } : {}),
  });
}

export function readingMinutes(post: Post): number {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export function hostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

export function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return [...groups];
}

export function bibtex(post: Post, site: URL): string {
  const { title, date } = post.data;
  const year = date.getUTCFullYear();
  const month = date.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' }).toLowerCase();
  const firstWord = title.toLowerCase().match(/[a-z]+/)?.[0] ?? 'post';
  return [
    `@misc{esposito${year}${firstWord},`,
    `  author = {Esposito, Joey},`,
    `  title  = {${title}},`,
    `  year   = {${year}},`,
    `  month  = ${month},`,
    `  url    = {${new URL(postUrl(post), site)}},`,
    `}`,
  ].join('\n');
}
