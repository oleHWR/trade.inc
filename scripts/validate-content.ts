import { readFileSync } from 'node:fs';
import { buildContent, validateSettings } from '../src/engine/content';
import { DEFAULT_SETTINGS } from '../src/config/gameConfig';
import { createRun } from '../src/engine/engine';
import type { Asset, EventDef } from '../src/engine/types';

const assets = JSON.parse(readFileSync('src/content/assets.json', 'utf8')) as Asset[];
const events = JSON.parse(readFileSync('src/content/events.json', 'utf8')) as EventDef[];
const content = buildContent(assets, events);
const errors = [...content.errors, ...validateSettings(DEFAULT_SETTINGS)];

if (!errors.length) {
  // dry-run the scheduler on many seeds so quota problems show up before play
  for (let seed = 1; seed <= 300 && errors.length < 5; seed++) {
    try {
      createRun(DEFAULT_SETTINGS, content, seed);
    } catch (e) {
      errors.push(`seed ${seed}: ${(e as Error).message}`);
    }
  }
}

if (errors.length) {
  console.error(`Content INVALID (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
const rootHorizons = content.roots.map((r) => content.horizonDays(r.id));
console.log(
  `Content OK: ${assets.length} assets, ${events.length} events (${content.roots.length} roots, ${events.length - content.roots.length} follow-ups).`,
);
console.log(`Root horizon days: min ${Math.min(...rootHorizons)}, max ${Math.max(...rootHorizons)}. 300 seeds scheduled without error.`);
