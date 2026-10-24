import { useEffect, useState } from 'react';
import { presentation } from '../../content';
import { useGame } from '../hooks';
import { play } from '../sound';
import { store } from '../store';
import { fmtMoney } from '../../engine/money';
import type { CharacterId } from '../../engine/types';
import { Avatar } from './shared';
import { Icon } from './icons';

export function Cutscene() {
  const g = useGame();
  const s = g.state!;
  const lines = presentation.intro as { who: CharacterId; text: string }[];
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(0);
  const line = lines[Math.min(i, lines.length - 1)];
  const done = typed >= line.text.length;
  const last = i >= lines.length - 1;

  useEffect(() => {
    setTyped(0);
    const id = setInterval(() => setTyped((t) => Math.min(line.text.length, t + 2)), 22);
    return () => clearInterval(id);
  }, [i, line.text.length]);

  const next = () => {
    play('click');
    if (!done) return setTyped(line.text.length);
    if (last) return store.startPlaying();
    setI(i + 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const c = presentation.characters[line.who];
  return (
    <div className="cutscene" onClick={next}>
      <div className="cut-bg" aria-hidden="true" />
      <div className="cut-stage">
        <div className="cut-chips">
          <span><Icon name="cash" /> Start {fmtMoney(s.settings.startingCashCents, { decimals: false })}</span>
          <span><Icon name="flag" /> Goal {fmtMoney(s.settings.targetWealthCents, { decimals: false })}</span>
          <span><Icon name="calendar" /> {s.settings.gameDays} days · {Math.round(s.settings.durationSeconds / 60)} min</span>
        </div>
        <div className="cut-box" key={i}>
          <Avatar who={line.who} size={96} />
          <div className="cut-text">
            <div className="cut-name" style={{ color: c.color }}>{c.name} <small>{c.role}</small></div>
            <p>
              {line.text.slice(0, typed)}
              <span className="caret" />
            </p>
            <div className="cut-foot">
              <span className="dots">{lines.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}</span>
              <span className="muted small">Click or press Enter</span>
              <button
                className="btn primary"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
              >
                {done && last ? <>Start trading <Icon name="play" /></> : 'Next ▸'}
              </button>
            </div>
          </div>
        </div>
        <button
          className="skip"
          onClick={(e) => {
            e.stopPropagation();
            store.startPlaying();
          }}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
