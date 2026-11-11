// Compiles the raw facts for the /evals cards from GitHub into src/data/evals-facts.json:
// Joey's public repositories and his merged pull requests in public repositories. Only
// public items are read, because this repository is public.
//
//   npm run evals-facts      # needs an authenticated `gh`
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const USER = 'joesposito8';
const OUT = 'src/data/evals-facts.json';

const gh = (path) => JSON.parse(execFileSync('gh', ['api', '-X', 'GET', path], { encoding: 'utf8' }));

const repos = gh(`users/${USER}/repos?type=owner&per_page=100&sort=pushed`)
  .filter((r) => !r.private)
  .map((r) => ({
    name: r.name,
    url: r.html_url,
    description: r.description,
    language: r.language,
    fork: r.fork,
    stars: r.stargazers_count,
    pushedAt: r.pushed_at,
  }));

const query = encodeURIComponent(`author:${USER} is:pr is:merged is:public`);
const prs = gh(`search/issues?q=${query}&per_page=100&sort=updated`).items.map((pr) => ({
  repo: pr.repository_url.replace('https://api.github.com/repos/', ''),
  title: pr.title,
  url: pr.html_url,
  mergedAt: pr.pull_request.merged_at,
}));

await mkdir('src/data', { recursive: true });
await writeFile(OUT, JSON.stringify({ compiledAt: new Date().toISOString(), repos, mergedPullRequests: prs }, null, 2) + '\n');
console.log(`Wrote ${repos.length} repositories and ${prs.length} merged pull requests to ${OUT}`);
