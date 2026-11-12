import type { Post } from './posts';
import { readComments } from './lesswrong-reader.mjs';

/** A LessWrong comment on a post's LessWrong copy, pulled in at build time. */
export interface LessWrongComment {
  author: string;
  /** Link to the comment on LessWrong. */
  url: string;
  postedAt: Date;
  karma: number;
  /** The comment body as LessWrong renders it. */
  html: string;
  /** Id of the comment this one replies to; undefined for a top-level comment. */
  parentId?: string;
  id: string;
}

/** A remote outage fails the build, leaving the previously deployed page intact. */
export async function getLessWrongComments(post: Post): Promise<LessWrongComment[]> {
  const url = post.data.syndication.lesswrong;
  return url ? readComments(url) : [];
}
