export const VARIATIONS = {
  a: { name: 'Log', spec: 'System sans 17px / 1.6 · 700px column · day-grouped stream, short posts inline' },
  b: { name: 'Plain', spec: 'System serif 18px / 1.55 · 680px column · title index by year' },
  c: { name: 'Mono-meta', spec: 'System sans 17px / 1.6 · 720px column + mono metadata gutter on wide screens' },
} as const;

export type VariationId = keyof typeof VARIATIONS;

// The sample essay that exercises every post feature.
export const SHOWCASE_ESSAY = 'lorem-ipsum-dolor-sit-amet';
