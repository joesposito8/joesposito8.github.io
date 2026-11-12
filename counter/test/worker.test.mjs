// Runs the Worker in local workerd against a fresh, migrated D1 and a local sitemap server.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unstable_startWorker } from 'wrangler';

const CONFIG = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url));
const WRANGLER = fileURLToPath(new URL('../node_modules/.bin/wrangler', import.meta.url));
const DB = 'joesposito-views';
const SITE = 'https://joesposito.com';
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const READ_KEY = 'test-read-key';

/** A sitemap server whose page list a test can change, counting the fetches it serves. */
function startSitemap(paths) {
  const sitemap = { paths: new Set(paths), fetches: 0 };
  sitemap.server = createServer((req, res) => {
    sitemap.fetches += 1;
    const urls = [...sitemap.paths].map((p) => `<url><loc>${SITE}${p}</loc></url>`).join('');
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset>${urls}</urlset>`);
  });
  return new Promise((resolve) => sitemap.server.listen(0, '127.0.0.1', () => resolve(sitemap)));
}

async function startCounter({ refreshSeconds, paths }) {
  const sitemap = await startSitemap(paths);
  const dir = mkdtempSync(join(tmpdir(), 'views-'));
  execFileSync(WRANGLER, ['d1', 'migrations', 'apply', DB, '--local', '--persist-to', dir, '--config', CONFIG], { stdio: 'ignore' });
  const worker = await unstable_startWorker({
    config: CONFIG,
    bindings: {
      READ_KEY: { type: 'secret_text', value: READ_KEY },
      SITEMAP_URL: { type: 'plain_text', value: `http://127.0.0.1:${sitemap.server.address().port}/sitemap-0.xml` },
      SITEMAP_REFRESH_SECONDS: { type: 'plain_text', value: String(refreshSeconds) },
    },
    dev: { server: { port: 0 }, inspector: false, persist: dir },
  });
  const responses = [];
  const request = async (path, init = {}) => {
    const res = await worker.fetch(`https://pv.joesposito.com${path}`, init);
    responses.push(res);
    return res;
  };
  return {
    sitemap,
    responses,
    request,
    hit: (body, headers = {}) =>
      request('/p', {
        method: 'POST',
        headers: { Origin: SITE, 'User-Agent': BROWSER, 'Content-Type': 'text/plain;charset=UTF-8', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }),
    refs: async (since = 0) => (await request(`/refs?since=${since}`, { headers: { Authorization: `Bearer ${READ_KEY}` } })).json(),
    sql: (command) =>
      JSON.parse(
        execFileSync(WRANGLER, ['d1', 'execute', DB, '--local', '--persist-to', dir, '--config', CONFIG, '--json', '--command', command], {
          encoding: 'utf8',
        }),
      ).at(-1).results,
    stop: async () => {
      await worker.dispose();
      sitemap.server.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

describe('counter', () => {
  let c;
  before(async () => {
    c = await startCounter({ refreshSeconds: 0, paths: ['/', '/posts/a/', '/posts/b/', '/posts/c/', '/posts/d/'] });
  });
  after(() => c.stop());

  test('the views table holds only a time, a path and a referrer host', () => {
    assert.deepEqual(
      c.sql('PRAGMA table_info(views)').map((col) => col.name),
      ['ts', 'path', 'ref'],
    );
  });

  test('a view adds a row, and a reload adds another', async () => {
    assert.equal((await c.hit({ p: '/posts/a/', r: '' })).status, 204);
    assert.equal((await c.refs()).views['/posts/a/'], 1);
    await c.hit({ p: '/posts/a/', r: '' });
    assert.equal((await c.refs()).views['/posts/a/'], 2);
  });

  test('paths count under the site URL, without query, fragment or a missing slash', async () => {
    for (const p of ['/posts/b', '/posts/b/?utm_source=x', '/posts/b/#heading']) await c.hit({ p });
    assert.equal((await c.refs()).views['/posts/b/'], 3);
  });

  test('the referrer is stored as its host; a same-site or malformed one as none', async () => {
    await c.hit({ p: '/posts/c/', r: 'joesposito8.substack.com' });
    await c.hit({ p: '/posts/c/', r: 'joesposito.com' });
    await c.hit({ p: '/posts/c/', r: 'not a host!' });
    const { views, refs } = await c.refs();
    assert.equal(views['/posts/c/'], 3);
    assert.deepEqual(refs['/posts/c/'], { 'joesposito8.substack.com': 1 });
  });

  test('nothing is stored for an unknown page, a bot, another site or a bad body', async () => {
    assert.equal((await c.hit({ p: '/posts/not-a-post/' })).status, 204);
    assert.equal((await c.hit({ p: '/wp-login.php' })).status, 204);
    assert.equal((await c.hit({ p: '/posts/d/' }, { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).status, 204);
    assert.equal((await c.hit({ p: '/posts/d/' }, { 'User-Agent': 'Mozilla/5.0 HeadlessChrome/140.0' })).status, 204);
    assert.equal((await c.hit({ p: '/posts/d/' }, { Origin: 'https://example.com' })).status, 403);
    assert.equal((await c.request('/p', { method: 'POST', headers: { 'User-Agent': BROWSER }, body: '{"p":"/posts/d/"}' })).status, 403);
    assert.equal((await c.hit('not json')).status, 400);
    assert.equal((await c.hit({ r: 'x.com' })).status, 400);
    assert.equal((await c.hit({ p: 'posts/d/' })).status, 400);
    assert.equal((await c.hit({ p: `/posts/d/?${'x'.repeat(1100)}` })).status, 400);
    const { views } = await c.refs();
    assert.equal(views['/posts/d/'], undefined);
    assert.equal(views['/posts/not-a-post/'], undefined);
  });

  test('a post added to the sitemap counts from its first view', async () => {
    c.sitemap.paths.add('/posts/new/');
    await c.hit({ p: '/posts/new/' });
    assert.equal((await c.refs()).views['/posts/new/'], 1);
  });

  test('/tally serves all-time views per page to any origin, and reading it counts nothing', async () => {
    const before = await c.refs();
    const res = await c.request('/tally');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.equal(res.headers.get('Cache-Control'), 'public, max-age=300');
    assert.match(res.headers.get('Content-Type'), /^application\/json/);
    assert.deepEqual(await res.json(), { '/posts/a/': 2, '/posts/b/': 3, '/posts/c/': 3, '/posts/new/': 1 });
    assert.deepEqual(await c.refs(), before);
  });

  test('deleting views lowers their totals', () => {
    c.sql("DELETE FROM views WHERE rowid = (SELECT MIN(rowid) FROM views WHERE path = '/posts/a/')");
    c.sql("DELETE FROM views WHERE path = '/posts/new/'");
    assert.deepEqual(c.sql('SELECT path, n FROM totals ORDER BY path'), [
      { path: '/posts/a/', n: 1 },
      { path: '/posts/b/', n: 3 },
      { path: '/posts/c/', n: 3 },
    ]);
  });

  test('/refs needs the read key and a valid since', async () => {
    assert.equal((await c.request('/refs?since=0')).status, 401);
    assert.equal((await c.request('/refs?since=0', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
    const auth = { headers: { Authorization: `Bearer ${READ_KEY}` } };
    assert.equal((await c.request('/refs', auth)).status, 400);
    assert.equal((await c.request('/refs?since=yesterday', auth)).status, 400);
    const res = await c.request('/refs?since=0', auth);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
  });

  test('/refs counts only views since the given time', async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    assert.deepEqual(await c.refs(future), { since: future, views: {}, refs: {} });
    const iso = new Date(Date.now() - 3600_000).toISOString();
    assert.equal((await c.refs(encodeURIComponent(iso))).views['/posts/b/'], 3);
  });

  test('other paths and methods are refused', async () => {
    assert.equal((await c.request('/')).status, 404);
    assert.equal((await c.request('/p')).status, 405);
    assert.equal((await c.request('/tally', { method: 'POST' })).status, 405);
  });

  test('no response sets a cookie', () => {
    assert.ok(c.responses.length > 20);
    for (const res of c.responses) assert.equal(res.headers.get('Set-Cookie'), null);
  });
});

describe('sitemap refresh', () => {
  let c;
  before(async () => {
    c = await startCounter({ refreshSeconds: 3600, paths: ['/posts/a/'] });
  });
  after(() => c.stop());

  test('an unknown path refetches the sitemap at most once per refresh interval', async () => {
    await c.hit({ p: '/posts/a/' });
    assert.equal(c.sitemap.fetches, 1);
    c.sitemap.paths.add('/posts/new/');
    await c.hit({ p: '/posts/new/' });
    await c.hit({ p: '/posts/other/' });
    await c.hit({ p: '/about/' });
    assert.equal(c.sitemap.fetches, 1);
    assert.deepEqual((await c.refs()).views, { '/posts/a/': 1 });
  });
});
