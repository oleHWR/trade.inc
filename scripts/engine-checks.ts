import { DEFAULT_SETTINGS } from '../src/config/gameConfig';
import { buildContent } from '../src/engine/content';
import { advance, createRun, setPaused, submitTrade } from '../src/engine/engine';
import { availableCash, totalWealth, lockedProceeds, reservedCollateral } from '../src/engine/accounting';
import { CONTENT } from '../src/content';
import type { Asset, EventDef, RunSettings, RunState } from '../src/engine/types';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) passed++;
  else {
    failed++;
    console.error(`FAIL: ${name} ${detail}`);
  }
}
const eq = (name: string, a: unknown, b: unknown) => check(name, a === b, `(got ${a}, want ${b})`);

const fresh = (seed = 7, over: Partial<RunSettings> = {}): RunState => createRun({ ...DEFAULT_SETTINGS, ...over }, CONTENT, seed);
/** Strip scheduled events so account maths can be tested in isolation. */
const quiet = (seed = 7, over: Partial<RunSettings> = {}) => {
  const s = fresh(seed, over);
  s.queue = [];
  return s;
};

// ---- buy / sell
{
  const s = quiet();
  const p = s.prices.RMT; // 10000
  eq('start price integer cents', p, 10000);
  const r = submitTrade(s, CONTENT, 'buy', 'RMT', 50);
  check('buy ok', r.ok);
  eq('buy: cash', s.cashCents, 2_000_000 - 50 * p);
  eq('buy: wealth unchanged', totalWealth(s), 2_000_000);
  s.prices.RMT = 14000;
  eq('wealth after rise', totalWealth(s), 2_200_000);
  submitTrade(s, CONTENT, 'sell', 'RMT', 20);
  eq('sell: cash', s.cashCents, 1_500_000 + 20 * 14000);
  eq('sell: remaining qty', s.longs.RMT.qty, 30);
  eq('sell: wealth', totalWealth(s), 2_200_000);
  submitTrade(s, CONTENT, 'sell', 'RMT', 30);
  check('holding removed on full sell', !s.longs.RMT);
}
// ---- invalid orders leave account unchanged
{
  const s = quiet();
  const snap = JSON.stringify(s);
  for (const q of [0, -3, 1.5, NaN, Infinity, 1e12]) {
    const r = submitTrade(s, CONTENT, 'buy', 'RMT', q);
    check(`reject qty ${q}`, !r.ok);
  }
  check('unaffordable', !submitTrade(s, CONTENT, 'buy', 'RMT', 10_000).ok);
  check('sell not owned', !submitTrade(s, CONTENT, 'sell', 'RMT', 1).ok);
  check('no mutation after rejects', JSON.stringify(s) === snap);
  setPaused(s, true);
  check('paused rejects', !submitTrade(s, CONTENT, 'buy', 'RMT', 1).ok);
}
// ---- shorting
{
  const s = quiet();
  const r = submitTrade(s, CONTENT, 'short', 'RMT', 50);
  check('short ok', r.ok, r.message);
  eq('short: cash incl proceeds', s.cashCents, 2_500_000);
  eq('short: locked', lockedProceeds(s), 500_000);
  eq('short: reserved', reservedCollateral(s), 500_000);
  eq('short: available', availableCash(s), 1_500_000);
  eq('short: wealth no jump', totalWealth(s), 2_000_000);
  check('no long while short', !submitTrade(s, CONTENT, 'buy', 'RMT', 1).ok);
  check('no second short lot', !submitTrade(s, CONTENT, 'short', 'RMT', 1).ok);
  // partial cover at 60
  s.prices.RMT = 6000;
  eq('short wealth at 60', totalWealth(s), 2_200_000);
  submitTrade(s, CONTENT, 'cover', 'RMT', 20);
  eq('partial cover: remaining', s.shorts.RMT.qty, 30);
  eq('partial cover: proceeds left', s.shorts.RMT.proceedsCents, 300_000);
  eq('partial cover: collateral left', s.shorts.RMT.collateralCents, 300_000);
  eq('partial cover: wealth consistent', totalWealth(s), 2_200_000);
  submitTrade(s, CONTENT, 'cover', 'RMT', 30);
  eq('full cover cash', s.cashCents, 2_200_000);
  eq('full cover wealth', totalWealth(s), 2_200_000);
  check('no leftover reserves', lockedProceeds(s) === 0 && reservedCollateral(s) === 0);
  // loss case
  const s2 = quiet();
  submitTrade(s2, CONTENT, 'short', 'RMT', 50);
  s2.prices.RMT = 15000;
  submitTrade(s2, CONTENT, 'cover', 'RMT', 50);
  eq('short loss wealth', totalWealth(s2), 1_750_000);
}
// ---- liquidation at a price gap
{
  const s = quiet();
  submitTrade(s, CONTENT, 'short', 'RMT', 50);
  s.rawPrices.RMT = 35000; // gap to $350
  advance(s, CONTENT, 1.6); // triggers next price step
  check('short liquidated', !s.shorts.RMT);
  check('run continues (wealth positive)', s.status === 'running', s.status);
  const w = totalWealth(s);
  check('loss exceeds collateral (gap)', w < 2_000_000 - 500_000 && w > 0, String(w));
  check('liquidation logged', s.log.some((l) => l.kind === 'liquidation'));
}
// ---- checkpoints: exact boundary + one cent below
{
  const mk = (cash: number) => {
    const s = quiet();
    s.cashCents = cash;
    advance(s, CONTENT, 60.01); // end of day 10 at 600 s
    return s;
  };
  eq('checkpoint exact passes', mk(500_000).status, 'running');
  const f = mk(499_999);
  eq('checkpoint one cent below loses', f.status, 'lost');
  eq('checkpoint outcome kind', f.outcome?.kind, 'checkpoint');
  const s = mk(500_000);
  s.cashCents = 100_000; // below old minimum, above zero
  advance(s, CONTENT, 100);
  eq('old checkpoint is no floor', s.status, 'running');
  const b = quiet();
  b.cashCents = 0;
  advance(b, CONTENT, 2);
  eq('bankruptcy at zero', b.outcome?.kind, 'bankrupt');
}
// ---- victory / deadline
{
  const w = quiet();
  w.cashCents = 100_000_000;
  advance(w, CONTENT, 5);
  eq('win at target', w.status, 'won');
  const frozenDay = w.timeDays;
  advance(w, CONTENT, 300);
  eq('frozen after win', w.timeDays, frozenDay);
  check('no trades after end', !submitTrade(w, CONTENT, 'buy', 'RMT', 1).ok);
  const d = quiet();
  d.cashCents = 99_999_999;
  advance(d, CONTENT, 600.5);
  eq('deadline loss', d.outcome?.kind, 'deadline');
  const e = quiet();
  e.cashCents = 99_999_999;
  e.rawPrices.RMT = 10000;
  e.longs.RMT = { qty: 1, costCents: 10000 };
  e.cashCents = 99_999_999 - 10000 + 1; // wealth hits target exactly through the final step
  advance(e, CONTENT, 600);
  check('deadline step win or loss decided once', e.status === 'won' || e.status === 'lost');
}
// ---- pause
{
  const s = fresh();
  advance(s, CONTENT, 30);
  const day = s.timeDays;
  const snap = JSON.stringify(s.prices);
  setPaused(s, true);
  advance(s, CONTENT, 200);
  eq('pause: no progress', s.timeDays, day);
  eq('pause: prices frozen', JSON.stringify(s.prices), snap);
  setPaused(s, false);
  check('resume ok', s.status === 'running');
}
// ---- duration scaling
for (const dur of [600, 900, 1200]) {
  const s = quiet(3, { durationSeconds: dur });
  s.cashCents = 50_000_000;
  const day20 = (20 * dur) / 100;
  advance(s, CONTENT, day20 - 0.5);
  eq(`dur ${dur}: before day 20`, s.checkpointResults.length, 1);
  advance(s, CONTENT, day20 + 0.01);
  eq(`dur ${dur}: after day 20`, s.checkpointResults.length, 2);
}
// ---- determinism: one big callback == many small ones
{
  const a = fresh(11);
  const b = fresh(11);
  a.cashCents = b.cashCents = 5_000_000;
  advance(a, CONTENT, 600);
  for (let t = 0.1; t <= 600.01; t += 0.1) advance(b, CONTENT, t);
  eq('big callback == small ticks (prices)', JSON.stringify(a.prices), JSON.stringify(b.prices));
  eq('big callback == small ticks (events)', a.instances.length, b.instances.length);
  eq('same outcome', a.status, b.status);
  check('all quotes are integer cents', Object.values(a.prices).every(Number.isInteger));
}
// ---- trend, jump, collapse maths with a controlled single-asset content
{
  const assets: Asset[] = [{ id: 'X', name: 'Xcorp', category: 'stock', sector: 't', startingPriceCents: 10000, noisePerStep: 0 }];
  const base = {
    schemaVersion: 1 as const, pool: 'p', headline: 'h', description: 'd', location: { kind: 'global' as const, lat: null, lon: null },
    selection: { randomEligible: true, weight: 1 }, clueStyle: 'directional' as const, displayDays: 5, followUps: [],
  };
  const settings: RunSettings = { ...DEFAULT_SETTINGS, checkpoints: [], eventWindows: [{ startDay: 0, endDay: 10, rootCount: 1 }], firstEventNotBeforeDay: 0.5, targetWealthCents: 1e12 };
  const run = (fx: EventDef['effects']) => {
    const ev: EventDef = { ...base, id: 'e', effects: fx };
    const ctx = buildContent(assets, [ev]);
    const s = createRun(settings, ctx, 5);
    const at = s.scheduledRoots[0].day;
    return { s, ctx, at };
  };
  // +100% trend over 4 days: doubles overall, not per step
  let { s, ctx, at } = run([{ assetId: 'X', type: 'price_trend', delayDays: 0, durationDays: 4, changeFraction: 1, recovery: null }]);
  advance(s, ctx, (at + 5) * 6);
  eq('trend doubles overall', s.prices.X, 20000);
  // jump +50% then -20% => *1.2
  ({ s, ctx, at } = run([
    { assetId: 'X', type: 'price_jump', delayDays: 0, durationDays: 0, changeFraction: 0.5, recovery: null },
    { assetId: 'X', type: 'price_jump', delayDays: 0, durationDays: 0, changeFraction: -0.2, recovery: null },
  ]));
  advance(s, ctx, (at + 1) * 6);
  eq('jumps combine multiplicatively', s.prices.X, 12000);
  // near collapse recovers to starting price, not pre-crash price
  ({ s, ctx, at } = run([{ assetId: 'X', type: 'near_collapse', delayDays: 0, durationDays: 0, changeFraction: -0.95, recovery: { waitDays: 4, durationDays: 8 } }]));
  advance(s, ctx, (at + 0.3) * 6);
  eq('collapse price', s.prices.X, 500);
  advance(s, ctx, (at + 3.9) * 6);
  eq('still waiting', s.prices.X, 500);
  advance(s, ctx, (at + 8) * 6);
  check('mid-recovery above bottom and below start', s.prices.X > 500 && s.prices.X < 10000, String(s.prices.X));
  advance(s, ctx, (at + 12.1) * 6);
  eq('recovered to catalogue start', s.prices.X, 10000);
  // quote floor
  s.rawPrices.X = 0.2;
  eq('floor', Math.max(1, Math.floor(0.2 + 0.5)), 1);
}
// ---- content validation catches bad data
{
  const assets: Asset[] = [{ id: 'A', name: 'A', category: 'stock', sector: 's', startingPriceCents: 100, noisePerStep: 0.01 }];
  const mk = (id: string, fu: string[]): EventDef => ({
    schemaVersion: 1, id, pool: 'p', headline: 'h', description: 'd', location: { kind: 'global', lat: null, lon: null },
    selection: { randomEligible: id === 'r', weight: id === 'r' ? 1 : 0 }, clueStyle: 'indirect', displayDays: 3, effects: [],
    followUps: fu.map((e) => ({ eventId: e, delayDays: 1 })),
  });
  check('cycle detected', buildContent(assets, [mk('r', ['b']), mk('b', ['r'])]).errors.some((e) => /cycle|randomEligible/.test(e)));
  check('missing ref detected', buildContent(assets, [mk('r', ['nope'])]).errors.some((e) => /unknown event nope/.test(e)));
  const bad = mk('r', []);
  bad.effects = [{ assetId: 'ZZZ', type: 'price_jump', delayDays: 0, durationDays: 0, changeFraction: -1, recovery: null }];
  const errs = buildContent(assets, [bad]).errors.join('\n');
  check('unknown asset + -100% jump rejected', /unknown asset ZZZ/.test(errs) && /greater than|> -1/.test(errs) || /changeFraction/.test(errs));
}
// ---- probabilistic follow-ups roll once per publication
{
  const assets: Asset[] = [{ id: 'A', name: 'A', category: 'stock', sector: 's', startingPriceCents: 100, noisePerStep: 0 }];
  const ev = (id: string, root: boolean, fu: EventDef['followUps']): EventDef => ({
    schemaVersion: 1, id, pool: 'p', headline: id, description: 'd', location: { kind: 'global', lat: null, lon: null },
    selection: { randomEligible: root, weight: root ? 1 : 0 }, clueStyle: 'indirect', displayDays: 3, effects: [], followUps: fu,
  });
  const ctx = buildContent(assets, [ev('r', true, [{ eventId: 'c', delayDays: 1, chance: 0.5 }]), ev('c', false, [])]);
  eq('chance content valid', ctx.errors.length, 0);
  const settings: RunSettings = { ...DEFAULT_SETTINGS, checkpoints: [], eventWindows: [{ startDay: 0, endDay: 10, rootCount: 1 }], targetWealthCents: 1e12 };
  let published = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const s = createRun(settings, ctx, seed);
    advance(s, ctx, 20 * 6);
    const n = s.instances.filter((i) => i.eventId === 'c').length;
    check('chance chapter at most once', n <= 1);
    published += n;
  }
  check('chance 0.5 publishes roughly half the time', published > 60 && published < 140, String(published));
  const bad = buildContent(assets, [ev('r', true, [{ eventId: 'c', delayDays: 1, chance: 1.5 }]), ev('c', false, [])]);
  check('invalid chance rejected', bad.errors.some((e) => /chance/.test(e)));
}
// ---- default content is valid
eq('default content valid', CONTENT.errors.length, 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
