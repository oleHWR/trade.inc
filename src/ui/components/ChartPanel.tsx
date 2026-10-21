import { useMemo, useState } from 'react';
import { CONTENT } from '../../content';
import { fmtPrice } from '../../engine/money';
import { useElementSize, useGame } from '../hooks';
import { changeSinceStart, dayLabel, mentionedAssets } from '../util';
import { AssetBadge, Signed } from './shared';

const M = { l: 58, r: 74, t: 14, b: 26 };

export function ChartPanel({ assetId }: { assetId: string }) {
  const g = useGame();
  const s = g.state!;
  const asset = CONTENT.assetById.get(assetId)!;
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [range, setRange] = useState<'all' | '20'>('all');
  const [hover, setHover] = useState<number | null>(null);
  const hist = s.history[assetId];
  const now = Math.max(s.clockDays, s.timeDays);
  const price = s.prices[assetId];
  const long = s.longs[assetId];
  const short = s.shorts[assetId];
  const entry = long ? long.costCents / long.qty : short ? short.proceedsCents / short.qty : null;

  const xMax = Math.max(range === 'all' ? 20 : 20, Math.ceil(now / 5) * 5);
  const xMin = range === 'all' ? 0 : Math.max(0, now - 20);
  const xHi = range === 'all' ? xMax : Math.max(20, now + 1);
  const visible = hist.filter((p) => p[0] >= xMin - 0.5);
  const events = useMemo(
    () => s.instances.filter((i) => mentionedAssets(CONTENT.eventById.get(i.eventId)!).some((a) => a.id === assetId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.instances.length, assetId],
  );

  const W = size.w;
  const H = size.h;
  const pw = Math.max(10, W - M.l - M.r);
  const ph = Math.max(10, H - M.t - M.b);
  let lo = Math.min(...visible.map((p) => p[1]), asset.startingPriceCents);
  let hi = Math.max(...visible.map((p) => p[1]), asset.startingPriceCents);
  if (entry) {
    lo = Math.min(lo, entry);
    hi = Math.max(hi, entry);
  }
  const pad = (hi - lo) * 0.12 || hi * 0.05;
  lo = Math.max(0, lo - pad);
  hi += pad;
  const X = (d: number) => M.l + ((d - xMin) / (xHi - xMin)) * pw;
  const Y = (p: number) => M.t + (1 - (p - lo) / (hi - lo)) * ph;

  const line = visible.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  const lastX = visible.length ? X(visible[visible.length - 1][0]) : M.l;
  const area = visible.length ? `${line}L${lastX.toFixed(1)} ${M.t + ph}L${X(visible[0][0]).toFixed(1)} ${M.t + ph}Z` : '';
  const up = price >= asset.startingPriceCents;
  const color = up ? 'var(--up)' : 'var(--down)';
  const yTicks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * i) / 4);
  const step = xHi - xMin > 60 ? 20 : xHi - xMin > 30 ? 10 : 5;
  const xTicks: number[] = [];
  for (let d = Math.ceil(xMin / step) * step; d <= xHi; d += step) xTicks.push(d);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const day = xMin + ((e.clientX - rect.left - M.l) / pw) * (xHi - xMin);
    setHover(day);
  };
  let hp: [number, number] | null = null;
  if (hover !== null) {
    let best = visible[0];
    for (const p of visible) if (Math.abs(p[0] - hover) < Math.abs(best[0] - hover)) best = p;
    hp = best ?? null;
  }
  const gradId = `grad-${assetId}`;

  return (
    <section className="panel chart">
      <div className="panel-head">
        <div className="chart-title">
          <AssetBadge asset={asset} size={30} />
          <h2>{asset.name}</h2>
          <span className="muted">{asset.id} · {asset.sector}{asset.unit ? ` · ${asset.unit}` : ''}</span>
        </div>
        <div className="head-right">
          <b className="chart-price">{fmtPrice(price)}</b>
          <Signed value={changeSinceStart(s, assetId)} />
          <div className="seg small" role="group" aria-label="Chart range">
            <button className={range === 'all' ? 'on' : ''} onClick={() => setRange('all')}>All</button>
            <button className={range === '20' ? 'on' : ''} onClick={() => setRange('20')}>20 d</button>
          </div>
        </div>
      </div>
      <div className="chart-body" ref={ref}>
        <svg width={W} height={H} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={`${asset.name} price chart`}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.32" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} className="c-grid" />
              <text x={M.l - 8} y={Y(t) + 4} textAnchor="end" className="c-label">{fmtPrice(Math.round(t))}</text>
            </g>
          ))}
          {xTicks.map((d) => (
            <g key={d}>
              <line x1={X(d)} x2={X(d)} y1={M.t} y2={M.t + ph} className="c-grid v" />
              <text x={X(d)} y={H - 8} textAnchor="middle" className="c-label">{`Day ${Math.max(1, d)}`}</text>
            </g>
          ))}
          <line x1={M.l} x2={W - M.r} y1={Y(asset.startingPriceCents)} y2={Y(asset.startingPriceCents)} className="c-start" />
          <text x={W - M.r + 6} y={Y(asset.startingPriceCents) + 4} className="c-label dim">start</text>
          {entry && (
            <g>
              <line x1={M.l} x2={W - M.r} y1={Y(entry)} y2={Y(entry)} className="c-entry" />
              <text x={W - M.r + 6} y={Y(entry) + 4} className="c-label entry">{short ? 'short @' : 'avg @'}</text>
            </g>
          )}
          {area && <path d={area} fill={`url(#${gradId})`} />}
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          {events.map((i) => {
            if (i.publishedDay < xMin) return null;
            const x = X(i.publishedDay);
            const def = CONTENT.eventById.get(i.eventId)!;
            return (
              <g key={i.id} className="c-event">
                <line x1={x} x2={x} y1={M.t} y2={M.t + ph} />
                <path d={`M${x} ${M.t + ph + 2}l5 7h-10z`} />
                <title>{`${dayLabel(i.publishedDay)}: ${def.headline}`}</title>
              </g>
            );
          })}
          {visible.length > 0 && (
            <g>
              <circle cx={lastX} cy={Y(price)} r="4.5" fill={color} />
              <circle cx={lastX} cy={Y(price)} r="9" fill={color} opacity="0.25" className="pulse-dot" />
              <rect x={W - M.r + 3} y={Y(price) - 10} width={M.r - 6} height={20} rx="5" fill={color} />
              <text x={W - M.r + 3 + (M.r - 6) / 2} y={Y(price) + 4} textAnchor="middle" className="c-tag">{fmtPrice(price)}</text>
            </g>
          )}
          {hp && (
            <g className="c-hover">
              <line x1={X(hp[0])} x2={X(hp[0])} y1={M.t} y2={M.t + ph} />
              <circle cx={X(hp[0])} cy={Y(hp[1])} r="4" />
              <g transform={`translate(${Math.min(W - M.r - 118, Math.max(M.l + 4, X(hp[0]) + 10))},${Math.max(M.t + 4, Y(hp[1]) - 44)})`}>
                <rect width="112" height="38" rx="7" />
                <text x="9" y="16">{dayLabel(hp[0])}</text>
                <text x="9" y="31" className="b">{fmtPrice(hp[1])}</text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
