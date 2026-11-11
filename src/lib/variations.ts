// Round 1 offered A Log, B Plain and C Mono-meta. Joey preferred C but found its warm
// palette and setup too Anthropic-like; round 2 keeps C's structure with new palettes
// and setups. C stays here as the reference point.
export const VARIATIONS = {
  c: { name: 'Mono-meta (round 1)', spec: 'Warm paper, rust accent, mono metadata gutter' },
  d: { name: 'Log line', spec: 'Pure white, cobalt links, colour-coded type rail, single 700px column' },
  e: { name: 'Timeline', spec: 'Cool slate, teal accent, dates on a ruled timeline with type dots' },
  f: { name: 'Graphite', spec: 'Monochrome ink, underlined links, inverted type chips, mono gutter' },
} as const;

export type VariationId = keyof typeof VARIATIONS;

// The sample essay that exercises every post feature.
export const SHOWCASE_ESSAY = 'lorem-ipsum-dolor-sit-amet';
