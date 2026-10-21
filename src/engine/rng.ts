/** One randomness utility for the whole engine (mulberry32). State lives in RunState.rngState. */
export function nextRandom(holder: { rngState: number }): number {
  holder.rngState = (holder.rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(holder.rngState ^ (holder.rngState >>> 15), 1 | holder.rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomSeed(): number {
  return (Math.floor(Math.random() * 2 ** 31) ^ Date.now()) >>> 0;
}

/** Pure hash-noise in [0,1) for deterministic decoration (rival curve etc.). */
export function hash01(seed: number, n: number): number {
  let h = (seed ^ Math.imul(n + 1, 0x9e3779b1)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
