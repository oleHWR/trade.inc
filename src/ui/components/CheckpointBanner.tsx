import { useState } from 'react';
import { totalWealth } from '../../engine/accounting';
import { secondsPerDay } from '../../engine/engine';
import { fmtClock, fmtMoney } from '../../engine/money';
import { useGame } from '../hooks';
import { Avatar } from './shared';

export function CheckpointBanner() {
  const g = useGame();
  const s = g.state!;
  const S = s.settings;
  const [open, setOpen] = useState(false);
  const wealth = totalWealth(s);
  const next = S.checkpoints[s.checkpointResults.length];
  const target = next ? next.minimumWealthCents : S.targetWealthCents;
  const dayAt = next ? next.day : S.gameDays;
  const secs = Math.max(0, ((dayAt - s.clockDays) * secondsPerDay(s)) / g.speed);
  const ok = wealth >= target;
  const diff = wealth - target;
  const ratio = Math.max(0, Math.min(1, wealth / target));
  const urgent = next && !ok && secs < 15;

  return (
    <section className={`checkpoint ${ok ? 'ok' : 'warn'} ${urgent ? 'urgent' : ''}`}>
      <div className="cp-main">
        <Avatar who={next && next.day % 20 === 0 ? 'dad' : 'mom'} size={36} />
        <div className="cp-text">
          <div className="cp-title">
            {next ? <>Parents' next review · <b>Day {next.day}</b></> : <>Final deadline · <b>Day {S.gameDays}</b></>}
          </div>
          <button className="cp-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? '▾' : '▸'} Survival checkpoints
          </button>
        </div>
        <div className="cp-bar-wrap">
          <div className="cp-bar" aria-hidden="true">
            <i style={{ width: `${ratio * 100}%` }} />
          </div>
          <span className="cp-diff">
            {ok ? `${fmtMoney(diff, { decimals: false })} above the line` : `${fmtMoney(-diff, { decimals: false })} to go`}
          </span>
        </div>
        <div className="cp-right">
          <b>{fmtMoney(target, { decimals: false })} {next ? 'minimum' : 'to win'}</b> · in {fmtClock(secs)}
        </div>
      </div>
      {open && (
        <div className="cp-list">
          {S.checkpoints.map((c) => {
            const r = s.checkpointResults.find((x) => x.day === c.day);
            return (
              <span key={c.day} className={`chip ${r ? (r.passed ? 'pass' : 'fail') : ''}`}>
                {r ? (r.passed ? '✓' : '✗') : '○'} Day {c.day}: {fmtMoney(c.minimumWealthCents, { decimals: false })}
              </span>
            );
          })}
          <span className="chip goal">🏁 Day {S.gameDays}: {fmtMoney(S.targetWealthCents, { decimals: false })} to win</span>
          <span className="cp-note">Pass each check once. Dipping afterwards is fine. Reaching the goal early wins instantly.</span>
        </div>
      )}
    </section>
  );
}
