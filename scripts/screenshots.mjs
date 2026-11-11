// Captures every page type at phone and desktop widths, in light and dark, from a running
// `astro preview`, into design/screenshots/. Also copies one social card beside them.
//
// The pages below are the lorem sample posts, so build with them:
//
//   SAMPLE_POSTS=design/sample-posts npm run build && npm run preview     # in one shell
//   npm run screenshots                  # in another; PREVIEW_URL overrides the address
//
// Uses the system Chrome (channel 'chrome'), so no Playwright browser download is needed.
import { copyFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:7578';
const OUT = 'design/screenshots';

const PAGES = {
  home: '/',
  essay: '/posts/lorem-ipsum-dolor-sit-amet/',
  note: '/posts/note-ut-enim-ad-minim/',
  til: '/posts/til-duis-aute-irure/',
  link: '/posts/link-excepteur-sint-occaecat/',
  about: '/about/',
  404: '/this-page-does-not-exist/',
};
const WIDTHS = [375, 1280];
const THEMES = ['light', 'dark'];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, path] of Object.entries(PAGES)) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${OUT}/${name}-${width}-${theme}.png`, fullPage: true });
      await page.close();
    }
  }
}
await browser.close();
await copyFile('dist/og/lorem-ipsum-dolor-sit-amet.png', `${OUT}/social-card.png`);
console.log(`Saved ${Object.keys(PAGES).length * WIDTHS.length * THEMES.length} screenshots and the social card to ${OUT}/`);
