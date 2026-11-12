// The site's view counter. Pages POST {p: path, r: referrer host} to /p; /tally serves
// all-time views per page to anyone; /refs serves views and referrers since a time to the
// holder of READ_KEY. Nothing that identifies a visitor is stored or logged.

const MAX_BODY = 1024;
const SITEMAP_TTL = 600;
const TALLY_TTL = 300;
// Crawlers that run JavaScript would otherwise count. The user agent is read, never stored.
const BOT = /bot|crawl|spider|headless|lighthouse/i;
const HOST = /^[a-z0-9.-]{1,253}$/;

const empty = (status, headers = {}) => new Response(null, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

const json = (body, headers) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', ...headers } });

/** The page path as the site's URLs spell it: no query or fragment, a trailing slash on pages. */
function normalisePath(raw) {
  const { pathname } = new URL(raw, 'https://site.invalid');
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  return pathname.endsWith('/') || last.includes('.') ? pathname : `${pathname}/`;
}

function referrerHost(raw, siteHost) {
  const host = typeof raw === 'string' ? raw.toLowerCase() : '';
  return HOST.test(host) && host !== siteHost ? host : null;
}

const sitemapPaths = (xml) => new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));

/**
 * Whether the path is a page of the site. The sitemap is cached at the edge; a /posts/ path
 * it lacks refetches it, at most once per SITEMAP_REFRESH_SECONDS, so a new post counts from
 * its first views without letting arbitrary paths force a fetch on every request.
 */
async function isPage(path, env) {
  const key = new Request(env.SITEMAP_URL);
  const cached = await caches.default.match(key);
  let pages = cached && sitemapPaths(await cached.text());
  if (pages?.has(path)) return true;
  const age = cached ? (Date.now() - Number(cached.headers.get('X-Fetched-At'))) / 1000 : Infinity;
  if (pages && (!path.startsWith('/posts/') || age < Number(env.SITEMAP_REFRESH_SECONDS))) return false;

  const res = await fetch(env.SITEMAP_URL);
  if (!res.ok) return false;
  const xml = await res.text();
  await caches.default.put(
    key,
    new Response(xml, { headers: { 'Cache-Control': `max-age=${SITEMAP_TTL}`, 'X-Fetched-At': String(Date.now()) } }),
  );
  pages = sitemapPaths(xml);
  return pages.has(path);
}

async function recordView(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin || !env.ALLOWED_ORIGINS.split(/\s+/).includes(origin)) return empty(403);
  if (BOT.test(request.headers.get('User-Agent') ?? '')) return empty(204);

  const text = await request.text();
  let body;
  try {
    body = text.length <= MAX_BODY ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (typeof body?.p !== 'string' || !body.p.startsWith('/')) return empty(400);

  const path = normalisePath(body.p);
  if (!(await isPage(path, env))) return empty(204);
  const ref = referrerHost(body.r, new URL(origin).hostname);
  await env.DB.prepare('INSERT INTO views (ts, path, ref) VALUES (?1, ?2, ?3)')
    .bind(Math.floor(Date.now() / 1000), path, ref)
    .run();
  return empty(204);
}

async function tally(request, env, ctx) {
  const key = new Request(new URL('/tally', request.url));
  const cached = await caches.default.match(key);
  if (cached) return cached;
  const { results } = await env.DB.prepare('SELECT path, n FROM totals').all();
  const res = json(Object.fromEntries(results.map((r) => [r.path, r.n])), {
    'Cache-Control': `public, max-age=${TALLY_TTL}`,
    // Public counts, fetched without credentials, so any origin may read them.
    'Access-Control-Allow-Origin': '*',
  });
  ctx.waitUntil(caches.default.put(key, res.clone()));
  return res;
}

/** Compares digests, so the comparison takes the same time whatever the given key's length. */
async function authorised(request, env) {
  if (!env.READ_KEY) return false;
  const digest = (s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const [given, expected] = await Promise.all([digest(request.headers.get('Authorization') ?? ''), digest(`Bearer ${env.READ_KEY}`)]);
  return crypto.subtle.timingSafeEqual(given, expected);
}

function parseSince(raw) {
  if (raw === null || raw === '') return NaN;
  return /^\d+$/.test(raw) ? Number(raw) : Math.floor(Date.parse(raw) / 1000);
}

async function refs(request, env) {
  if (!(await authorised(request, env))) return empty(401);
  const since = parseSince(new URL(request.url).searchParams.get('since'));
  if (!Number.isFinite(since)) return empty(400);

  const [views, referrers] = await env.DB.batch([
    env.DB.prepare('SELECT path, COUNT(*) AS n FROM views WHERE ts >= ?1 GROUP BY path').bind(since),
    env.DB.prepare('SELECT path, ref, COUNT(*) AS n FROM views WHERE ts >= ?1 AND ref IS NOT NULL GROUP BY path, ref').bind(since),
  ]);
  const byPath = {};
  for (const { path, ref, n } of referrers.results) (byPath[path] ??= {})[ref] = n;
  return json(
    { since, views: Object.fromEntries(views.results.map((r) => [r.path, r.n])), refs: byPath },
    { 'Cache-Control': 'no-store' },
  );
}

const ROUTES = { '/p': ['POST', recordView], '/tally': ['GET', tally], '/refs': ['GET', refs] };

export default {
  async fetch(request, env, ctx) {
    const route = ROUTES[new URL(request.url).pathname];
    if (!route) return empty(404);
    const [method, handler] = route;
    if (request.method !== method) return empty(405, { Allow: method });
    return handler(request, env, ctx);
  },
};
