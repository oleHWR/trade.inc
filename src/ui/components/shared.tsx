import { memo } from 'react';
import { presentation } from '../../content';
import type { Asset, CharacterId } from '../../engine/types';
import { CATEGORY_COLOR } from '../util';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#3ddc97" />
          <stop offset="1" stopColor="#6c9cff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0f1524" />
      <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" fill="none" stroke="url(#lg)" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M12 44 L25 30 L34 38 L52 16" stroke="url(#lg)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="16" r="4.5" fill="#3ddc97" />
    </svg>
  );
}

const SKIN = '#f2c7a5';

/** Drawn character portraits (64x64). */
function Face({ who }: { who: CharacterId }) {
  const eyes = (y = 33, gap = 7) => (
    <>
      <circle cx={32 - gap} cy={y} r="2" fill="#2a2230" />
      <circle cx={32 + gap} cy={y} r="2" fill="#2a2230" />
    </>
  );
  switch (who) {
    case 'mom':
      return (
        <>
          <circle cx="32" cy="13" r="7" fill="#c9cdd6" />
          <path d="M13 38c0-14 8-22 19-22s19 8 19 22c-3-5-6-9-6-13-6 3-17 3-26 0 0 4-3 8-6 13z" fill="#c9cdd6" />
          <ellipse cx="32" cy="36" rx="14" ry="15" fill={SKIN} />
          <path d="M18 31c4-9 24-9 28 0-6-4-22-4-28 0z" fill="#c9cdd6" />
          {eyes(36, 6)}
          <circle cx="22" cy="41" r="3" fill="#ff9ec7" opacity="0.5" />
          <circle cx="42" cy="41" r="3" fill="#ff9ec7" opacity="0.5" />
          <path d="M27 44q5 4 10 0" stroke="#a04060" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="18" cy="42" r="1.8" fill="#ffd36b" />
          <circle cx="46" cy="42" r="1.8" fill="#ffd36b" />
        </>
      );
    case 'dad':
      return (
        <>
          <ellipse cx="32" cy="35" rx="15" ry="17" fill={SKIN} />
          <path d="M17 33c-1-6 1-9 3-10v9zM47 33c1-6-1-9-3-10v9z" fill="#6b5a4a" />
          <circle cx="25" cy="33" r="5" fill="none" stroke="#2a2230" strokeWidth="1.8" />
          <circle cx="39" cy="33" r="5" fill="none" stroke="#2a2230" strokeWidth="1.8" />
          <path d="M30 33h4" stroke="#2a2230" strokeWidth="1.8" />
          {eyes(33, 7)}
          <path d="M23 43c3-3 6-2 9-1 3-1 6-2 9 1-3 1-6 2-9 1-3 1-6 0-9-1z" fill="#6b5a4a" />
          <path d="M28 47h8" stroke="#8a4a3a" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 25q3-2 6 0M36 25q3-2 6 0" stroke="#6b5a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
    case 'chad':
      return (
        <>
          <ellipse cx="32" cy="36" rx="14" ry="16" fill={SKIN} />
          <path d="M17 30c-1-12 9-19 20-17 6 1 10 5 10 11-5-6-13-4-18-2-5 1-9 3-12 8z" fill="#e0b040" />
          <path d="M37 13c6-3 11 0 12 5-3-2-7-2-10-1z" fill="#e0b040" />
          <rect x="18" y="31" width="12" height="7" rx="3" fill="#14121f" />
          <rect x="34" y="31" width="12" height="7" rx="3" fill="#14121f" />
          <path d="M30 33h4" stroke="#14121f" strokeWidth="2" />
          <path d="M21 33h5" stroke="#7cc8ff" strokeWidth="1.2" opacity="0.8" />
          <path d="M27 45q6 3 10-2" stroke="#7a3a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );
    case 'gerald':
      return (
        <>
          <ellipse cx="32" cy="35" rx="14" ry="16" fill={SKIN} />
          <path d="M18 38c0 10 6 17 14 17s14-7 14-17c-3 4-6 5-9 4-3 3-7 3-10 0-3 1-6 0-9-4z" fill="#8a6a4a" />
          <path d="M26 44q6-3 12 0" stroke="#6b4e34" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M15 26c2-9 10-13 18-13s15 4 17 12c-10-3-25-3-35 1z" fill="#4f6b3a" />
          <path d="M14 27c10-4 26-4 37-1" stroke="#3a522a" strokeWidth="3" strokeLinecap="round" />
          <path d="M21 30l6 1M37 31l6-1" stroke="#6b4e34" strokeWidth="2.2" strokeLinecap="round" />
          {eyes(34, 7)}
          <circle cx="39" cy="34" r="4.5" fill="none" stroke="#c9a040" strokeWidth="1.5" />
        </>
      );
  }
}

export function Avatar({ who, size = 40 }: { who: CharacterId; size?: number }) {
  const c = presentation.characters[who];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, ${c.color}55, ${c.color}18)`, borderColor: `${c.color}88` }}
      title={`${c.name} - ${c.role}`}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <Face who={who} />
      </svg>
    </span>
  );
}

export const AssetBadge = memo(function AssetBadge({ asset, size = 34 }: { asset: Asset; size?: number }) {
  const color = CATEGORY_COLOR[asset.category];
  return (
    <span className="asset-badge" style={{ width: size, height: size, color, background: `${color}1c`, borderColor: `${color}55`, fontSize: size * 0.3 }}>
      {asset.id.slice(0, 4)}
    </span>
  );
});

export const Sparkline = memo(function Sparkline({ points, up, w = 70, h = 24 }: { points: number[]; up: boolean; w?: number; h?: number }) {
  if (points.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${((i / (points.length - 1)) * w).toFixed(1)} ${(h - 2 - ((p - min) / span) * (h - 4)).toFixed(1)}`).join('');
  return (
    <svg width={w} height={h} className={up ? 'spark up' : 'spark down'} aria-hidden="true">
      <path d={d} fill="none" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});

export function Signed({ value, digits = 1, className = '' }: { value: number; digits?: number; className?: string }) {
  const v = value * 100;
  const cls = Math.abs(v) < 0.05 ? 'flat' : v > 0 ? 'pos' : 'neg';
  const arrow = Math.abs(v) < 0.05 ? '' : v > 0 ? '▲ ' : '▼ ';
  return (
    <span className={`signed ${cls} ${className}`}>
      {arrow}
      {v > 0 ? '+' : ''}
      {v.toFixed(digits)}%
    </span>
  );
}
