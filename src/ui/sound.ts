/** Tiny WebAudio blips: optional polish, never required to understand the game. */
let ctx: AudioContext | null = null;
let muted = typeof localStorage !== 'undefined' && localStorage.getItem('tradeinc.muted') === '1';

export type Sfx = 'click' | 'buy' | 'sell' | 'error' | 'news' | 'breaking' | 'message' | 'pass' | 'fail' | 'win' | 'achievement' | 'margin';

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem('tradeinc.muted', m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.06, slideTo?: number) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.02);
}

export function play(name: Sfx) {
  if (muted || typeof window === 'undefined') return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    return;
  }
  switch (name) {
    case 'click': return tone(660, 0, 0.05, 'triangle', 0.03);
    case 'buy': return (tone(520, 0, 0.08, 'triangle'), tone(780, 0.07, 0.12, 'triangle'));
    case 'sell': return (tone(780, 0, 0.08, 'triangle'), tone(520, 0.07, 0.12, 'triangle'));
    case 'error': return tone(160, 0, 0.18, 'sawtooth', 0.04);
    case 'news': return (tone(880, 0, 0.07, 'sine', 0.04), tone(1180, 0.08, 0.1, 'sine', 0.04));
    case 'breaking': return (tone(440, 0, 0.1, 'square', 0.035), tone(660, 0.11, 0.1, 'square', 0.035), tone(880, 0.22, 0.18, 'square', 0.035));
    case 'message': return tone(990, 0, 0.12, 'sine', 0.04);
    case 'pass': return (tone(523, 0, 0.1), tone(659, 0.1, 0.1), tone(784, 0.2, 0.2));
    case 'fail': return tone(300, 0, 0.7, 'sawtooth', 0.05, 80);
    case 'margin': return (tone(220, 0, 0.12, 'sawtooth', 0.05), tone(180, 0.14, 0.2, 'sawtooth', 0.05));
    case 'achievement': return (tone(784, 0, 0.1), tone(988, 0.1, 0.1), tone(1318, 0.2, 0.25));
    case 'win': return [523, 659, 784, 1047, 1318].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.06));
  }
}
