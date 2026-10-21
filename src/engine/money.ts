import type { Cents } from './types';

/** Round once to integer cents; half-cents round upward. */
export function roundHalfUp(x: number): number {
  return Math.floor(x + 0.5);
}

export function quoteFromRaw(rawCents: number, minimumCents: Cents): Cents {
  return Math.max(minimumCents, roundHalfUp(rawCents));
}

export function fmtMoney(cents: Cents, opts: { decimals?: boolean; sign?: boolean } = {}): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const showDecimals = opts.decimals ?? (abs < 10_000_000 && abs % 100 !== 0);
  const dollars = abs / 100;
  const body = showDecimals
    ? dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(dollars).toLocaleString('en-US');
  const sign = neg ? '-' : opts.sign && cents > 0 ? '+' : '';
  return `${sign}$${body}`;
}

/** Price display: always two decimals. */
export function fmtPrice(cents: Cents): string {
  return fmtMoney(cents, { decimals: true });
}

export function fmtCompact(cents: Cents): string {
  const d = cents / 100;
  const a = Math.abs(d);
  const sign = d < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2)}M`;
  if (a >= 100_000) return `${sign}$${(a / 1000).toFixed(0)}K`;
  if (a >= 10_000) return `${sign}$${(a / 1000).toFixed(1)}K`;
  return fmtMoney(cents, { decimals: false });
}

export function fmtPct(fraction: number, digits = 1): string {
  const v = fraction * 100;
  const s = v.toFixed(digits);
  return `${v > 0 ? '+' : ''}${s}%`;
}

export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
