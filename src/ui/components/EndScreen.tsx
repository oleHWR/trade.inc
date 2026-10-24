import { useMemo, useState } from 'react';
import { presentation } from '../../content';
import { ACHIEVEMENTS } from '../../engine/achievements';
import { displayDay } from '../../engine/engine';
import { fmtMoney } from '../../engine/money';
import { useGame } from '../hooks';
import { play } from '../sound';
import { store } from '../store';
import { Icon } from './icons';

function Car() {
  return (
    <svg viewBox="0 0 420 210" className="car" role="img" aria-label="A luxury sports car at sunrise">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1b4b" />
          <stop offset="0.55" stopColor="#ff7e5f" />
          <stop offset="1" stopColor="#ffd36b" />
        </linearGradient>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4f6d" />
          <stop offset="1" stopColor="#a3122f" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe6ff" />
          <stop offset="1" stopColor="#4f7fb0" />
        </linearGradient>
      </defs>
      <rect width="420" height="210" rx="18" fill="url(#sky)" />
      <circle cx="320" cy="118" r="46" fill="#fff3b0" opacity="0.9" />
      <circle cx="320" cy="118" r="70" fill="#fff3b0" opacity="0.15" />
      <path d="M0 140 L60 108 L110 132 L170 96 L230 134 L290 104 L360 136 L420 112 V210 H0Z" fill="#2a1f4e" opacity="0.8" />
      <rect y="152" width="420" height="58" fill="#1b1730" />
      <path d="M0 176 H420" stroke="#3b3560" strokeWidth="2" strokeDasharray="22 16" />
      <g className="car-body">
        <ellipse cx="215" cy="178" rx="150" ry="9" fill="#000" opacity="0.35" />
        <path d="M60 160 C58 140 82 130 118 124 L160 100 C182 86 232 84 262 90 L300 112 C338 116 368 128 370 150 L370 162 C370 168 366 170 360 170 H72 C64 170 60 166 60 160Z" fill="url(#body)" />
        <path d="M168 104 C186 94 226 92 252 97 L285 114 H150Z" fill="url(#glass)" />
        <path d="M222 96 L226 114" stroke="#a3122f" strokeWidth="3" />
        <rect x="334" y="136" width="30" height="9" rx="4" fill="#fff6b8" />
        <rect x="66" y="140" width="18" height="8" rx="3" fill="#ffb3b3" />
        <rect x="205" y="150" width="62" height="14" rx="3" fill="#f5f0e0" />
        <text x="236" y="161" textAnchor="middle" fontSize="9" fontWeight="800" fill="#222" fontFamily="monospace">NO BOSS</text>
        {[116, 304].map((x) => (
          <g key={x}>
            <circle cx={x} cy="168" r="23" fill="#14121f" />
            <circle cx={x} cy="168" r="13" fill="#c9cfdd" />
            <circle cx={x} cy="168" r="5" fill="#14121f" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 3,
        dur: 3 + Math.random() * 3,
        color: ['#3ddc97', '#6c9cff', '#ffb454', '#ff5d73', '#b794ff'][i % 5],
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, background: b.color, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}

export function EndScreen() {
  const g = useGame();
  const s = g.state!;
  const [signed, setSigned] = useState(false);
  const o = s.outcome!;
  const won = s.status === 'won';
  const reason = presentation.reasons[o.kind as 'bankrupt' | 'checkpoint' | 'deadline'];
  const bestTrade = s.trades.reduce((m, t) => (t.realizedCents !== null && t.realizedCents > m ? t.realizedCents : m), 0);
  const stats: [string, string][] = [
    ['Final wealth', fmtMoney(o.wealthCents, { decimals: false })],
    ['Reached', `Day ${displayDay(s, o.timeDays)} of ${s.settings.gameDays}`],
    ['Peak wealth', fmtMoney(s.peakWealthCents, { decimals: false })],
    ['Realised P/L', fmtMoney(s.realizedCents, { sign: true, decimals: false })],
    ['Best trade', bestTrade > 0 ? fmtMoney(bestTrade, { sign: true, decimals: false }) : '-'],
    ['Reviews passed', `${s.checkpointResults.filter((c) => c.passed).length} / ${s.settings.checkpoints.length}`],
    ['Trophies', `${s.achievements.length} / ${ACHIEVEMENTS.length}`],
    ['Stories read', `${s.instances.filter((i) => i.read).length} / ${s.instances.length}`],
  ];
  const P = won ? presentation.win : presentation.lose;
  return (
    <div className={`end-screen ${won ? 'win' : 'lose'}`} role="dialog" aria-modal="true" aria-label={P.title}>
      {won && <Confetti />}
      <div className="end-card">
        <div className="end-kicker">{won ? <><Icon name="flag" /> Run complete</> : <><Icon name="skull" /> Run over</>}</div>
        <h1>{P.title}</h1>
        <p className="end-reason">
          {won ? `You reached ${fmtMoney(o.wealthCents, { decimals: false })} on day ${displayDay(s, o.timeDays)}.` : reason}
          {!won && o.requiredCents !== null && o.kind !== 'bankrupt' && (
            <>
              {' '}Needed <b>{fmtMoney(o.requiredCents, { decimals: false })}</b>, had <b>{fmtMoney(o.wealthCents, { decimals: false })}</b>.
            </>
          )}
        </p>
        <div className="end-stats">
          {stats.map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>

        {won ? (
          <div className="scene">
            <Car />
            <div className="scene-text">
              {presentation.win.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
              <p className="car-name">Your new ride: <b>{presentation.win.carName}</b></p>
            </div>
          </div>
        ) : (
          <div className="scene">
            <div className="contract">
              <div className="contract-head">
                <b>{presentation.lose.company}</b>
                <span>Offer of employment</span>
              </div>
              <p className="contract-pos">Position: <b>{presentation.lose.position}</b></p>
              <p className="contract-pay">Pay: $2.13 / hour + "all the fries you can smell"</p>
              <ul>
                {presentation.lose.clauses.map((c) => (
                  <li key={c} className={signed ? 'ticked' : ''}>{c}</li>
                ))}
              </ul>
              <div className="sign-row">
                <span className="sign-label">Signature</span>
                <div className="signature-line">
                  {signed ? <span className="signature">Aspiring Trader</span> : <button className="btn" onClick={() => { play('click'); setSigned(true); }}><Icon name="pen" /> Sign here</button>}
                  {signed && <span className="stamp">HIRED</span>}
                </div>
              </div>
            </div>
            <div className="scene-text">
              {presentation.lose.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
        )}

        <div className="end-actions">
          <button className="btn primary xl" onClick={() => store.newRun(false)}>
            <Icon name="restart" /> New run
          </button>
          <button className="btn xl" onClick={() => store.toTitle()}>Title screen</button>
        </div>
      </div>
    </div>
  );
}
