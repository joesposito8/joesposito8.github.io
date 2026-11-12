# personal-site

## Current Initiative
The "Book" theme is built into the launchable site (feeds, checks, deploy workflow) on GitHub
Pages at joesposito.com. README.md covers building, checks, deploy and the post schema; see
DESIGN.md for every token, component and page.

## Key Files
- README.md: build, front matter, config switches, checks, deploy
- DESIGN.md: the design record and its history
- src/styles/tokens.css, src/styles/global.css: theme styles
- src/layouts/Base.astro, src/components/: layout and components
- src/config.ts: site name, nav, profile links, SUBSTACK_URL, SUBSTACK_SIGNUP
- src/content.config.ts: the post schema
- src/lib/feed.ts, src/pages/feeds/: RSS feeds; /feeds/lesswrong.xml is registered with LessWrong, so keep its path and guids
- scripts/check-dist.mjs, scripts/check-feeds.mjs, lychee.toml: checks run in CI
- .github/workflows/site.yml: build, check, deploy
- scripts/screenshots.mjs: page screenshots into design/screenshots/

## Gotchas
- Astro 7 needs Node >= 22.23.4.
- Markdown runs through `unified()` from @astrojs/markdown-remark: the default processor cannot run remark-math or rehype-katex.
- `astro preview` daemonises; manage it with `npx astro preview status|stop|logs`.
- The social card renderer loads static Alegreya files from @fontsource/alegreya, not the variable package.
- `SAMPLE_POSTS=<dir>` swaps the posts folder; a deploy build must never set it. `npm run check` fails on any lorem ipsum in dist/.
- The installed gh (2.4.0) has no `search` command; use `gh api search/...`.
- Fontsource's CSS says `font-display: swap`; a Vite plugin in `astro.config.mjs` rewrites it to `block`. Font preloads (`?url` imports) must name the same files the CSS uses, or the browser downloads both.
