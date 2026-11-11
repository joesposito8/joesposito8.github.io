# personal-site

## Current Initiative
Site theme ("Book") is designed; see DESIGN.md for every token, component and page.

## Key Files
- DESIGN.md: the design record and its history
- src/styles/tokens.css, src/styles/global.css: theme styles
- src/layouts/Base.astro, src/components/: layout and components
- src/config.ts: site name, nav, profile links, SUBSTACK_SIGNUP flag
- scripts/screenshots.mjs: page screenshots into design/screenshots/

## Gotchas
- Astro 7 needs Node >= 22.23.4.
- Markdown runs through `unified()` from @astrojs/markdown-remark: the default processor cannot run remark-math or rehype-katex.
- `astro preview` daemonises; manage it with `npx astro preview status|stop|logs`.
- The social card renderer loads static Alegreya files from @fontsource/alegreya, not the variable package.
