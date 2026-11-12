import sanitizeHtml from 'sanitize-html';

export function cleanComment(html) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 's', 'blockquote', 'ul', 'ol', 'li',
      'pre', 'code', 'a', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub'],
    allowedAttributes: { a: ['href', 'title', 'rel'] },
    allowedSchemes: ['https', 'http'],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer' }) },
  });
}

let previousRequest = 0;
let queue = Promise.resolve();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(query, fetcher) {
  // Static paths can build concurrently; serialize requests as well as paging them.
  const job = queue.then(async () => {
    await sleep(Math.max(0, previousRequest + 3000 - Date.now()));
    previousRequest = Date.now();
    const response = await fetcher('https://www.lesswrong.com/graphql', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'SiteCommentReader/1.0' },
      body: JSON.stringify({ query }), signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`LessWrong HTTP ${response.status}`);
    const body = await response.json();
    if (body.errors || !body.data) throw new Error('LessWrong GraphQL error');
    return body.data;
  });
  queue = job.catch(() => {});
  return job;
}

export async function readComments(url, fetcher = fetch) {
  const match = /^https:\/\/(?:www\.)?lesswrong.com\/posts\/([A-Za-z0-9]+)(?:\/|$)/.exec(url);
  if (!match) throw new Error('Invalid LessWrong post URL');
  const comments = new Map();
  let offset = 0;
  while (true) {
    const data = await request(`{comments(input:{terms:{view:"postCommentsTop",postId:${JSON.stringify(match[1])},limit:100,offset:${offset}}}){results{_id postedAt baseScore parentCommentId deleted user{displayName} contents{html}}}}`, fetcher);
    const rows = data.comments?.results;
    if (!Array.isArray(rows)) throw new Error('Invalid LessWrong comments response');
    let fresh = 0;
    for (const row of rows) {
      if (comments.has(row._id)) continue;
      if (!row._id || !row.postedAt || Number.isNaN(Date.parse(row.postedAt))) throw new Error('Invalid comment identity/date');
      fresh++;
      comments.set(row._id, { id: row._id, parentId: row.parentCommentId ?? undefined,
        author: row.user?.displayName ?? 'Deleted user', url: `${url.split('#')[0]}#${row._id}`,
        postedAt: new Date(row.postedAt), karma: row.baseScore ?? 0,
        html: row.deleted ? '<p>[Deleted comment]</p>' : cleanComment(row.contents?.html ?? '') });
    }
    if (rows.length < 100) break;
    if (!fresh) throw new Error('LessWrong pagination made no progress');
    offset += rows.length;
  }
  return [...comments.values()];
}

/** A parent-first flat traversal with capped visual indentation, safe for cycles/orphans. */
export function threadComments(comments) {
  const children = new Map();
  const ids = new Set(comments.map(c => c.id));
  for (const c of comments) {
    const parent = ids.has(c.parentId) && c.parentId !== c.id ? c.parentId : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(c);
  }
  const output = [], visited = new Set();
  function visit(c, depth) {
    if (visited.has(c.id)) return;
    visited.add(c.id);
    output.push({ ...c, depth: Math.min(depth, 4) });
    for (const child of children.get(c.id) ?? []) visit(child, depth + 1);
  }
  for (const c of children.get(null) ?? []) visit(c, 0);
  for (const c of comments) visit(c, 0);
  return output;
}
