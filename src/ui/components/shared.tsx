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

export function Avatar({ who, size = 40 }: { who: CharacterId; size?: number }) {
  const c = presentation.characters[who];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.56, background: `radial-gradient(circle at 30% 25%, ${c.color}55, ${c.color}18)`, borderColor: `${c.color}88` }}
      title={`${c.name} - ${c.role}`}
    >
      {c.avatar}
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
