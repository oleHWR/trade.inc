/**
 * Rough balance probe: bots that read the news with probability `skill`.
 * A bot that "understands" a story knows its follow-up effects and trades BEFORE they land
 * (instant effects cannot be traded, they are already in the price when published).
 */
import { DEFAULT_SETTINGS } from '../src/config/gameConfig';
import { CONTENT } from '../src/content';
import { advance, createRun, submitTrade } from '../src/engine/engine';
import { availableCash, totalWealth } from '../src/engine/accounting';
import type { RunState } from '../src/engine/types';

function lcg(seed: number) {
  let x = seed >>> 0 || 1;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function runBot(seed: number, skill: number) {
  const rnd = lcg(seed * 7919 + 13);
  const s = createRun(DEFAULT_SETTINGS, CONTENT, seed);
  const known = new Set<number>();
  const seen = new Set<number>();
  const step = 1.5; // seconds per decision
  for (let t = step; t <= 600.01 && s.status === 'running'; t += step) {
    advance(s, CONTENT, t);
    if (s.status !== 'running') break;
    for (const inst of s.instances) {
      if (seen.has(inst.id)) continue;
      seen.add(inst.id);
      const parent = [...s.queue].length ? undefined : undefined;
      void parent;
      if (rnd() < skill) known.add(inst.id);
    }
    // opportunities
    type Opp = { id: string; dir: 1 | -1; ln: number; at: number };
    const opps: Opp[] = [];
    const now = s.timeDays;
    for (const q of s.queue) {
      if (q.kind === 'effect' && q.at > now + 1e-9 && known.has(q.instanceId)) {
        const fx = CONTENT.eventById.get(q.eventId)!.effects[q.effectIndex];
        opps.push({ id: fx.assetId, dir: fx.changeFraction >= 0 ? 1 : -1, ln: Math.abs(Math.log(1 + fx.changeFraction)), at: q.at });
      }
      if (q.kind === 'publish' && q.parentInstance !== null && known.has(q.parentInstance)) {
        const def = CONTENT.eventById.get(q.eventId)!;
        for (const fx of def.effects) {
          if (q.at > now + 1e-9 + 0.0) opps.push({ id: fx.assetId, dir: fx.changeFraction >= 0 ? 1 : -1, ln: Math.abs(Math.log(1 + fx.changeFraction)), at: q.at + fx.delayDays });
        }
        // chapter chains: parent known => child known once published
      }
    }
    // chapters published from known parents stay known
    for (const inst of s.instances) {
      const parentId = CONTENT.parentOf.get(inst.eventId);
      if (parentId) {
        const p = s.instances.find((x) => x.eventId === parentId);
        if (p && known.has(p.id)) known.add(inst.id);
      }
    }
    // active collapse recoveries
    for (const r of Object.values(s.recoveries)) {
      if (r.source === 'event' && s.prices[r.assetId] < 0.55 * r.targetPriceCents && rnd() < Math.max(skill, 0.35)) {
        opps.push({ id: r.assetId, dir: 1, ln: Math.log(r.targetPriceCents / s.prices[r.assetId]), at: r.endDay });
      }
    }
    for (const tr of s.trends) {
      const inst = s.instances.find((i) => i.id === tr.id);
      void inst;
    }
    const near = opps.filter((o) => o.at - now <= 12 && o.ln > 0.15);
    near.sort((a, b) => b.ln - a.ln);
    const best = near[0];
    const holdingId = Object.keys(s.longs)[0] ?? Object.keys(s.shorts)[0];
    const wantKey = best ? `${best.id}:${best.dir}` : '';
    const haveKey = holdingId ? `${holdingId}:${s.longs[holdingId] ? 1 : -1}` : '';
    if (wantKey === haveKey) continue;
    // close current
    for (const id of Object.keys(s.longs)) submitTrade(s, CONTENT, 'sell', id, s.longs[id].qty);
    for (const id of Object.keys(s.shorts)) submitTrade(s, CONTENT, 'cover', id, s.shorts[id].qty);
    if (best) {
      const price = s.prices[best.id];
      const qty = Math.floor(availableCash(s) / price);
      if (qty > 0) submitTrade(s, CONTENT, best.dir === 1 ? 'buy' : 'short', best.id, qty);
    }
  }
  return { s, wealth: totalWealth(s) };
}

const N = Number(process.argv[2] ?? 150);
for (const skill of [0.35, 0.6, 0.85, 1]) {
  const results: { w: number; kind: string }[] = [];
  for (let seed = 1; seed <= N; seed++) {
    const { s, wealth } = runBot(seed, skill);
    results.push({ w: wealth, kind: s.status === 'won' ? 'won' : (s.outcome?.kind ?? 'running') });
  }
  const wins = results.filter((r) => r.kind === 'won').length;
  const ws = results.map((r) => r.w).sort((a, b) => a - b);
  const med = ws[Math.floor(ws.length / 2)] / 100;
  const kinds: Record<string, number> = {};
  for (const r of results) kinds[r.kind] = (kinds[r.kind] ?? 0) + 1;
  console.log(`skill ${skill}: win ${((wins / N) * 100).toFixed(0)}%  median $${Math.round(med).toLocaleString()}  outcomes ${JSON.stringify(kinds)}`);
}
