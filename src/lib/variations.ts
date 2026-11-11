// Round 1 offered A Log, B Plain and C Mono-meta; Joey preferred C but found its warm
// paper and rust accent too Anthropic-like. Round 2 offered D Log line, E Timeline and
// F Graphite; Joey preferred E but wants it warmer and more inviting. Round 3 keeps E's
// timeline and warms it three ways. E stays here as the reference point.
export type DateStyle = 'iso' | 'day-month';

export const VARIATIONS = {
  e: { name: 'Timeline (round 2)', spec: 'Cool slate, teal accent, ISO dates on a ruled timeline', dates: 'iso', intro: false },
  g: { name: 'Garden', spec: 'Sage-grey paper, teal + plum, humanist sans, greeting, year markers', dates: 'day-month', intro: true },
  h: { name: 'Sunroom', spec: 'White + navy ink, sunflower highlighter, essay cards, lamplit dark', dates: 'day-month', intro: true },
  i: { name: 'Field notes', spec: 'Moss-green paper, forest greens, rounded headings, dashed timeline, postcard intro', dates: 'day-month', intro: true },
} as const satisfies Record<string, { name: string; spec: string; dates: DateStyle; intro: boolean }>;

export type VariationId = keyof typeof VARIATIONS;

// The sample essay that exercises every post feature.
export const SHOWCASE_ESSAY = 'lorem-ipsum-dolor-sit-amet';
