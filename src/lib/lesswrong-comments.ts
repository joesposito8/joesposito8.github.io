import type { Post } from './posts';

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

/**
 * The comments to show under a post. The build-time fetch from LessWrong is not wired yet,
 * and DESIGN.md has no comment component, so this returns none and nothing renders.
 */
export async function getLessWrongComments(_post: Post): Promise<LessWrongComment[]> {
  return [];
}
