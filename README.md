# trade.inc — 100 days. Zero plan B.

Uni project at HWR Berlin for Software-Engineering IT2101 IT25A.

Satirical trading simulator. Turn **$20,000** into **$1,000,000** in 100 fictional days (10 real minutes by default).
Absurd world events move 19 assets: stocks, resources, crypto and forex. Some hit instantly, some are warnings,
some are rumours. Spec: [GAME_CONCEPT.md](GAME_CONCEPT.md). Stack: React + TypeScript + Vite, no backend.

## Run

Ausführliche Anleitung zum Starten und zur Demo: [ANLEITUNG.md](ANLEITUNG.md).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build && npm run preview   # presentation build
```

Demo URL: `http://localhost:5173/?duration=300&seed=42` (5 min run, repeatable event schedule).
Space = pause/resume.

## What is in the game

| Area | Feature |
| --- | --- |
| Trading | Long (Buy/Sell) and Short (Short/Cover) with 100% collateral, locked proceeds, automatic margin calls at +75%, settlement, integer-cent accounting |
| World | Flat map with pulsing news markers, clusters, global (worldwide) chips, news feed, spotlight chips, character quips |
| Events | 76 authored events (53 random roots, 23 follow-ups): instant shocks, developing stories, rumours, trends, near-collapse with guaranteed recovery |
| Run | Pause, 1x/2x/4x speed, autosave and continue, difficulty (Chill/Normal/Brutal), run length 5/10/15/20 min |
| Story | Parents' progress reviews (survival checkpoints), cutscene intro, rival Chad, trophies, win scene, burger-job contract ending |
| UI | Dark/light theme, ticker, live charts with entry line and hover, portfolio, activity log, sound (WebAudio, mutable) |

## Project layout

```
src/engine/    time, prices, events, trades, shorts, checkpoints, outcomes (no React)
src/config/    gameConfig.ts: duration, checkpoints, event windows, difficulties
src/content/   assets.json, events.json, presentation.json (all author-editable), worldMap.ts (generated)
src/ui/        React components, store (single authoritative state), sound
scripts/       validate-content, engine-checks, balance-sim
```

## Commands

```bash
npm run validate:content   # schema + references + cycles + scheduler dry-run on 300 seeds
npm run test:engine        # 74 behaviour checks from section 21 of the concept
npm run sim -- 150         # balance probe: bots that read the news with 35/60/85/100% skill
```

Current balance probe (150 seeds): skill 0.35 wins about 2%, 0.6 about 30%, 0.85 about 60%, 1.0 about 75%.

## Adding content (no code changes)

**New asset** — append to `src/content/assets.json`:

```json
{ "id": "TEA", "name": "Tea Corp", "category": "stock", "sector": "food", "startingPriceCents": 12550, "noisePerStep": 0.015 }
```

Categories: `stock | crypto | commodity | forex`. The starting price is also the near-collapse recovery target.

**New event** — append to `src/content/events.json` (all fields required; `place`, `tag`, `quip` optional):

```json
{ "schemaVersion": 1, "id": "tech_toaster", "pool": "tech", "headline": "Toaster achieves sentience", "description": "It wants a raise.",
  "location": { "kind": "map", "lat": 52.52, "lon": 13.405 }, "place": "Berlin",
  "selection": { "randomEligible": true, "weight": 1 }, "clueStyle": "contextual", "displayDays": 6,
  "effects": [ { "assetId": "MCH", "type": "price_jump", "delayDays": 0, "durationDays": 0, "changeFraction": -0.2, "recovery": null } ],
  "followUps": [] }
```

Effect types: `price_jump`, `price_trend` (needs `durationDays` > 0), `near_collapse` (needs `recovery: { waitDays, durationDays }`).
Story chapters: set the child to `randomEligible: false`, `weight: 0` and list it in the parent's `followUps`.
Run `npm run validate:content` afterwards: errors name file, event id and field.

## Implementation notes

- All money is integer cents. Quotes round half-up once, floor 1 cent. Internal price state is float so slow trends do not lose cents.
- One clock: `secondsPerDay = durationSeconds / gameDays`. Everything (events, trends, recovery, checkpoints) is in game days.
- Boundaries (price step, event, effect, recovery end, checkpoint, deadline) are processed in order, so late browser callbacks cannot skip anything.
- Outcome order at one timestamp: bankruptcy, victory, checkpoint, deadline.
- Forex quotes are per lot (100 EUR, 10,000 JPY, 100 CHF) so one-cent rounding stays harmless.
- Switching browser tabs does not pause (spec). Use Pause. Returning catches the game up.
- Added beyond the spec: Forex class, speed control, difficulty, autosave, rival, trophies, theme, sound.
