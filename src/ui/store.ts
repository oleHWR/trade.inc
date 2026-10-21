import { CONTENT } from '../content';
import { DEFAULT_SETTINGS, DIFFICULTIES } from '../config/gameConfig';
import { advance, createRun, markRead, setPaused, submitTrade } from '../engine/engine';
import { randomSeed } from '../engine/rng';
import type { LogEntry, RunState, TradeAction, TradeResult } from '../engine/types';
import { ACHIEVEMENTS } from '../engine/achievements';
import { play } from './sound';

export type Phase = 'title' | 'cutscene' | 'game';

export type GameEvent =
  | { type: 'news'; instanceId: number }
  | { type: 'checkpoint'; day: number; passed: boolean }
  | { type: 'liquidation'; text: string }
  | { type: 'achievement'; id: string }
  | { type: 'finished' };

const SAVE_KEY = 'tradeinc.save.v1';
const fingerprint = `${CONTENT.assets.length}-${CONTENT.events.length}-${JSON.stringify(CONTENT.events).length}`;

export interface SaveInfo {
  day: number;
  wealthCents: number;
}

class GameStore {
  phase: Phase = 'title';
  state: RunState | null = null;
  speed = 1;
  durationSeconds = Number(new URLSearchParams(location.search).get('duration')) || DEFAULT_SETTINGS.durationSeconds;
  difficultyId: 'chill' | 'normal' | 'brutal' = 'normal';
  version = 0;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(e: GameEvent) => void>();
  private raf = 0;
  private last = 0;
  private lastNotify = 0;
  private lastSave = 0;
  private seenLog = 0;
  private seenAchievements = 0;
  private finishedEmitted = false;

  constructor() {
    this.loop = this.loop.bind(this);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.save();
    });
    window.addEventListener('beforeunload', () => this.save());
    this.raf = requestAnimationFrame(this.loop);
  }

  // ------------------------------------------------ subscriptions
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = () => this.version;
  onEvent(fn: (e: GameEvent) => void) {
    this.eventListeners.add(fn);
    return () => {
      this.eventListeners.delete(fn);
    };
  }
  private emit(e: GameEvent) {
    this.eventListeners.forEach((f) => f(e));
  }
  notify() {
    this.version++;
    this.lastNotify = performance.now();
    this.listeners.forEach((f) => f());
  }

  // ------------------------------------------------ lifecycle
  readSave(): { state: RunState; speed: number } | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.fingerprint !== fingerprint || data.state?.version !== 1) return null;
      if (data.state.status === 'won' || data.state.status === 'lost') return null;
      return { state: data.state as RunState, speed: data.speed ?? 1 };
    } catch {
      return null;
    }
  }

  saveInfo(): SaveInfo | null {
    const sv = this.readSave();
    if (!sv) return null;
    const s = sv.state;
    const last = s.wealthHistory[s.wealthHistory.length - 1];
    return { day: Math.floor(s.clockDays) + 1, wealthCents: last ? last[1] : s.cashCents };
  }

  private save() {
    const s = this.state;
    if (!s || this.phase !== 'game' || s.status === 'won' || s.status === 'lost') return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ fingerprint, speed: this.speed, state: s }));
    } catch {
      /* storage full or unavailable: saving is optional */
    }
  }
  private clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }

  setDuration(sec: number) {
    this.durationSeconds = sec;
    this.notify();
  }
  setDifficulty(id: 'chill' | 'normal' | 'brutal') {
    this.difficultyId = id;
    this.notify();
  }

  /** Begin a new run. The cutscene plays first; the clock starts when the game phase begins. */
  newRun(withCutscene = true) {
    const diff = DIFFICULTIES.find((d) => d.id === this.difficultyId) ?? DIFFICULTIES[1];
    const settings = diff.apply({ ...DEFAULT_SETTINGS, durationSeconds: this.durationSeconds });
    const seedParam = new URLSearchParams(location.search).get('seed');
    const seed = seedParam ? Number(seedParam) >>> 0 : randomSeed();
    this.clearSave();
    this.state = createRun(settings, CONTENT, seed);
    this.state.status = 'paused';
    this.speed = 1;
    this.beginTracking();
    this.phase = withCutscene ? 'cutscene' : 'game';
    if (!withCutscene) this.state.status = 'running';
    this.last = performance.now();
    this.notify();
  }

  continueRun() {
    const sv = this.readSave();
    if (!sv) return;
    this.state = sv.state;
    this.speed = sv.speed;
    this.state.status = 'paused'; // resume manually: no hidden catch-up
    this.beginTracking();
    this.phase = 'game';
    this.notify();
  }

  startPlaying() {
    if (!this.state) return;
    this.phase = 'game';
    this.state.status = 'running';
    this.last = performance.now();
    this.notify();
  }

  toTitle() {
    this.save();
    this.phase = 'title';
    this.notify();
  }

  private beginTracking() {
    const s = this.state!;
    this.seenLog = s.log.length ? s.log[s.log.length - 1].id : 0;
    this.seenAchievements = s.achievements.length;
    this.finishedEmitted = false;
  }

  // ------------------------------------------------ simulation loop
  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const s = this.state;
    const dt = Math.min(Math.max(0, (now - this.last) / 1000), 3600);
    this.last = now;
    if (!s || this.phase !== 'game') return;
    if (s.status === 'running') {
      advance(s, CONTENT, s.activeSeconds + dt * this.speed);
      this.afterAdvance();
      if (now - this.lastSave > 5000) {
        this.lastSave = now;
        this.save();
      }
    }
    if (now - this.lastNotify > 120) this.notify();
  }

  private afterAdvance() {
    const s = this.state!;
    const fresh: LogEntry[] = s.log.filter((l) => l.id > this.seenLog);
    if (fresh.length) {
      this.seenLog = fresh[fresh.length - 1].id;
      for (const l of fresh) {
        if (l.kind === 'news' && l.eventInstanceId) {
          const inst = s.instances.find((i) => i.id === l.eventInstanceId);
          this.emit({ type: 'news', instanceId: l.eventInstanceId });
          play(inst?.tag === 'breaking' ? 'breaking' : 'news');
        } else if (l.kind === 'liquidation' && l.text.startsWith('Margin')) {
          this.emit({ type: 'liquidation', text: l.text });
          play('margin');
        } else if (l.kind === 'checkpoint') {
          const day = s.checkpointResults[s.checkpointResults.length - 1];
          if (day) {
            this.emit({ type: 'checkpoint', day: day.day, passed: day.passed });
            play(day.passed ? 'pass' : 'fail');
          }
        }
      }
    }
    if (s.achievements.length > this.seenAchievements) {
      for (const id of s.achievements.slice(this.seenAchievements)) {
        if (ACHIEVEMENTS.find((a) => a.id === id)) {
          this.emit({ type: 'achievement', id });
          play('achievement');
        }
      }
      this.seenAchievements = s.achievements.length;
    }
    if ((s.status === 'won' || s.status === 'lost') && !this.finishedEmitted) {
      this.finishedEmitted = true;
      this.clearSave();
      this.emit({ type: 'finished' });
      play(s.status === 'won' ? 'win' : 'fail');
      this.notify();
    }
  }

  // ------------------------------------------------ actions
  togglePause() {
    const s = this.state;
    if (!s) return;
    setPaused(s, s.status === 'running');
    this.last = performance.now();
    if (s.status === 'paused') this.save();
    play('click');
    this.notify();
  }

  setSpeed(x: number) {
    this.speed = x;
    this.notify();
  }

  trade(action: TradeAction, assetId: string, qty: number): TradeResult {
    const s = this.state;
    if (!s) return { ok: false, message: 'No active run.' };
    // The animation loop advances the engine every frame, so quotes are current at the moment of the order.
    if (s.status === 'running') {
      const now = performance.now();
      advance(s, CONTENT, s.activeSeconds + Math.max(0, (now - this.last) / 1000) * this.speed);
      this.last = now;
    }
    const r = submitTrade(s, CONTENT, action, assetId, qty);
    play(r.ok ? (action === 'buy' || action === 'cover' ? 'buy' : 'sell') : 'error');
    this.afterAdvance();
    this.notify();
    return r;
  }

  read(instanceId: number) {
    if (!this.state) return;
    markRead(this.state, instanceId);
    this.notify();
  }
}

export const store = new GameStore();
