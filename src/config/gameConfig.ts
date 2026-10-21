import type { RunSettings } from '../engine/types';

/**
 * One obvious place for run + balance settings.
 * Ordinary pacing change: edit `durationSeconds` only (600 = 10 min, 900 = 15 min, 1200 = 20 min).
 * Money is stored as integer cents everywhere.
 */
export const DEFAULT_SETTINGS: RunSettings = {
  gameDays: 100,
  durationSeconds: 600,
  startingCashCents: 2_000_000,
  targetWealthCents: 100_000_000,
  priceStepDays: 0.25,
  minimumPriceCents: 1,
  shortCollateralFraction: 1,
  shortMaintenanceFraction: 0.25,
  recoveryGuardTriggerFraction: 0.1,
  defaultRecoveryWaitDays: 4,
  defaultRecoveryDurationDays: 8,
  firstEventNotBeforeDay: 1.5,
  checkpoints: [
    { day: 10, minimumWealthCents: 500_000 },
    { day: 20, minimumWealthCents: 1_000_000 },
    { day: 40, minimumWealthCents: 2_000_000 },
    { day: 60, minimumWealthCents: 3_500_000 },
    { day: 80, minimumWealthCents: 6_000_000 },
    { day: 95, minimumWealthCents: 10_000_000 },
  ],
  eventWindows: [
    { startDay: 0, endDay: 20, rootCount: 5 },
    { startDay: 20, endDay: 40, rootCount: 5 },
    { startDay: 40, endDay: 60, rootCount: 5 },
    { startDay: 60, endDay: 80, rootCount: 5 },
    { startDay: 80, endDay: 100, rootCount: 4 },
  ],
};

/** Pool weights: missing pools default to 1. */
export const POOL_WEIGHTS: Record<string, number> = {};

export const DURATION_CHOICES: { seconds: number; label: string; note: string }[] = [
  { seconds: 300, label: '5 min', note: 'Demo sprint' },
  { seconds: 600, label: '10 min', note: 'Standard' },
  { seconds: 900, label: '15 min', note: 'Relaxed' },
  { seconds: 1200, label: '20 min', note: 'Thinker' },
];

export interface Difficulty {
  id: 'chill' | 'normal' | 'brutal';
  label: string;
  note: string;
  apply: (s: RunSettings) => RunSettings;
}

const scaleCheckpoints = (s: RunSettings, k: number): RunSettings => ({
  ...s,
  checkpoints: s.checkpoints.map((c) => ({ ...c, minimumWealthCents: Math.round((c.minimumWealthCents * k) / 100_000) * 100_000 })),
});

export const DIFFICULTIES: Difficulty[] = [
  { id: 'chill', label: 'Chill', note: '$30k start, forgiving reviews', apply: (s) => scaleCheckpoints({ ...s, startingCashCents: 3_000_000 }, 0.6) },
  { id: 'normal', label: 'Normal', note: '$20k start, fair reviews', apply: (s) => s },
  { id: 'brutal', label: 'Brutal', note: 'Strict parents, nervous banks', apply: (s) => scaleCheckpoints({ ...s, shortMaintenanceFraction: 0.35 }, 1.6) },
];
