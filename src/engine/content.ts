import type { Asset, EventDef, EventTag, RunSettings } from './types';

export interface Content {
  assets: Asset[];
  assetById: Map<string, Asset>;
  events: EventDef[];
  eventById: Map<string, EventDef>;
  parentOf: Map<string, string>;
  /** Game days from a root's publication until all follow-ups, trends and recoveries have finished. */
  horizonDays(eventId: string): number;
  roots: EventDef[];
  errors: string[];
}

const CATEGORIES = ['stock', 'crypto', 'commodity', 'forex'];
const CLUES = ['contextual', 'directional', 'indirect'];
const TYPES = ['price_jump', 'price_trend', 'near_collapse'];
const TAGS = ['breaking', 'announcement', 'rumor', 'update'];
const WHO = ['mom', 'dad', 'chad', 'gerald'];

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

export function validateAssets(assets: Asset[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  assets.forEach((a, i) => {
    const p = `assets.json: ${a?.id ?? `[${i}]`}`;
    if (!a || typeof a.id !== 'string' || !a.id) return void errs.push(`assets.json: [${i}].id: missing id`);
    if (seen.has(a.id)) errs.push(`${p}.id: duplicate id`);
    seen.add(a.id);
    if (!a.name) errs.push(`${p}.name: missing`);
    if (!CATEGORIES.includes(a.category)) errs.push(`${p}.category: must be one of ${CATEGORIES.join(', ')}`);
    if (typeof a.sector !== 'string') errs.push(`${p}.sector: missing`);
    if (!Number.isInteger(a.startingPriceCents) || a.startingPriceCents <= 0)
      errs.push(`${p}.startingPriceCents: must be a positive integer (cents)`);
    if (!isNum(a.noisePerStep) || a.noisePerStep < 0 || a.noisePerStep >= 1)
      errs.push(`${p}.noisePerStep: must be a fraction in [0,1)`);
  });
  return errs;
}

export function validateEvents(events: EventDef[], assetIds: Set<string>): string[] {
  const errs: string[] = [];
  const byId = new Map<string, EventDef>();
  events.forEach((e, i) => {
    if (!e || !e.id) return void errs.push(`events.json: [${i}].id: missing id`);
    if (byId.has(e.id)) errs.push(`events.json: ${e.id}.id: duplicate id`);
    byId.set(e.id, e);
  });
  const parents = new Map<string, string[]>();
  for (const e of events) {
    const p = `events.json: ${e.id}`;
    if (e.schemaVersion !== 1) errs.push(`${p}.schemaVersion: must be 1`);
    if (!e.pool) errs.push(`${p}.pool: missing`);
    if (!e.headline) errs.push(`${p}.headline: missing`);
    if (!e.description) errs.push(`${p}.description: missing`);
    if (!CLUES.includes(e.clueStyle)) errs.push(`${p}.clueStyle: must be ${CLUES.join('|')}`);
    if (e.tag !== undefined && !TAGS.includes(e.tag)) errs.push(`${p}.tag: must be ${TAGS.join('|')}`);
    if (e.quip && !WHO.includes(e.quip.who)) errs.push(`${p}.quip.who: unknown character`);
    if (!isNum(e.displayDays) || e.displayDays <= 0) errs.push(`${p}.displayDays: must be positive`);
    const loc = e.location;
    if (!loc) errs.push(`${p}.location: missing`);
    else if (loc.kind === 'global') {
      if (loc.lat !== null || loc.lon !== null) errs.push(`${p}.location: global needs lat/lon null`);
    } else if (loc.kind === 'map') {
      if (!isNum(loc.lat) || loc.lat < -90 || loc.lat > 90) errs.push(`${p}.location.lat: -90..90`);
      if (!isNum(loc.lon) || loc.lon < -180 || loc.lon > 180) errs.push(`${p}.location.lon: -180..180`);
    } else errs.push(`${p}.location.kind: map|global`);
    if (!e.selection || typeof e.selection.randomEligible !== 'boolean') errs.push(`${p}.selection: invalid`);
    else if (e.selection.randomEligible && !(e.selection.weight > 0)) errs.push(`${p}.selection.weight: must be > 0 for roots`);
    else if (!e.selection.randomEligible && e.selection.weight !== 0)
      errs.push(`${p}.selection.weight: must be 0 for follow-up-only events`);
    if (!Array.isArray(e.effects)) errs.push(`${p}.effects: must be an array`);
    else
      e.effects.forEach((fx, i) => {
        const q = `${p}.effects[${i}]`;
        if (!assetIds.has(fx.assetId)) errs.push(`${q}.assetId: unknown asset ${fx.assetId}`);
        if (!TYPES.includes(fx.type)) return void errs.push(`${q}.type: must be ${TYPES.join('|')}`);
        if (!isNum(fx.delayDays) || fx.delayDays < 0) errs.push(`${q}.delayDays: finite and >= 0`);
        if (!isNum(fx.changeFraction) || fx.changeFraction <= -1) errs.push(`${q}.changeFraction: finite and > -1`);
        if (fx.type === 'price_jump') {
          if (fx.durationDays !== 0) errs.push(`${q}.durationDays: price_jump needs exactly 0`);
          if (fx.recovery !== null) errs.push(`${q}.recovery: price_jump needs null`);
        } else if (fx.type === 'price_trend') {
          if (!(isNum(fx.durationDays) && fx.durationDays > 0)) errs.push(`${q}.durationDays: price_trend needs > 0`);
          if (fx.recovery !== null) errs.push(`${q}.recovery: price_trend needs null`);
        } else {
          if (fx.durationDays !== 0) errs.push(`${q}.durationDays: near_collapse needs exactly 0`);
          if (!(fx.changeFraction < 0)) errs.push(`${q}.changeFraction: near_collapse must be < 0`);
          if (!fx.recovery || !(isNum(fx.recovery.waitDays) && fx.recovery.waitDays >= 0) || !(isNum(fx.recovery.durationDays) && fx.recovery.durationDays > 0))
            errs.push(`${q}.recovery: needs waitDays >= 0 and durationDays > 0`);
        }
      });
    if (!Array.isArray(e.followUps)) errs.push(`${p}.followUps: must be an array`);
    else {
      const seen = new Set<string>();
      e.followUps.forEach((f, i) => {
        const q = `${p}.followUps[${i}]`;
        if (!byId.has(f.eventId)) errs.push(`${q}.eventId: unknown event ${f.eventId}`);
        if (f.eventId === e.id) errs.push(`${q}.eventId: event references itself`);
        if (seen.has(f.eventId)) errs.push(`${q}.eventId: duplicate follow-up ${f.eventId}`);
        seen.add(f.eventId);
        if (!isNum(f.delayDays) || f.delayDays < 0) errs.push(`${q}.delayDays: finite and >= 0`);
        parents.set(f.eventId, [...(parents.get(f.eventId) ?? []), e.id]);
        const child = byId.get(f.eventId);
        if (child && child.selection?.randomEligible) errs.push(`${q}: follow-up ${f.eventId} must have randomEligible false`);
      });
    }
  }
  for (const [child, ps] of parents) if (ps.length > 1) errs.push(`events.json: ${child}: has several parents (${ps.join(', ')})`);
  // cycle detection
  const state = new Map<string, number>();
  const visit = (id: string, stack: string[]) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) return void errs.push(`events.json: ${id}: cycle in follow-ups (${[...stack, id].join(' -> ')})`);
    state.set(id, 1);
    for (const f of byId.get(id)?.followUps ?? []) if (byId.has(f.eventId)) visit(f.eventId, [...stack, id]);
    state.set(id, 2);
  };
  for (const e of events) visit(e.id, []);
  // orphan follow-up only events
  for (const e of events)
    if (!e.selection?.randomEligible && !parents.has(e.id)) errs.push(`events.json: ${e.id}: follow-up-only event has no parent`);
  return errs;
}

export function buildContent(assets: Asset[], events: EventDef[]): Content {
  const errors = [...validateAssets(assets)];
  const assetById = new Map(assets.map((a) => [a.id, a]));
  errors.push(...validateEvents(events, new Set(assetById.keys())));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const parentOf = new Map<string, string>();
  for (const e of events) for (const f of e.followUps ?? []) parentOf.set(f.eventId, e.id);
  const memo = new Map<string, number>();
  const horizon = (id: string, depth = 0): number => {
    if (depth > 32) return Infinity;
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const e = eventById.get(id);
    if (!e) return 0;
    let h = 0;
    for (const fx of e.effects) {
      let end = fx.delayDays + (fx.type === 'price_trend' ? fx.durationDays : 0);
      if (fx.type === 'near_collapse' && fx.recovery) end += fx.recovery.waitDays + fx.recovery.durationDays;
      h = Math.max(h, end);
    }
    for (const f of e.followUps) h = Math.max(h, f.delayDays + horizon(f.eventId, depth + 1));
    memo.set(id, h);
    return h;
  };
  const roots = events.filter((e) => e.selection.randomEligible);
  return {
    assets,
    assetById,
    events,
    eventById,
    parentOf,
    horizonDays: (id) => horizon(id),
    roots,
    errors,
  };
}

export function eventTag(def: EventDef): EventTag {
  if (def.tag) return def.tag;
  if (def.effects.some((e) => e.delayDays === 0)) return 'breaking';
  if (def.followUps.length > 0) return 'announcement';
  return 'update';
}

/** Checks that settings are internally consistent. */
export function validateSettings(s: RunSettings): string[] {
  const errs: string[] = [];
  if (!(s.durationSeconds > 0) || !Number.isFinite(s.durationSeconds)) errs.push('gameConfig: durationSeconds must be positive and finite');
  if (!Number.isInteger(s.gameDays) || s.gameDays <= 0) errs.push('gameConfig: gameDays must be a positive integer');
  for (const c of s.checkpoints) if (!(c.day > 0 && c.day < s.gameDays)) errs.push(`gameConfig: checkpoint day ${c.day} outside calendar`);
  for (const w of s.eventWindows) {
    if (!(w.startDay >= 0 && w.endDay <= s.gameDays && w.startDay < w.endDay)) errs.push(`gameConfig: window ${w.startDay}-${w.endDay} outside calendar`);
    if (!Number.isInteger(w.rootCount) || w.rootCount < 0) errs.push(`gameConfig: window ${w.startDay}-${w.endDay} rootCount invalid`);
  }
  return errs;
}
