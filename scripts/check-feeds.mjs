// Checks the built feeds in dist/feeds/:
// - every item has a guid equal to its link, an absolute joesposito.com URL, because
//   LessWrong's importer deduplicates on the guid and uses the link as the canonical URL;
// - every item carries its full HTML in content:encoded;
// - the W3C Feed Validation Service finds the feed valid. Its warnings are printed but do
//   not fail the check. --local skips this step and sends nothing off the machine.
//
//   npm run build && npm run check:feeds [-- --local]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const FEEDS = 'dist/feeds';
const ORIGIN = 'https://joesposito.com/';
const local = process.argv.includes('--local');

const problems = [];
const decode = (s) => s.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"');

for (const name of readdirSync(FEEDS).filter((f) => f.endsWith('.xml'))) {
  const xml = readFileSync(join(FEEDS, name), 'utf8');
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  for (const item of items) {
    const link = decode(item.match(/<link>([^<]*)<\/link>/)?.[1] ?? '');
    const guid = decode(item.match(/<guid[^>]*>([^<]*)<\/guid>/)?.[1] ?? '');
    if (!link.startsWith(ORIGIN)) problems.push(`${name}: item link ${JSON.stringify(link)} is not on ${ORIGIN}`);
    if (guid !== link) problems.push(`${name}: guid ${JSON.stringify(guid)} differs from link ${JSON.stringify(link)}`);
    if (!/<content:encoded>[\s\S]+<\/content:encoded>/.test(item)) problems.push(`${name}: ${link} has no content:encoded`);
  }

  let verdict = 'not sent to W3C (--local)';
  if (!local) {
    const response = await fetch('https://validator.w3.org/feed/check.cgi', {
      method: 'POST',
      body: new URLSearchParams({ rawdata: xml, output: 'soap12' }),
    });
    const soap = await response.text();
    const valid = soap.match(/<m:validity>([^<]*)<\/m:validity>/)?.[1];
    const errors = Number(soap.match(/<(?:m:)?errorcount>(\d+)/)?.[1] ?? 0);
    const warnings = [...new Set([...soap.matchAll(/<warning>[\s\S]*?<text>([^<]*)<\/text>/g)].map((m) => decode(m[1])))];
    if (valid !== 'true' || errors > 0) problems.push(`${name}: W3C validity ${valid ?? 'unknown'}, ${errors} errors (HTTP ${response.status})`);
    verdict = `W3C valid=${valid}, ${errors} errors${warnings.length ? `; warnings: ${warnings.join('; ')}` : ''}`;
    // The validator is a shared public service; space the requests out.
    await sleep(2000);
  }
  console.log(`${name}: ${items.length} items; ${verdict}`);
}

if (problems.length > 0) {
  console.error(problems.map((p) => `FAIL ${p}`).join('\n'));
  process.exit(1);
}
console.log('feed checks passed');
