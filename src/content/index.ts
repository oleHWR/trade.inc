import assetsRaw from './assets.json';
import eventsRaw from './events.json';
import presentation from './presentation.json';
import { buildContent } from '../engine/content';
import type { Asset, EventDef } from '../engine/types';

export const CONTENT = buildContent(assetsRaw as Asset[], eventsRaw as EventDef[]);
export { presentation };
export type Presentation = typeof presentation;
