import type {
  Cents,
  QueueItem,
  RunSettings,
  RunState,
  TradeAction,
  TradeRecord,
  TradeResult,
  LogKind,
  CharacterId,
  Outcome,
} from './types';
import { type Content, eventTag } from './content';
import { nextRandom } from './rng';
import { quoteFromRaw, fmtMoney } from './money';
import {
  availableCash,
  coverCostOf,
  lockedProceeds,
  reservedCollateral,
  shortEquity,
  totalCoverCost,
  totalWealth,
} from './accounting';
import { ACHIEVEMENTS } from './achievements';

const EPS = 1e-9;

// ---------------------------------------------------------------- creation

export function createRun(settings: RunSettings, ctx: Content, seed: number, categoryFlags = true): RunState {
  if (ctx.errors.length) throw new Error('Content errors:\n' + ctx.errors.join('\n'));
  const s: RunState = {
    version: 1,
    status: 'running',
    settings: JSON.parse(JSON.stringify(settings)),
    seed,
    rngState: seed | 0,
    activeSeconds: 0,
    clockDays: 0,
    timeDays: 0,
    nextStepDay: settings.priceStepDays,
    seq: 0,
    idCounter: 0,
    rawPrices: {},
    prices: {},
    history: {},
    cashCents: settings.startingCashCents,
    longs: {},
    shorts: {},
    queue: [],
    trends: [],
    recoveries: {},
    instances: [],
    log: [],
    trades: [],
    checkpointResults: [],
    achievements: [],
    flags: {},
    realizedCents: 0,
    peakWealthCents: settings.startingCashCents,
    wealthHistory: [[0, settings.startingCashCents]],
    outcome: null,
    scheduledRoots: [],
  };
  for (const a of ctx.assets) {
    s.rawPrices[a.id] = a.startingPriceCents;
    s.prices[a.id] = a.startingPriceCents;
    s.history[a.id] = [[0, a.startingPriceCents]];
    if (categoryFlags) s.flags['cat_' + a.id] = ['stock', 'crypto', 'commodity', 'forex'].indexOf(a.category) + 1;
  }
  scheduleRoots(s, ctx);
  return s;
}

function weightedPick<T>(s: RunState, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((a, t) => a + weight(t), 0);
  let r = nextRandom(s) * total;
  for (const it of items) {
    r -= weight(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

/** Schedules root events window by window (latest window first: it is the most constrained). */
function scheduleRoots(s: RunState, ctx: Content): void {
  const S = s.settings;
  const used = new Set<string>();
  const windows = [...S.eventWindows].sort((a, b) => b.startDay - a.startDay);
  for (const w of windows) {
    const slot = (w.endDay - w.startDay) / Math.max(1, w.rootCount);
    for (let i = 0; i < w.rootCount; i++) {
      const slotStart = w.startDay + i * slot;
      let t = slotStart + nextRandom(s) * slot;
      if (t < S.firstEventNotBeforeDay) t = S.firstEventNotBeforeDay + nextRandom(s) * Math.max(0.5, slot - S.firstEventNotBeforeDay);
      t = Math.min(t, S.gameDays - 0.01);
      const fits = (when: number) =>
        ctx.roots.filter((e) => !used.has(e.id) && ctx.horizonDays(e.id) + when <= S.gameDays - 0.05);
      let eligible = fits(t);
      if (!eligible.length) {
        t = Math.max(slotStart, S.firstEventNotBeforeDay);
        eligible = fits(t);
      }
      if (!eligible.length)
        throw new Error(
          `Content error: no eligible root event for window ${w.startDay}-${w.endDay} (slot ${i + 1}/${w.rootCount}); add shorter events or reduce rootCount.`,
        );
      const pools = [...new Set(eligible.map((e) => e.pool))];
      const pool = weightedPick(s, pools, (p) => w.poolWeights?.[p] ?? 1);
      const ev = weightedPick(
        s,
        eligible.filter((e) => e.pool === pool),
        (e) => e.selection.weight,
      );
      used.add(ev.id);
      s.scheduledRoots.push({ eventId: ev.id, day: t });
      pushQueue(s, { at: t, kind: 'publish', eventId: ev.id, parentInstance: null });
    }
  }
  s.scheduledRoots.sort((a, b) => a.day - b.day);
}

type NewQueueItem =
  | { at: number; kind: 'publish'; eventId: string; parentInstance: number | null }
  | { at: number; kind: 'effect'; instanceId: number; eventId: string; effectIndex: number };

function pushQueue(s: RunState, item: NewQueueItem): void {
  s.queue.push({ ...item, seq: s.seq++ } as QueueItem);
  s.queue.sort((a, b) => a.at - b.at || a.seq - b.seq);
}

// ---------------------------------------------------------------- logging

function addLog(
  s: RunState,
  kind: LogKind,
  text: string,
  extra: { tone?: 'good' | 'bad' | 'neutral'; eventInstanceId?: number; who?: CharacterId } = {},
): void {
  s.log.push({ id: ++s.idCounter, day: s.timeDays, kind, text, ...extra });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}

// ---------------------------------------------------------------- time

export function secondsPerDay(s: RunState): number {
  return s.settings.durationSeconds / s.settings.gameDays;
}

export function displayDay(s: RunState, days = s.clockDays): number {
  return Math.min(s.settings.gameDays, Math.floor(days + EPS) + 1);
}

export function secondsRemaining(s: RunState): number {
  return Math.max(0, s.settings.durationSeconds - s.activeSeconds);
}

function nextBoundary(s: RunState): number {
  let t = Math.min(s.nextStepDay, s.settings.gameDays);
  if (s.queue.length) t = Math.min(t, s.queue[0].at);
  const cp = s.settings.checkpoints[s.checkpointResults.length];
  if (cp) t = Math.min(t, cp.day);
  for (const r of Object.values(s.recoveries)) t = Math.min(t, r.endDay);
  return Math.max(t, s.timeDays);
}

/** Advances the simulation to the given total active seconds, processing every boundary in order. */
export function advance(s: RunState, ctx: Content, activeSeconds: number): void {
  if (s.status !== 'running') return;
  const S = s.settings;
  const target = Math.min(S.gameDays, (activeSeconds * S.gameDays) / S.durationSeconds);
  let guard = 0;
  while (s.status === 'running' && guard++ < 100000) {
    const tb = nextBoundary(s);
    if (tb > target + EPS) break;
    processBoundary(s, ctx, tb);
  }
  s.activeSeconds = activeSeconds;
  if (s.status === 'running') s.clockDays = Math.max(s.clockDays, target);
  else s.clockDays = s.timeDays;
}

function evolve(s: RunState, ctx: Content, tb: number): void {
  const from = s.timeDays;
  if (tb <= from) return;
  for (const t of s.trends) {
    const a = Math.max(from, t.startDay);
    const b = Math.min(tb, t.endDay);
    if (b > a) s.rawPrices[t.assetId] *= Math.pow(1 + t.changeFraction, (b - a) / (t.endDay - t.startDay));
  }
  s.trends = s.trends.filter((t) => t.endDay > tb + EPS);
  for (const [id, r] of Object.entries(s.recoveries)) {
    const target = r.targetPriceCents;
    const a = Math.max(from, r.waitEndDay);
    const b = Math.min(tb, r.endDay);
    const p = s.rawPrices[id];
    if (p >= target) {
      delete s.recoveries[id];
      continue;
    }
    if (b > a) {
      const remaining = r.endDay - a;
      s.rawPrices[id] = p * Math.pow(target / p, Math.min(1, (b - a) / remaining));
    }
    if (tb >= r.endDay - EPS) {
      if (s.rawPrices[id] < target) s.rawPrices[id] = target;
      delete s.recoveries[id];
    }
  }
}

function processBoundary(s: RunState, ctx: Content, tb: number): void {
  const S = s.settings;
  evolve(s, ctx, tb);
  s.timeDays = tb;
  s.clockDays = Math.max(s.clockDays, tb);

  // regular price step
  if (s.nextStepDay <= tb + EPS) {
    for (const a of ctx.assets) {
      const move = (nextRandom(s) * 2 - 1) * a.noisePerStep;
      s.rawPrices[a.id] = Math.max(S.minimumPriceCents, s.rawPrices[a.id] * (1 + move));
    }
    while (s.nextStepDay <= tb + EPS) s.nextStepDay += S.priceStepDays;
  }

  // due events and effects, in stable order
  let guard = 0;
  while (s.queue.length && s.queue[0].at <= tb + EPS && guard++ < 10000) {
    const item = s.queue.shift()!;
    if (item.kind === 'publish') publishEvent(s, ctx, item.eventId, item.parentInstance, tb);
    else applyEffect(s, ctx, item.eventId, item.effectIndex, tb, item.instanceId);
  }

  // recovery guard
  for (const a of ctx.assets) {
    if (s.rawPrices[a.id] < S.recoveryGuardTriggerFraction * a.startingPriceCents && !s.recoveries[a.id]) {
      s.recoveries[a.id] = {
        assetId: a.id,
        startedDay: tb,
        waitEndDay: tb + S.defaultRecoveryWaitDays,
        endDay: tb + S.defaultRecoveryWaitDays + S.defaultRecoveryDurationDays,
        targetPriceCents: a.startingPriceCents,
        source: 'guard',
      };
    }
  }

  // quotes
  for (const a of ctx.assets) {
    s.rawPrices[a.id] = Math.max(S.minimumPriceCents, s.rawPrices[a.id]);
    const q = quoteFromRaw(s.rawPrices[a.id], S.minimumPriceCents);
    s.prices[a.id] = q;
    s.history[a.id].push([tb, q]);
  }

  settleShorts(s, ctx);
  const w = totalWealth(s);
  s.wealthHistory.push([tb, w]);
  if (w > s.peakWealthCents) s.peakWealthCents = w;
  evaluateOutcome(s, ctx, tb, w);
  checkAchievements(s);
}

function publishEvent(s: RunState, ctx: Content, eventId: string, parent: number | null, tb: number): void {
  const def = ctx.eventById.get(eventId);
  if (!def) return;
  const inst = {
    id: ++s.idCounter,
    eventId,
    publishedDay: tb,
    expiresDay: tb + def.displayDays,
    tag: eventTag(def),
    read: false,
  };
  s.instances.push(inst);
  addLog(s, 'news', def.headline, { eventInstanceId: inst.id });
  def.effects.forEach((_, i) =>
    pushQueue(s, { at: tb + def.effects[i].delayDays, kind: 'effect', instanceId: inst.id, eventId, effectIndex: i }),
  );
  for (const f of def.followUps) {
    // probabilistic chapters roll once, at the parent's publication
    if (f.chance !== undefined && f.chance < 1 && nextRandom(s) >= f.chance) continue;
    pushQueue(s, { at: tb + f.delayDays, kind: 'publish', eventId: f.eventId, parentInstance: inst.id });
  }
}

function applyEffect(s: RunState, ctx: Content, eventId: string, idx: number, tb: number, instanceId?: number): void {
  const def = ctx.eventById.get(eventId);
  const fx = def?.effects[idx];
  if (!def || !fx) return;
  const asset = ctx.assetById.get(fx.assetId);
  if (!asset) return;
  if (fx.type === 'price_jump') {
    s.rawPrices[fx.assetId] *= 1 + fx.changeFraction;
  } else if (fx.type === 'price_trend') {
    s.trends.push({ id: ++s.idCounter, assetId: fx.assetId, startDay: tb, endDay: tb + fx.durationDays, changeFraction: fx.changeFraction, instanceId });
  } else if (fx.type === 'near_collapse' && fx.recovery) {
    s.rawPrices[fx.assetId] *= 1 + fx.changeFraction;
    s.recoveries[fx.assetId] = {
      assetId: fx.assetId,
      startedDay: tb,
      waitEndDay: tb + fx.recovery.waitDays,
      endDay: tb + fx.recovery.waitDays + fx.recovery.durationDays,
      targetPriceCents: asset.startingPriceCents,
      source: 'event',
    };
  }
}

// ---------------------------------------------------------------- shorts

function recordTrade(
  s: RunState,
  assetId: string,
  action: TradeRecord['action'],
  qty: number,
  value: Cents,
  realized: Cents | null,
): TradeRecord {
  const rec: TradeRecord = {
    id: ++s.idCounter,
    day: s.timeDays,
    assetId,
    action,
    qty,
    priceCents: s.prices[assetId],
    valueCents: value,
    realizedCents: realized,
  };
  s.trades.push(rec);
  if (s.trades.length > 300) s.trades.shift();
  return rec;
}

function closeAllPositions(s: RunState): void {
  for (const [id, p] of Object.entries({ ...s.longs })) {
    const v = p.qty * s.prices[id];
    s.cashCents += v;
    s.realizedCents += v - p.costCents;
    recordTrade(s, id, 'sell', p.qty, v, v - p.costCents);
    delete s.longs[id];
  }
  for (const [id, p] of Object.entries({ ...s.shorts })) {
    const cost = p.qty * s.prices[id];
    s.cashCents -= cost;
    s.realizedCents += p.proceedsCents - cost;
    recordTrade(s, id, 'liquidate', p.qty, cost, p.proceedsCents - cost);
    delete s.shorts[id];
  }
}

function settleShorts(s: RunState, ctx: Content): void {
  const S = s.settings;
  let liquidated = false;
  for (const id of Object.keys(s.shorts).sort()) {
    const p = s.shorts[id];
    if (!p) continue;
    const eq = shortEquity(s, id);
    const limit = S.shortMaintenanceFraction * p.collateralCents;
    if (eq <= limit) {
      const cost = coverCostOf(s, id);
      s.cashCents -= cost;
      const realized = p.proceedsCents - cost;
      s.realizedCents += realized;
      recordTrade(s, id, 'liquidate', p.qty, cost, realized);
      delete s.shorts[id];
      s.flags.liquidations = (s.flags.liquidations ?? 0) + 1;
      liquidated = true;
      const a = ctx.assetById.get(id);
      addLog(
        s,
        'liquidation',
        `Margin call: your ${a?.id ?? id} short was closed automatically at ${fmtMoney(s.prices[id], { decimals: true })} per unit (result ${fmtMoney(realized, { sign: true })}).`,
        { tone: 'bad' },
      );
    }
  }
  if (liquidated && availableCash(s) < 0) {
    addLog(s, 'liquidation', 'Settlement: the forced cover left you short of cash, so every remaining position was closed at market.', { tone: 'bad' });
    closeAllPositions(s);
  }
}

// ---------------------------------------------------------------- outcome

function finish(s: RunState, kind: Outcome['kind'], wealth: Cents, required: Cents | null): void {
  s.outcome = { kind, wealthCents: wealth, requiredCents: required, timeDays: s.timeDays };
  s.status = kind === 'won' ? 'won' : 'lost';
  s.clockDays = s.timeDays;
}

function evaluateOutcome(s: RunState, ctx: Content, tb: number, w: Cents): void {
  const S = s.settings;
  if (w <= 0) return finish(s, 'bankrupt', w, null);
  if (w >= S.targetWealthCents) {
    addLog(s, 'system', 'Financial freedom achieved.', { tone: 'good' });
    return finish(s, 'won', w, S.targetWealthCents);
  }
  while (s.status === 'running') {
    const cp = S.checkpoints[s.checkpointResults.length];
    if (!cp || cp.day > tb + EPS) break;
    const passed = w >= cp.minimumWealthCents;
    s.checkpointResults.push({ day: cp.day, minimumWealthCents: cp.minimumWealthCents, wealthCents: w, passed });
    if (!passed) {
      addLog(s, 'checkpoint', `Checkpoint missed: needed ${fmtMoney(cp.minimumWealthCents)}; total wealth was ${fmtMoney(w)}.`, { tone: 'bad' });
      return finish(s, 'checkpoint', w, cp.minimumWealthCents);
    }
    addLog(s, 'checkpoint', `Checkpoint day ${cp.day} passed (${fmtMoney(w)} vs ${fmtMoney(cp.minimumWealthCents)} required).`, { tone: 'good' });
  }
  if (s.status === 'running' && tb >= S.gameDays - EPS) finish(s, 'deadline', w, S.targetWealthCents);
}

function checkAchievements(s: RunState): void {
  if (s.status === 'lost') return;
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.check(s)) {
      s.achievements.push(a.id);
      addLog(s, 'achievement', `Achievement unlocked: ${a.title}`, { tone: 'good' });
    }
  }
}

// ---------------------------------------------------------------- trading

const fail = (message: string): TradeResult => ({ ok: false, message });

export function submitTrade(s: RunState, ctx: Content, action: TradeAction, assetId: string, qty: number): TradeResult {
  if (s.status === 'paused') return fail('Game paused. Resume before trading.');
  if (s.status !== 'running') return fail('The run has ended. Start a new run to trade.');
  const asset = ctx.assetById.get(assetId);
  if (!asset) return fail(`Unknown asset ${assetId}.`);
  if (typeof qty !== 'number' || !Number.isFinite(qty)) return fail('Enter a quantity.');
  if (!Number.isInteger(qty)) return fail('Quantity must be a whole number of units.');
  if (qty <= 0) return fail('Quantity must be at least 1.');
  if (!Number.isSafeInteger(qty * s.prices[assetId])) return fail('That quantity is unreasonably large.');
  const price = s.prices[assetId];
  const S = s.settings;
  const value = qty * price;
  const avail = availableCash(s);
  const longPos = s.longs[assetId];
  const shortPos = s.shorts[assetId];
  const unit = qty === 1 ? 'unit' : 'units';
  let rec: TradeRecord;
  let message: string;

  switch (action) {
    case 'buy': {
      if (shortPos) return fail(`You have a short in ${assetId}. Cover it before buying.`);
      if (value > avail) {
        const locked = lockedProceeds(s) + reservedCollateral(s);
        return fail(
          locked > 0
            ? `Not enough available cash (${fmtMoney(avail)}). ${fmtMoney(locked)} is locked as short proceeds and collateral.`
            : `Not enough available cash (${fmtMoney(avail)}) for ${fmtMoney(value)}.`,
        );
      }
      s.cashCents -= value;
      const pos = longPos ?? { qty: 0, costCents: 0 };
      pos.qty += qty;
      pos.costCents += value;
      s.longs[assetId] = pos;
      const rec0 = s.recoveries[assetId];
      if (rec0 && rec0.source === 'event' && price < 0.35 * asset.startingPriceCents) s.flags.boughtCollapse = 1;
      rec = recordTrade(s, assetId, 'buy', qty, value, null);
      message = `Bought ${qty} ${assetId} for ${fmtMoney(value, { decimals: true })}.`;
      break;
    }
    case 'sell': {
      if (shortPos && !longPos) return fail(`Your ${assetId} position is a short. Use Cover to close it.`);
      if (!longPos || qty > longPos.qty) return fail(`You own ${longPos?.qty ?? 0} ${longPos?.qty === 1 ? 'unit' : 'units'}; you cannot sell ${qty}.`);
      const basis = qty === longPos.qty ? longPos.costCents : Math.round((longPos.costCents * qty) / longPos.qty);
      const realized = value - basis;
      s.cashCents += value;
      s.realizedCents += realized;
      longPos.qty -= qty;
      longPos.costCents -= basis;
      if (longPos.qty === 0) delete s.longs[assetId];
      if (basis > 0 && value >= 2 * basis) s.flags.diamond = 1;
      rec = recordTrade(s, assetId, 'sell', qty, value, realized);
      message = `Sold ${qty} ${assetId} for ${fmtMoney(value, { decimals: true })} (${fmtMoney(realized, { sign: true })}).`;
      break;
    }
    case 'short': {
      if (longPos) return fail(`You own ${assetId}. Sell it before shorting.`);
      if (shortPos) return fail(`You already have a short in ${assetId}. Cover it before opening another.`);
      const collateral = Math.round(value * S.shortCollateralFraction);
      if (collateral > avail) return fail(`Not enough available cash for collateral: ${fmtMoney(collateral)} needed, ${fmtMoney(avail)} available.`);
      s.cashCents += value;
      s.shorts[assetId] = { qty, proceedsCents: value, collateralCents: collateral };
      rec = recordTrade(s, assetId, 'short', qty, value, null);
      message = `Shorted ${qty} ${assetId} at ${fmtMoney(price, { decimals: true })}. ${fmtMoney(collateral)} reserved as collateral.`;
      break;
    }
    case 'cover': {
      if (!shortPos) return fail(`You have no short in ${assetId}.`);
      if (qty > shortPos.qty) return fail(`You are short ${shortPos.qty} ${shortPos.qty === 1 ? 'unit' : 'units'}; you cannot cover ${qty}.`);
      const full = qty === shortPos.qty;
      const relP = full ? shortPos.proceedsCents : Math.floor((shortPos.proceedsCents * qty) / shortPos.qty);
      const relC = full ? shortPos.collateralCents : Math.floor((shortPos.collateralCents * qty) / shortPos.qty);
      const availAfter = s.cashCents - value - (lockedProceeds(s) - relP) - (reservedCollateral(s) - relC);
      if (availAfter < 0) return fail(`Not enough available cash to cover ${qty} ${unit} (${fmtMoney(value)}).`);
      const realized = relP - value;
      s.cashCents -= value;
      s.realizedCents += realized;
      shortPos.qty -= qty;
      shortPos.proceedsCents -= relP;
      shortPos.collateralCents -= relC;
      if (shortPos.qty === 0) delete s.shorts[assetId];
      if (realized > (s.flags.bestShortCents ?? 0)) s.flags.bestShortCents = realized;
      rec = recordTrade(s, assetId, 'cover', qty, value, realized);
      message = `Covered ${qty} ${assetId} for ${fmtMoney(value, { decimals: true })} (${fmtMoney(realized, { sign: true })}).`;
      break;
    }
    default:
      return fail('Unknown order type.');
  }
  addLog(s, 'trade', message, { tone: 'neutral' });
  checkAchievements(s);
  return { ok: true, message, record: rec };
}

/** True while a story still has price effects waiting or unfolding (no direction or size revealed). */
export function storyStillMoving(s: RunState, instanceId: number): boolean {
  return s.queue.some((q) => q.kind === 'effect' && q.instanceId === instanceId) || s.trends.some((t) => t.instanceId === instanceId);
}

export function markRead(s: RunState, instanceId: number): void {
  const i = s.instances.find((x) => x.id === instanceId);
  if (i) i.read = true;
}

export function setPaused(s: RunState, paused: boolean): void {
  if (s.status === 'running' && paused) s.status = 'paused';
  else if (s.status === 'paused' && !paused) s.status = 'running';
}

export { totalCoverCost };
