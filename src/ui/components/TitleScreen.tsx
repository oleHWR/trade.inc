import { useMemo } from 'react';
import { presentation } from '../../content';
import { DIFFICULTIES, DURATION_CHOICES } from '../../config/gameConfig';
import { fmtMoney } from '../../engine/money';
import { useGame } from '../hooks';
import { store } from '../store';
import { play } from '../sound';
import { Logo } from './shared';
import { Icon } from './icons';

const TICKERS = ['RMT ▲ 4.2%', 'GOLD ▲ 1.1%', 'NRC ▼ 94%', 'WOOF ▲ 100%', 'OIL ▼ 30%', 'COF ▲ 60%', 'ALB ▲ 55%', 'BMU ▼ 32%', 'CHF ▲ 14%', 'HYPE ▼ 42%', 'MOO ▲ 60%', 'PILL ▲ 75%', 'BCN ▲ 50%', 'JPY ▲ 38%'];

export function TitleScreen() {
  const g = useGame();
  const save = store.saveInfo();
  const floaters = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        t: TICKERS[i % TICKERS.length],
        left: (i * 61) % 100,
        delay: -((i * 3.7) % 24),
        dur: 18 + ((i * 7) % 14),
        size: 11 + ((i * 5) % 6),
      })),
    [],
  );
  return (
    <div className="title-screen">
      <div className="title-bg" aria-hidden="true">
        {floaters.map((f, i) => (
          <span key={i} className={f.t.includes('▼') ? 'neg' : 'pos'} style={{ left: `${f.left}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s`, fontSize: f.size }}>
            {f.t}
          </span>
        ))}
      </div>
      <div className="title-inner">
        <div className="title-brand">
          <Logo size={64} />
          <h1>{presentation.brand.name}</h1>
        </div>
        <p className="title-tag">{presentation.brand.tagline}</p>
        <p className="title-pitch">
          Turn <b>{fmtMoney(2_000_000, { decimals: false })}</b> into <b>$1,000,000</b> before your parents run out of patience. Read the absurd news. Trade the aftermath. Avoid the burger job.
        </p>

        <div className="title-card">
          <div className="opt-group">
            <span className="opt-label">Run length</span>
            <div className="seg" role="group" aria-label="Run length">
              {DURATION_CHOICES.map((d) => (
                <button key={d.seconds} className={g.durationSeconds === d.seconds ? 'on' : ''} onClick={() => store.setDuration(d.seconds)} title={d.note}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="opt-group">
            <span className="opt-label">Difficulty</span>
            <div className="seg" role="group" aria-label="Difficulty">
              {DIFFICULTIES.map((d) => (
                <button key={d.id} className={g.difficultyId === d.id ? 'on' : ''} onClick={() => store.setDifficulty(d.id)} title={d.note}>
                  {d.label}
                </button>
              ))}
            </div>
            <span className="opt-note">{DIFFICULTIES.find((d) => d.id === g.difficultyId)?.note}</span>
          </div>
          <div className="title-actions">
            <button
              className="btn primary xl"
              onClick={() => {
                play('click');
                store.newRun(true);
              }}
            >
              <Icon name="play" /> New run
            </button>
            {save && (
              <button
                className="btn xl"
                onClick={() => {
                  play('click');
                  store.continueRun();
                }}
              >
                <Icon name="arrowRight" /> Continue · Day {save.day} · {fmtMoney(save.wealthCents, { decimals: false })}
              </button>
            )}
          </div>
        </div>

        <div className="howto">
          {presentation.howToPlay.map((h) => (
            <div key={h.title} className="howto-card">
              <span className="howto-icon"><Icon name={h.icon} size={22} /></span>
              <b>{h.title}</b>
              <p>{h.text}</p>
            </div>
          ))}
        </div>
        <p className="legal">Play money, fictional companies, fictional events. Not financial advice. Please do not take trading tips from Uncle Gerald.</p>
      </div>
    </div>
  );
}
