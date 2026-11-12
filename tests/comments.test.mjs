import test from 'node:test';
import assert from 'node:assert/strict';
import { readComments, cleanComment, threadComments } from '../src/lib/lesswrong-reader.mjs';
import { exportPosts } from '../scripts/export-posts.mjs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

test('remote HTML retains prose and strips active content and unsafe URLs', () => {
  const html = cleanComment('<p onclick="bad()">Full <strong>text</strong><script>bad()</script><img src=x onerror=bad()><a href="javascript:bad()">bad</a><a href="https://example.com">source</a><iframe src="https://example.com"></iframe></p>');
  assert.match(html, /Full <strong>text<\/strong>/);
  assert.doesNotMatch(html, /script|onclick|onerror|iframe|javascript|<img/);
  assert.match(html, /href="https:\/\/example.com"/);
});

test('comments paginate, preserve parent links and fail on remote errors', async () => {
  const originalNow = Date.now;
  let clock = originalNow();
  Date.now = () => clock += 4000;
  try {
    const queries = [];
    const fetcher = async (_url, options) => {
      const query = JSON.parse(options.body).query;
      queries.push(query);
      const offset = Number(/offset:(\d+)/.exec(query)[1]);
      const count = offset === 0 ? 100 : 1;
      return { ok: true, json: async () => ({ data: { comments: { results: Array.from({ length: count }, (_, i) => ({
        _id: String(offset + i), postedAt: '2026-11-01T00:00:00Z', baseScore: 2,
        parentCommentId: offset + i ? '0' : null, contents: { html: '<p>Complete comment</p>' }, user: { displayName: 'Reader' },
      })) } } }) };
    };
    const comments = await readComments('https://www.lesswrong.com/posts/example/title', fetcher);
    assert.equal(comments.length, 101);
    assert.equal(comments[100].parentId, '0');
    assert.match(queries[1], /offset:100/);
    await assert.rejects(readComments('https://www.lesswrong.com/posts/example/title', async () => ({ ok: false, status: 429 })), /429/);
    await assert.rejects(readComments('https://evil.example/posts/example/title', fetcher), /Invalid/);
  } finally { Date.now = originalNow; }
});

test('thread ordering handles children before parents, orphans and cycles once', () => {
  const rows = [{ id: 'child', parentId: 'parent' }, { id: 'parent' }, { id: 'orphan', parentId: 'missing' },
    { id: 'a', parentId: 'b' }, { id: 'b', parentId: 'a' }];
  const result = threadComments(rows);
  assert.equal(result.length, rows.length);
  assert.deepEqual(result.slice(0, 2).map(c => [c.id, c.depth]), [['parent', 0], ['child', 1]]);
  assert.equal(new Set(result.map(c => c.id)).size, rows.length);
});

test('manifest preserves multiline YAML, full body and nested Astro slug', async () => {
  await mkdir('tmp', { recursive: true });
  const folder = await mkdtemp('tmp/manifest-');
  try {
    await mkdir(path.join(folder, 'Nested'));
    await writeFile(path.join(folder, 'Nested', 'My Post.md'), '---\ntype: note\ntitle: "A: title"\ndate: 2026-11-12\nsubtitle: |\n  Line one\n  Line two\nsyndication:\n  lesswrong: https://www.lesswrong.com/posts/example/title\n---\nFull body\n');
    const posts = await exportPosts(folder);
    assert.equal(posts[0].id, 'nested/my-post');
    assert.equal(posts[0].body, 'Full body\n');
    assert.equal(posts[0].subtitle, 'Line one\nLine two\n');
    await writeFile(path.join(folder, 'bad.md'), '---\ntitle: [\n---\n');
    await assert.rejects(exportPosts(folder), /invalid YAML/);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
