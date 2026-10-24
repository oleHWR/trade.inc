import { useState } from 'react';
import { CONTENT, presentation } from '../../content';
import { ACHIEVEMENTS } from '../../engine/achievements';
import { availableCash, longValue, totalCoverCost, totalWealth, unrealizedLong, unrealizedShort } from '../../engine/accounting';
import { chadWealthCents } from '../../engine/rival';
import { fmtCompact, fmtMoney, fmtPrice } from '../../engine/money';
import { useElementSize, useGame } from '../hooks';
import { store } from '../store';
import { CATEGORY_COLOR, TAG_COLOR, dayLabel } from '../util';
import { Avatar, AssetBadge } from './shared';
import { Icon } from './icons';

const M = { l: 56, r: 16, t: 14, b: 26 };

export function NetWorthPanel() {
  const g = useGame();
  const s = g.state!;
  const S = s.settings;
  const [ref, size] = useElementSize<HTMLDivElement>();
  const W = size.w;
  const H = size.h;
  const pw = Math.max(10, W - M.l - M.r);
  const ph = Math.max(10, H - M.t - M.b);
  const lo = 10_000_00; // $10k
  const hi = S.targetWealthCents * 1.15;
  const X = (d: number) => M.l + (d / S.gameDays) * pw;
  const Y = (v: number) => M.t + (1 - (Math.log(Math.max(v, lo)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * ph;
  const hist = s.wealthHistory;
  const line = hist.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  const chad: string[] = [];
  const nowDay = Math.max(s.clockDays, 0.01);
  for (let d = 0; d <= nowDay + 0.01; d += 1) chad.push(`${d === 0 ? 'M' : 'L'}${X(d).toFixed(1)} ${Y(chadWealthCents(s.seed, d, S.gameDays)).toFixed(1)}`);
  const chadNow = chadWealthCents(s.seed, nowDay, S.gameDays);
  const wealth = totalWealth(s);
  const ahead = wealth - chadNow;
  const ticks = [10_000_00, 25_000_00, 100_000_00, 250_000_00, 1_000_000_00 / 1];
  return (
    <section className="panel networth">
      <div className="panel-head">
        <h2>You vs. Chad</h2>
        <div className="head-right legend">
          <span><i style={{ background: 'var(--accent)' }} />You</span>
          <span><i style={{ background: 'var(--purple)' }} />Chad</span>
          <span><i style={{ background: 'var(--amber)' }} />Parent reviews</span>
        </div>
      </div>
      <div className="nw-body" ref={ref}>
        <svg width={W} height={H} role="img" aria-label="Wealth over time compared with your rival">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} className="c-grid" />
              <text x={M.l - 8} y={Y(t) + 4} textAnchor="end" className="c-label">{fmtCompact(t)}</text>
            </g>
          ))}
          {[0, 20, 40, 60, 80, 100].map((d) => <text key={d} x={X(d)} y={H - 8} textAnchor="middle" className="c-label">{`Day ${Math.max(1, d)}`}</text>)}
          <line x1={M.l} x2={W - M.r} y1={Y(S.targetWealthCents)} y2={Y(S.targetWealthCents)} className="c-goal" />
          <text x={W - M.r - 4} y={Y(S.targetWealthCents) - 6} textAnchor="end" className="c-label goal">Goal $1M</text>
          <path d={chad.join('')} fill="none" stroke="var(--purple)" strokeWidth="1.8" strokeDasharray="5 4" opacity="0.9" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" />
          {S.checkpoints.map((c) => {
            const r = s.checkpointResults.find((x) => x.day === c.day);
            return (
              <g key={c.day}>
                <path d={`M${X(c.day)} ${Y(c.minimumWealthCents) - 6}l6 6l-6 6l-6 -6z`} fill={r ? (r.passed ? 'var(--up)' : 'var(--down)') : 'var(--amber)'} />
                <title>{`Day ${c.day}: ${fmtMoney(c.minimumWealthCents)}`}</title>
              </g>
            );
          })}
          <circle cx={X(nowDay)} cy={Y(wealth)} r="4.5" fill="var(--accent)" />
        </svg>
      </div>
      <div className="nw-foot">
        <Avatar who="chad" size={26} />
        <span>
          {ahead >= 0 ? <>You are <b className="pos">{fmtCompact(ahead)} ahead</b> of Chad.</> : <>Chad is <b className="neg">{fmtCompact(-ahead)} ahead</b>. He will mention it.</>}
        </span>
      </div>
    </section>
  );
}

export function SidePanel({ onNews }: { onNews: (id: number) => void }) {
  const g = useGame();
  const [tab, setTab] = useState<'portfolio' | 'log' | 'trophies'>('portfolio');
  const s = g.state!;
  return (
    <section className="panel side">
      <div className="tabs big" role="tablist">
        <button role="tab" aria-selected={tab === 'portfolio'} className={tab === 'portfolio' ? 'on' : ''} onClick={() => setTab('portfolio')}>Portfolio</button>
        <button role="tab" aria-selected={tab === 'log'} className={tab === 'log' ? 'on' : ''} onClick={() => setTab('log')}>Activity</button>
        <button role="tab" aria-selected={tab === 'trophies'} className={tab === 'trophies' ? 'on' : ''} onClick={() => setTab('trophies')}>Trophies {s.achievements.length}/{ACHIEVEMENTS.length}</button>
      </div>
      {tab === 'portfolio' && <Portfolio />}
      {tab === 'log' && <ActivityLog onNews={onNews} />}
      {tab === 'trophies' && <Trophies />}
    </section>
  );
}

function Portfolio() {
  const g = useGame();
  const s = g.state!;
  const cash = availableCash(s);
  const longs = longValue(s);
  const wealth = totalWealth(s);
  const rows = [...Object.keys(s.longs), ...Object.keys(s.shorts)];
  const parts: { label: string; value: number; color: string }[] = [{ label: 'Cash', value: Math.max(0, cash), color: '#7d8aa5' }];
  for (const cat of ['stock', 'commodity', 'crypto', 'forex']) {
    const v = rows.filter((id) => CONTENT.assetById.get(id)!.category === cat).reduce((a, id) => a + (s.longs[id] ? s.longs[id].qty * s.prices[id] : 0), 0);
    if (v > 0) parts.push({ label: cat, value: v, color: CATEGORY_COLOR[cat] });
  }
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className="side-body">
      <div className="alloc" aria-label="Allocation">
        {parts.map((p) => <i key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label}: ${fmtMoney(p.value)}`} />)}
      </div>
      <div className="alloc-legend">
        {parts.map((p) => <span key={p.label}><i style={{ background: p.color }} />{p.label} {((p.value / total) * 100).toFixed(0)}%</span>)}
        <span className="muted">Realised {fmtMoney(s.realizedCents, { sign: true, decimals: false })}</span>
      </div>
      <div className="stats-row">
        <span>Invested <b>{fmtMoney(longs, { decimals: false })}</b></span>
        <span>Short liability <b>{fmtMoney(totalCoverCost(s), { decimals: false })}</b></span>
        <span>Wealth <b>{fmtMoney(wealth, { decimals: false })}</b></span>
      </div>
      {rows.length === 0 ? (
        <p className="muted pad">Nothing held. All of your wealth is cash. Safe. Boring. Mom approves.</p>
      ) : (
        <table className="ptable">
          <thead>
            <tr><th>Asset</th><th>Side</th><th>Qty</th><th>Price</th><th>P/L</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((id) => {
              const a = CONTENT.assetById.get(id)!;
              const isShort = !!s.shorts[id];
              const q = isShort ? s.shorts[id].qty : s.longs[id].qty;
              const pl = isShort ? unrealizedShort(s, id) : unrealizedLong(s, id);
              return (
                <tr key={id}>
                  <td><AssetBadge asset={a} size={22} /> {a.id}</td>
                  <td><span className={isShort ? 'side-short' : 'side-long'}>{isShort ? 'SHORT' : 'LONG'}</span></td>
                  <td>{q}</td>
                  <td>{fmtPrice(s.prices[id])}</td>
                  <td className={pl >= 0 ? 'pos' : 'neg'}>{fmtMoney(pl, { sign: true, decimals: false })}</td>
                  <td><button className="mini" disabled={s.status !== 'running'} onClick={() => store.trade(isShort ? 'cover' : 'sell', id, q)}>Close</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ActivityLog({ onNews }: { onNews: (id: number) => void }) {
  const g = useGame();
  const s = g.state!;
  const entries = [...s.log].reverse().slice(0, 60);
  return (
    <div className="side-body log">
      {entries.length === 0 && <p className="muted pad">Nothing yet. The world is suspiciously calm.</p>}
      {entries.map((l) => {
        const inst = l.eventInstanceId ? s.instances.find((i) => i.id === l.eventInstanceId) : null;
        return (
          <button key={l.id} className={`log-row k-${l.kind} ${l.tone ?? ''}`} disabled={!inst} onClick={() => inst && onNews(inst.id)}>
            <span className="log-day">{dayLabel(l.day)}</span>
            <span className="log-kind" style={inst ? { color: TAG_COLOR[inst.tag] } : undefined}>
              <Icon name={l.kind === 'news' ? 'news' : l.kind === 'trade' ? 'swap' : l.kind === 'liquidation' ? 'alert' : l.kind === 'checkpoint' ? 'bank' : l.kind === 'achievement' ? 'trophy' : 'more'} size={15} />
            </span>
            <span className="log-text">{l.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function Trophies() {
  const g = useGame();
  const s = g.state!;
  return (
    <div className="side-body trophies">
      {ACHIEVEMENTS.map((a) => {
        const got = s.achievements.includes(a.id);
        return (
          <div key={a.id} className={`trophy ${got ? 'got' : ''}`}>
            <span className="t-icon"><Icon name={got ? a.icon : 'lock'} size={22} /></span>
            <div>
              <b>{a.title}</b>
              <small>{a.description}</small>
            </div>
          </div>
        );
      })}
      <small className="muted pad">Characters: {Object.values(presentation.characters).map((c) => c.name).join(', ')}.</small>
    </div>
  );
}
