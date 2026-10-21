import { hash01 } from './rng';

/**
 * "Chad" is the smug classmate whose net worth the player is silently compared with.
 * Pure function of (seed, day): deterministic, bumpy, always a bit ahead of a cautious player
 * and never quite as good as a great run.
 */
export function chadWealthCents(seed: number, day: number, gameDays = 100): number {
  const start = 2_000_000;
  const t = Math.min(1, day / gameDays);
  const trend = Math.log(34) * Math.pow(t, 1.15);
  let wobble = 0;
  const k = Math.floor(day / 3);
  const frac = day / 3 - k;
  const a = hash01(seed, k) - 0.5;
  const b = hash01(seed, k + 1) - 0.5;
  wobble = (a + (b - a) * (frac * frac * (3 - 2 * frac))) * 0.55;
  // one spectacular face-plant around day 55-70
  const crashDay = 55 + Math.floor(hash01(seed, 999) * 15);
  const crash = day > crashDay ? -0.45 * Math.exp(-(day - crashDay) / 12) : 0;
  return Math.max(300_000, Math.round(start * Math.exp(trend + wobble + crash)));
}
