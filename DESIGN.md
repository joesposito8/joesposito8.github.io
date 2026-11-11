# Design: "Book"

The theme for joesposito.com: an engineer's log set like a book. One serif, navy ink on
near-white paper, one sunflower accent, the site's name and pages in the left margin, and a
list of everything written that readers can filter and sort.

Screenshots of every page type at 375px and 1280px, light and dark, are in
`design/screenshots/` (regenerate with `npm run screenshots`, see below). The sample posts
in `design/sample-posts/` are placeholder lorem ipsum and build only when `SAMPLE_POSTS`
names their folder; the live site shows only real posts.

## Tokens (`src/styles/tokens.css`)

### Colour

Colours are defined once with `light-dark()`. The theme follows the reader's system setting;
there is no theme switch.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#fcfcfe` | `#10172a` | Page |
| `--fg` | `#1b2436` | `#e9edf5` | Text, headings |
| `--muted` | `#5a6477` | `#9ba6bb` | Dates, labels, secondary text |
| `--rule` | `#e2e6ee` | `#28324a` | Hairlines, borders |
| `--accent` | `#2343a0` | `#a3b8ff` | Links |
| `--sun` | `#f2b600` | `#f5c84c` | The one accent: essay marks, avatar, link underlines on hover, selected filters, end mark |
| `--hl` | `#ffd84d` | `rgb(245 200 76 / 0.35)` | Text selection, intro link hover |
| `--code-bg` | `#f4f6fa` | `#19223a` | Code blocks, contents box, signup box, eval card |
| `--on-sun` | `#1b2436` | `#1b2436` | Text on a sunflower fill |

Rule: no colour per post type. Types are told apart by shape (see Post-type marks).

### Type

| Token | Value |
|---|---|
| `--font-text` | Alegreya (variable, roman and italic), falling back to Iowan Old Style, Palatino, Georgia, serif |
| `--font-sc` | Alegreya SC 500 for small capitals; lowercase text in it reads as small caps (`.sc` class) |
| `--font-mono` | JetBrains Mono (variable), falling back to ui-monospace, SF Mono, Menlo, Consolas |
| `--fs` | 20px root size |
| `--lh` | 1.55 |

Fonts are self-hosted from `@fontsource` packages and bundled by Vite: no request leaves the
site, and a browser downloads only the faces a page uses. Body text uses old-style figures
(`font-variant-numeric: oldstyle-nums`); tables, counts and eval numbers use lining tabular
figures.

Sizes (in rem of the 20px root): h1 `clamp(1.8rem, 1.2rem + 2.4vw, 2.3rem)`, h2 1.55rem,
h3 1.2rem, headings weight 500. Intro lede 1.15rem. List titles 1.12rem (essays 1.32rem).
Meta 0.85–0.92rem. Inline code 0.8em; code blocks 0.72rem (14.4px).

### Layout

| Token | Value |
|---|---|
| `--measure` | 700px text column |
| `--rail` | 10.5rem margin rail |
| `--rail-gap` | 1.5rem |
| `--space` | 1.5rem paragraph spacing |
| `--radius` | 6px |

- Below 80rem (1280px): one column, `--measure` wide plus 1rem gutters. The header is a top
  bar: avatar and name, then the nav.
- From 80rem: the body is a five-column grid (`1fr | rail | measure | rail | 1fr`). The
  header sits in the left rail, right-aligned and sticky: a 4.25rem avatar, the name, the
  nav. Pages that need it put a sticky panel in the right rail (`.with-rail`
  and `.rail`): the writing list's controls, an essay's contents.
- Home page, from 80rem: the intro and the margin's avatar, name and nav form
  one top band, the two centred on each other, and "Writing" with its controls starts below
  the band. The
  header holds only that band here, so it scrolls away with it; the controls stay sticky.
  The first year divider sits 0.4rem under the "Writing" heading.

## Components

| Component | File | Notes |
|---|---|---|
| Base layout | `src/layouts/Base.astro` | Head (title, description, canonical, Open Graph and Twitter card tags, feed discovery links, `rel="me"` profile links, a `head` slot), header, footer with profile links |
| Intro | `src/components/Intro.astro` | Prose paragraph in Joey's voice. The first words are set in small capitals (`.lede strong`). Links are underlined in sunflower; topic links open the list pre-filtered (`/?tag=…#writing`). No drop cap. |
| PostFilters | `src/components/PostFilters.astro` | Radio groups Show (All/Essays/Projects/Notes with counts), Topic (tags by frequency), Sort (Newest/Most popular), plus a live count. Hidden until its script runs. Counts follow the chosen topic; options with zero matches fade. State is mirrored in the query string, so filtered views are linkable. Sort appears only when `VIEWS_URL` is set; "Most popular" fetches the view counts once, and if they fail to load the list falls back to newest and says so. |
| PostList | `src/components/PostList.astro` | Year dividers (centred year between hairlines) and ruled entries: date column (date, type mark) and title column (title link, a project's "→ host" repo link in mono, essay subtitle in italic, topic links in mono). Sorted by views, the dividers disappear and each date shows its year. |
| Article | `src/components/Article.astro` | Post header (title, subtitle, meta line, epistemic status), contents, body, end mark, discussion links, citation, signup. |
| Contents | `src/components/Contents.astro` | Essays with two or more headings. Box above the text on narrow screens; sticky right rail on wide ones. |
| EndMark | `src/components/EndMark.astro` | Small sun between two short rules, closing an essay. |
| DiscussLinks | `src/components/DiscussLinks.astro` | "Discuss on LessWrong · X", centred italic, from the post's syndication URLs. |
| CiteBlock | `src/components/CiteBlock.astro` | Folded "Cite this essay (BibTeX)" built from front matter. |
| SubstackSignup | `src/components/SubstackSignup.astro` | Boxed email form at the end of essays, behind `SUBSTACK_SIGNUP` in `src/config.ts`. It submits to the Substack publication (`SUBSTACK_URL`) rather than embedding Substack's iframe, so it keeps the site's look. |
| EvalCard | `src/components/EvalCard.astro` | Kind label, title, summary, a row of stats, links. Used by the evals page, unpublished for now. |

### Post-type marks

One accent colour, so each type has a shape, shown before its small-caps label:
essay a sunflower disc, project an ink diamond, note an ink ring.

## Pages

| Route | Content |
|---|---|
| `/` | Intro, then "Writing": filters and the full list. With no posts yet, the Writing section is left out and the page is the intro alone. |
| `/posts/<slug>/` | Essay, project or note. A project's meta line links its repo or demo. KaTeX's stylesheet loads only when the post contains math. |
| `/about/` | Prose page with an "Elsewhere" list of profiles |
| `/evals/` | Intro line and eval cards. Unpublished until its text is written: the page is `src/pages/_evals.astro` and Evals is out of the nav. The `evals-*` screenshots show its design. |
| `/404` | "Page not found" with a link to the list |
| `/og/<slug>.png`, `/og/index.png` | 1200×630 social cards: paper background, sunflower left edge, avatar mark, title in Alegreya, "Joey Esposito · joesposito.com" |

Client JavaScript: the filter script on `/`, which requests the view counts only when a
reader picks "Most popular". Nothing else.

## Design history

1. Round 1 offered three engineer's-log takes (A Log, B Plain, C Mono-meta). Joey preferred
   C but found its warm paper and rust accent too close to Anthropic's look.
2. Round 2 (D Log line, E Timeline, F Graphite): Joey preferred E's timeline but wanted it
   warmer and more inviting.
3. Round 3 warmed E three ways (G Garden, H Sunroom, I Field notes). Joey picked H (white,
   navy, sunflower) and asked for a better intro.
4. After studying Lil'Log, TurnTrout and joecarlsmith.com, Joey asked for no "Start here"
   section, a list of everything that can be filtered and sorted, and those sites' lessons:
   a prose intro, one accent, contents on essays, an end mark. Round 4 offered J Reading room,
   K Book and L Notebook. Joey picked K, Book.
5. Joey asked to drop the drop cap and to clean the design up. Book became the theme at the
   real routes, with the archive, about, evals and 404 pages, the theme button and social
   cards.
6. For launch, the evals page and its nav item wait for their text, and the home page shows
   only the intro until the first post exists. Joey agreed to both.
7. Joey found the wide home page's spacing loose: "Writing" began beside the margin's nav.
   The intro and the margin's name and pages now form one band, the writing list and its
   controls start below it, and the gap between the "Writing" heading and the first year
   divider shrank from 2.2rem to 1rem. The 375px layout is unchanged.
8. Joey dropped the theme button: the site follows the reader's system setting.
9. Joey dropped the archive page: the home list already shows every post by year, with
   filters. The nav is Writing and About.
10. The home band's two sides differ in height and line spacing, so only one edge can match.
    Joey compared top, bottom, centred and both-edges alignment on the preview and chose
    centred.
11. Joey set the post types to Essays, Projects and Notes (TIL and Link dropped; a project is
    a write-up with an optional repo or demo link, marked with the diamond TILs had) and the
    sort to Newest and Most popular, fetched from the view counter in the browser.

## Notes

- Screenshots are taken on a Linux box whose only system fonts are Liberation. The theme's
  own fonts load from the site, so pages look as they will elsewhere, except for glyphs
  Alegreya lacks: the footnote back-link arrow (↩) shows as a missing-glyph box there, and
  renders from the system font on macOS, Windows and phones.
- `npm run screenshots` needs `SAMPLE_POSTS=design/sample-posts npm run build` and
  `npm run preview` running first. It uses
  the system Chrome and writes `design/screenshots/<page>-<width>-<theme>.png` plus
  `social-card.png`. Set `PREVIEW_URL` to point it at another address.
