// Round 1 offered A Log, B Plain and C Mono-meta; Joey preferred C but found its warm
// paper and rust accent too Anthropic-like. Round 2 offered D Log line, E Timeline and
// F Graphite; Joey preferred E but wants it warmer and more inviting. Round 3 warmed E
// three ways (G Garden, H Sunroom, I Field notes); Joey picked H and asked for a better
// intro. Round 4 rebuilds H three ways from what Lil'Log, TurnTrout and joecarlsmith.com
// do well: a prose intro, one accent, a filterable and sortable list of everything, and
// a contents list on essays. H stays as the reference point.

interface Variation {
  name: string;
  spec: string;
  /** H keeps its round-3 greeting card; round 4 opens with a prose paragraph. */
  intro: 'card' | 'prose';
  /** Round 4 lists titles with type, topic and sort controls; H shows short posts in full. */
  filters: boolean;
  /** Dates hang in a gutter on a vertical rule. K keeps dates inside the column instead. */
  timeline: boolean;
  /** Whether an essay's contents list starts expanded (margin rail) or folded (box above the text). */
  toc?: 'open' | 'closed';
}

export const VARIATIONS = {
  h: { name: 'Sunroom (round 3)', spec: 'Round 3 reference: white + navy ink, sunflower highlighter, system sans', intro: 'card', filters: false, timeline: true },
  j: {
    name: 'Reading room',
    spec: 'Source Serif 4 to read, Instrument Sans for labels; text-tab filters; contents in the left margin',
    intro: 'prose',
    filters: true,
    timeline: true,
    toc: 'open',
  },
  k: {
    name: 'Book',
    spec: 'Alegreya at 20px with old-style figures; nav and filters in the margins; ruled list',
    intro: 'prose',
    filters: true,
    timeline: false,
    toc: 'open',
  },
  l: {
    name: 'Notebook',
    spec: 'Bricolage Grotesque + Figtree, JetBrains Mono metadata; chip filters; folding contents box',
    intro: 'prose',
    filters: true,
    timeline: true,
    toc: 'closed',
  },
} as const satisfies Record<string, Variation>;

export type VariationId = keyof typeof VARIATIONS;

export const SHOWCASE_ESSAY = 'lorem-ipsum-dolor-sit-amet';
