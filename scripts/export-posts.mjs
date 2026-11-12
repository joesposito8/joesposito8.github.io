import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument, isMap } from 'yaml';
import { slug } from 'github-slugger';

/** Export source metadata and body without building or fetching remote content. */
export async function exportPosts(root = 'src/content/posts') {
  const posts = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!entry.isFile() || !file.endsWith('.md')) continue;
      const text = await readFile(file, 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
      if (!match) throw new Error(`${file}: missing front matter`);
      const doc = parseDocument(match[1]);
      if (doc.errors.length || !isMap(doc.contents)) throw new Error(`${file}: invalid YAML mapping`);
      const data = doc.toJS();
      if (typeof data.title !== 'string' || !['essay', 'project', 'note'].includes(data.type)
          || !data.date || Number.isNaN(Date.parse(data.date))) throw new Error(`${file}: invalid post metadata`);
      const relative = path.relative(root, file).replaceAll(path.sep, '/');
      const id = data.slug ?? relative.replace(/\.md$/, '').split('/').map(s => slug(s)).join('/').replace(/\/index$/, '');
      if (typeof id !== 'string' || !id || id.startsWith('/') || id.includes('..')) throw new Error(`${file}: invalid slug`);
      posts.push({ ...data, id, source: file, url: `https://joesposito.com/posts/${id}/`,
        syndication: data.syndication ?? {}, body: text.slice(match[0].length) });
    }
  }
  await walk(root);
  if (new Set(posts.map(p => p.id)).size !== posts.length) throw new Error('Duplicate post IDs');
  return posts.sort((a, b) => a.id.localeCompare(b.id));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await exportPosts(process.argv[2]), null, 2));
}
