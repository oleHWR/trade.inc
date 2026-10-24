import { CONTENT } from '../content';
import type { Asset, EventDef, EventTag, RunState } from '../engine/types';

const ALIASES: Record<string, string[]> = {
  GOLD: ['gold'],
  OIL: ['oil', 'crude', 'tankers'],
  SLV: ['silver'],
  COF: ['coffee', 'baristas', 'beans'],
  EUR: ['euro', 'ecb', 'eurozone'],
  JPY: ['yen', 'bank of japan'],
  CHF: ['franc', 'swiss national bank', 'switzerland'],
  PILL: ['placebo pharma', 'pharma'],
  CROP: ['down to earth farms', 'farm stocks', 'farmers'],
  BMU: ['bmuu'],
  RMT: ['reinmetall', 'defence stocks', 'defense stocks'],
  CAI: ['closedai', 'ai stocks'],
  ALB: ['alphabett'],
  MCH: ['macrohard'],
  MOO: ['moonshot'],
  HYPE: ['hypeloop'],
  NRC: ['notrugpullcoin'],
  WOOF: ['woofcoin', 'meme coin'],
  BCN: ['bitcorn'],
};

/** Assets that the headline/description names in plain words (never the hidden effects). */
export function mentionedAssets(def: EventDef): Asset[] {
  const text = `${def.headline} ${def.description}`.toLowerCase();
  const out: Asset[] = [];
  for (const a of CONTENT.assets) {
    const keys = [a.name.toLowerCase(), ...(ALIASES[a.id] ?? [])];
    if (keys.some((k) => text.includes(k)) || new RegExp(`\\b${a.id}\\b`).test(`${def.headline} ${def.description}`)) out.push(a);
  }
  return out;
}

export const CATEGORY_LABEL: Record<string, string> = {
  stock: 'Stocks',
  commodity: 'Resources',
  crypto: 'Crypto',
  forex: 'Forex',
};

export const CATEGORY_COLOR: Record<string, string> = {
  stock: '#6c9cff',
  commodity: '#ffb454',
  crypto: '#b794ff',
  forex: '#3ddc97',
};

export const TAG_LABEL: Record<EventTag, string> = {
  breaking: 'Breaking',
  announcement: 'Developing',
  rumor: 'Rumour',
  update: 'Update',
};

export const TAG_COLOR: Record<EventTag, string> = {
  breaking: '#ff5d73',
  announcement: '#ffb454',
  rumor: '#b794ff',
  update: '#6c9cff',
};

export const TAG_GLYPH: Record<EventTag, string> = {
  breaking: '!',
  announcement: '',
  rumor: '?',
  update: '↻',
};

export const changeSinceStart = (s: RunState, id: string): number => {
  const a = CONTENT.assetById.get(id)!;
  return s.prices[id] / a.startingPriceCents - 1;
};

export function dayLabel(days: number): string {
  return `Day ${Math.floor(days + 1e-9) + 1}`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
