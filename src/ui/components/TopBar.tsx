import { useState } from 'react';
import { CONTENT, presentation } from '../../content';
import { availableCash, lockedProceeds, reservedCollateral, totalWealth } from '../../engine/accounting';
import { displayDay } from '../../engine/engine';
import { fmtClock, fmtCompact, fmtMoney } from '../../engine/money';
import { useGame, useTween } from '../hooks';
import { isMuted, setMuted } from '../sound';
import { store } from '../store';
import { Logo } from './shared';
import { Icon } from './icons';

export function TopBar({ theme, onTheme }: { theme: string; onTheme: () => void }) {
  const g = useGame();
  const s = g.state!;
  const S = s.settings;
  const wealth = totalWealth(s);
  const shown = useTween(wealth, 500);
  const [menu, setMenu] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const avail = availableCash(s);
  const locked = lockedProceeds(s) + reservedCollateral(s);
  const gain = wealth - S.startingCashCents;
  const goalPct = Math.max(0, Math.min(1, wealth / S.targetWealthCents));
  const dayPct = Math.min(1, s.clockDays / S.gameDays);
  const left = (S.durationSeconds - s.activeSeconds) / g.speed;
  const paused = s.status === 'paused';
  const ended = s.status === 'won' || s.status === 'lost';

  return (
    <header className="topbar">
      <div className="brand">
        <Logo size={34} />
        <div>
          <div className="brand-name">{presentation.brand.name}</div>
          <div className="brand-tag">{presentation.brand.tagline}</div>
        </div>
      </div>

      <div className="stat stat-wealth">
        <span className="stat-label">Total wealth</span>
        <span className="stat-value big">{fmtMoney(Math.round(shown), { decimals: false })}</span>
        <span className={gain >= 0 ? 'stat-sub pos' : 'stat-sub neg'}>
          {gain >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(gain), { decimals: false })} since day 1
        </span>
        <div className="goal-bar" title={`Goal ${fmtMoney(S.targetWealthCents)}`}>
          <i style={{ width: `${goalPct * 100}%` }} />
        </div>
        <span className="stat-goal">Goal {fmtCompact(S.targetWealthCents)} · {(goalPct * 100).toFixed(goalPct < 0.1 ? 1 : 0)}%</span>
      </div>

      <div className="stat">
        <span className="stat-label">Available cash</span>
        <span className="stat-value">{fmtMoney(avail, { decimals: false })}</span>
        <span className="stat-sub" title="Short-sale proceeds and collateral stay locked until you cover the short.">
          {locked > 0 ? `${fmtMoney(locked, { decimals: false })} locked by shorts` : 'Cash + investments counted in wealth'}
        </span>
      </div>

      <div className="stat stat-day">
        <span className="stat-label">Time to financial freedom</span>
        <div className="stat-day-row">
          <span className="stat-value">
            Day {displayDay(s)} <small>/ {S.gameDays}</small>
          </span>
          <span className="stat-time">{fmtClock(left)} left</span>
        </div>
        <div className="day-bar" role="progressbar" aria-valuemin={0} aria-valuemax={S.gameDays} aria-valuenow={Math.floor(s.clockDays)}>
          <i style={{ width: `${dayPct * 100}%` }} />
          {S.checkpoints.map((c, i) => {
            const res = s.checkpointResults.find((r) => r.day === c.day);
            return <b key={c.day} className={res ? (res.passed ? 'cp pass' : 'cp fail') : 'cp'} style={{ left: `${(c.day / S.gameDays) * 100}%` }} title={`Day ${c.day} review: ${fmtMoney(c.minimumWealthCents)}`} data-i={i} />;
          })}
        </div>
      </div>

      <div className="controls">
        <button className={paused ? 'btn primary' : 'btn'} onClick={() => store.togglePause()} disabled={ended} aria-label={paused ? 'Resume game' : 'Pause game'}>
          {paused ? <><Icon name="play" /> Resume</> : <><Icon name="pause" /> Pause</>}
        </button>
        <div className="seg" role="group" aria-label="Game speed">
          {[0.5, 1, 2, 4].map((x) => (
            <button key={x} className={g.speed === x ? 'on' : ''} onClick={() => store.setSpeed(x)} aria-pressed={g.speed === x} title={`${x}x speed`}>
              {x === 0.5 ? '½' : x}×
            </button>
          ))}
        </div>
        <button
          className="btn icon"
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          title={muted ? 'Sound off' : 'Sound on'}
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
        >
          <Icon name={muted ? 'mute' : 'volume'} size={18} />
        </button>
        <button className="btn icon" aria-label="Toggle light or dark theme" title="Theme" onClick={onTheme}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <div className="menu-wrap">
          <button className="btn icon" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <Icon name="more" size={18} />
          </button>
          {menu && (
            <div className="menu" onMouseLeave={() => setMenu(false)}>
              <button
                onClick={() => {
                  setMenu(false);
                  store.toTitle();
                }}
              >
                <Icon name="save" /> Save and exit
              </button>
              <button
                onClick={() => {
                  setMenu(false);
                  if (confirm('Restart? Your current run will be lost.')) store.newRun(false);
                }}
              >
                <Icon name="restart" /> Restart run
              </button>
              <span className="menu-note">{CONTENT.assets.length} assets · play money</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
