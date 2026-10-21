import type { Cents, RunState } from './types';

export function longValue(s: RunState): Cents {
  let v = 0;
  for (const [id, p] of Object.entries(s.longs)) v += p.qty * s.prices[id];
  return v;
}

export function coverCostOf(s: RunState, id: string): Cents {
  const p = s.shorts[id];
  return p ? p.qty * s.prices[id] : 0;
}

export function totalCoverCost(s: RunState): Cents {
  let v = 0;
  for (const id of Object.keys(s.shorts)) v += coverCostOf(s, id);
  return v;
}

export function lockedProceeds(s: RunState): Cents {
  let v = 0;
  for (const p of Object.values(s.shorts)) v += p.proceedsCents;
  return v;
}

export function reservedCollateral(s: RunState): Cents {
  let v = 0;
  for (const p of Object.values(s.shorts)) v += p.collateralCents;
  return v;
}

/** Cash balance plus long value minus the cost of covering every short. */
export function totalWealth(s: RunState): Cents {
  return s.cashCents + longValue(s) - totalCoverCost(s);
}

export function availableCash(s: RunState): Cents {
  return s.cashCents - lockedProceeds(s) - reservedCollateral(s);
}

/** Short equity used for the maintenance test: locked proceeds + remaining collateral - covering cost. */
export function shortEquity(s: RunState, id: string): Cents {
  const p = s.shorts[id];
  if (!p) return 0;
  return p.proceedsCents + p.collateralCents - coverCostOf(s, id);
}

/** Price at which the short is force-closed at constant quantity (per-unit, cents, float). */
export function liquidationPriceCents(s: RunState, id: string): number {
  const p = s.shorts[id];
  if (!p) return 0;
  // proceeds + collateral - q*P <= f * collateral  =>  P >= (proceeds + collateral*(1-f)) / q
  const f = s.settings.shortMaintenanceFraction;
  return (p.proceedsCents + p.collateralCents * (1 - f)) / p.qty;
}

export function unrealizedLong(s: RunState, id: string): Cents {
  const p = s.longs[id];
  return p ? p.qty * s.prices[id] - p.costCents : 0;
}

export function unrealizedShort(s: RunState, id: string): Cents {
  const p = s.shorts[id];
  return p ? p.proceedsCents - coverCostOf(s, id) : 0;
}

export function maxBuyQty(s: RunState, id: string): number {
  const price = s.prices[id];
  if (!price || s.shorts[id]) return 0;
  return Math.max(0, Math.floor(availableCash(s) / price));
}

export function maxShortQty(s: RunState, id: string): number {
  const price = s.prices[id];
  if (!price || s.longs[id] || s.shorts[id]) return 0;
  const frac = s.settings.shortCollateralFraction;
  if (frac <= 0) return 0;
  return Math.max(0, Math.floor(availableCash(s) / (price * frac)));
}
