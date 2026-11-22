import type { Content } from './content';
import { nextRandom } from './rng';
import type { RunState } from './types';

const EPS = 1e-9;

/** Reserve every possible chapter, including optional ones that may not publish. */
export function planStory(ctx: Content, rootId: string, gap: number) {
  const pending = [{ eventId: rootId, day: 0 }];
  const publicationDays = new Map<string, number>();
  let last = -Infinity;
  let horizon = 0;
  while (pending.length) {
    const { eventId, day } = pending.shift()!;
    const published = Math.max(day, last + gap);
    publicationDays.set(eventId, published);
    last = published;
    // Each chapter can finish later than its original subtree estimate if it was spaced out.
    horizon = Math.max(horizon, published + ctx.horizonDays(eventId));
    for (const child of ctx.eventById.get(eventId)!.followUps) {
      pending.push({ eventId: child.eventId, day: published + child.delayDays });
    }
    pending.sort((a, b) => a.day - b.day);
  }
  return { publicationDays, horizon };
}

/** Returns the latest available day at or before the requested bound. */
function availableDay(min: number, max: number, conflicts: number[], gap: number): number | undefined {
  let day = max;
  for (const conflict of conflicts) {
    if (day > conflict - gap + EPS && day < conflict + gap - EPS) day = conflict - gap;
  }
  return day >= min ? day : undefined;
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

export function scheduleRoots(s: RunState, ctx: Content): RunState['scheduledRoots'] {
  const settings = s.settings;
  const gap = settings.minimumNewsGapDays ?? 0;
  const windows = [...settings.eventWindows].sort((a, b) => b.startDay - a.startDay);
  const plans = ctx.roots.map((event) => {
    const { publicationDays, horizon } = planStory(ctx, event.id, gap);
    return { event, horizon, offsets: [...publicationDays.values()] };
  });
  const roots: RunState['scheduledRoots'] = [];
  const used = new Set<string>();
  const reserved: number[] = [];

  // Fill the latest slots first so short stories are still available near the deadline.
  for (const window of windows) {
    const slot = (window.endDay - window.startDay) / Math.max(1, window.rootCount);
    for (let i = window.rootCount - 1; i >= 0; i--) {
      const start = Math.max(window.startDay + i * slot, settings.firstEventNotBeforeDay);
      const end = window.startDay + (i + 1) * slot - EPS;
      const preferred = start + nextRandom(s) * (end - start);
      const options = plans.flatMap((plan) => {
        if (used.has(plan.event.id)) return [];
        const latest = Math.min(end, settings.gameDays - 0.05 - plan.horizon);
        if (latest < start) return [];
        // A reserved publication rules out start times near it for every chapter offset.
        const conflicts = plan.offsets.flatMap((offset) => reserved.map((day) => day - offset));
        conflicts.sort((a, b) => b - a);
        const day = availableDay(start, Math.min(preferred, latest), conflicts, gap)
          ?? availableDay(start, latest, conflicts, gap);
        return day === undefined ? [] : [{ ...plan, day }];
      });
      if (!options.length) {
        throw new Error(
          `Content error: no eligible root event for window ${window.startDay}-${window.endDay} (slot ${i + 1}/${window.rootCount}); check story lengths, news spacing and root quotas.`,
        );
      }
      const pools = [...new Set(options.map(({ event }) => event.pool))];
      const pool = weightedPick(s, pools, (name) => window.poolWeights?.[name] ?? 1);
      const pick = weightedPick(s, options.filter(({ event }) => event.pool === pool), ({ event }) => event.selection.weight);
      used.add(pick.event.id);
      roots.push({ eventId: pick.event.id, day: pick.day });
      reserved.push(...pick.offsets.map((offset) => pick.day + offset));
    }
  }
  return roots.sort((a, b) => a.day - b.day);
}
