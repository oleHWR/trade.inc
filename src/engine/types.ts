export type Cents = number;

export type AssetCategory = 'stock' | 'crypto' | 'commodity' | 'forex';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  sector: string;
  startingPriceCents: Cents;
  noisePerStep: number;
  /** Optional display unit, e.g. "per oz" or "per 100 EUR". */
  unit?: string;
}

export type EffectType = 'price_jump' | 'price_trend' | 'near_collapse';

export interface EventEffect {
  assetId: string;
  type: EffectType;
  delayDays: number;
  durationDays: number;
  changeFraction: number;
  recovery: { waitDays: number; durationDays: number } | null;
}

export type ClueStyle = 'contextual' | 'directional' | 'indirect';
export type EventTag = 'breaking' | 'announcement' | 'rumor' | 'update';
export type CharacterId = 'mom' | 'dad' | 'chad' | 'gerald';

export interface EventLocation {
  kind: 'map' | 'global';
  lat: number | null;
  lon: number | null;
}

export interface EventDef {
  schemaVersion: 1;
  id: string;
  pool: string;
  headline: string;
  description: string;
  location: EventLocation;
  /** Optional human-readable place name for map events. */
  place?: string;
  selection: { randomEligible: boolean; weight: number };
  clueStyle: ClueStyle;
  displayDays: number;
  effects: EventEffect[];
  /** `chance` (0..1] makes a follow-up probabilistic: rolled once when the parent publishes. Omitted = guaranteed. */
  followUps: { eventId: string; delayDays: number; chance?: number }[];
  /** Optional presentation hints (not part of the market model). */
  tag?: EventTag;
  quip?: { who: CharacterId; text: string };
}

export interface Checkpoint {
  day: number;
  minimumWealthCents: Cents;
}

export interface EventWindow {
  startDay: number;
  endDay: number;
  rootCount: number;
  poolWeights?: Record<string, number>;
}

export interface RunSettings {
  gameDays: number;
  durationSeconds: number;
  startingCashCents: Cents;
  targetWealthCents: Cents;
  priceStepDays: number;
  minimumPriceCents: Cents;
  shortCollateralFraction: number;
  shortMaintenanceFraction: number;
  recoveryGuardTriggerFraction: number;
  defaultRecoveryWaitDays: number;
  defaultRecoveryDurationDays: number;
  checkpoints: Checkpoint[];
  eventWindows: EventWindow[];
  /** Earliest game day a first root may appear, so players can read the intro. */
  firstEventNotBeforeDay: number;
}

export type RunStatus = 'running' | 'paused' | 'won' | 'lost';

export interface LongPosition {
  qty: number;
  costCents: Cents; // total cost basis
}

export interface ShortPosition {
  qty: number;
  proceedsCents: Cents; // locked sale proceeds still outstanding
  collateralCents: Cents; // reserved own money still outstanding
}

export type QueueItem =
  | { at: number; seq: number; kind: 'publish'; eventId: string; parentInstance: number | null }
  | { at: number; seq: number; kind: 'effect'; instanceId: number; eventId: string; effectIndex: number };

export interface ActiveTrend {
  id: number;
  assetId: string;
  startDay: number;
  endDay: number;
  changeFraction: number;
  instanceId?: number;
}

export interface RecoveryCycle {
  assetId: string;
  startedDay: number;
  waitEndDay: number;
  endDay: number;
  targetPriceCents: Cents;
  source: 'event' | 'guard';
}

export interface EventInstance {
  id: number;
  eventId: string;
  publishedDay: number;
  expiresDay: number;
  tag: EventTag;
  read: boolean;
}

export type LogKind =
  | 'news'
  | 'trade'
  | 'liquidation'
  | 'checkpoint'
  | 'system'
  | 'achievement'
  | 'message';

export interface LogEntry {
  id: number;
  day: number;
  kind: LogKind;
  text: string;
  tone?: 'good' | 'bad' | 'neutral';
  eventInstanceId?: number;
  who?: CharacterId;
}

export interface TradeRecord {
  id: number;
  day: number;
  assetId: string;
  action: 'buy' | 'sell' | 'short' | 'cover' | 'liquidate';
  qty: number;
  priceCents: Cents;
  valueCents: Cents;
  realizedCents: Cents | null;
}

export interface CheckpointResult {
  day: number;
  minimumWealthCents: Cents;
  wealthCents: Cents;
  passed: boolean;
}

export type OutcomeKind = 'won' | 'bankrupt' | 'checkpoint' | 'deadline';

export interface Outcome {
  kind: OutcomeKind;
  wealthCents: Cents;
  requiredCents: Cents | null;
  timeDays: number;
}

export interface RunState {
  version: 1;
  status: RunStatus;
  settings: RunSettings;
  seed: number;
  rngState: number;
  activeSeconds: number;
  /** Display clock: game days elapsed right now (may be ahead of the last processed boundary). */
  clockDays: number;
  /** Game day of the last processed simulation boundary. */
  timeDays: number;
  nextStepDay: number;
  seq: number;
  idCounter: number;
  rawPrices: Record<string, number>; // float cents, internal
  prices: Record<string, Cents>; // executable integer quotes
  history: Record<string, [number, Cents][]>;
  cashCents: Cents;
  longs: Record<string, LongPosition>;
  shorts: Record<string, ShortPosition>;
  queue: QueueItem[];
  trends: ActiveTrend[];
  recoveries: Record<string, RecoveryCycle>;
  instances: EventInstance[];
  log: LogEntry[];
  trades: TradeRecord[];
  checkpointResults: CheckpointResult[];
  achievements: string[];
  flags: Record<string, number>;
  realizedCents: Cents;
  peakWealthCents: Cents;
  wealthHistory: [number, Cents][];
  outcome: Outcome | null;
  scheduledRoots: { eventId: string; day: number }[];
}

export type TradeAction = 'buy' | 'sell' | 'short' | 'cover';

export interface TradeResult {
  ok: boolean;
  message: string;
  record?: TradeRecord;
}
