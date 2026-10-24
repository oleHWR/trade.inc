/** Small stroke icon set (24x24). Replaces emoji so the game looks the same on every OS. */
const PATHS: Record<string, JSX.Element> = {
  play: <path d="M7 5v14l11-7z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>,
  volume: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9l5 6M21 9l-5 6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" />,
  more: <><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></>,
  save: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></>,
  restart: <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v5h5" /></>,
  map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  news: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 12h10M7 15h10" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.5" /><circle cx="12" cy="17" r="0.9" fill="currentColor" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4" /></>,
  alert: <><path d="M12 3l10 17H2z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.9" fill="currentColor" /></>,
  signal: <><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M8 8a5.5 5.5 0 0 0 0 8M16 8a5.5 5.5 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  pen: <><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></>,
  cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 9v6M18 9v6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M7 15l4-4 3 3 5-6" /></>,
  bank: <><path d="M3 9l9-5 9 5z" /><path d="M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18" /></>,
  swap: <><path d="M4 8h14l-3-3M20 16H6l3 3" /></>,
  rocket: <><path d="M12 3c4 2 6 6 5 11l-3 3h-4l-3-3c-1-5 1-9 5-11z" /><circle cx="12" cy="10" r="2" /><path d="M8 17l-2 4 4-1M16 17l2 4-4-1" /></>,
  coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.7-2.7-3-6-3" /></>,
  bear: <><circle cx="12" cy="13" r="7" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="6.5" r="2.5" /><circle cx="12" cy="15" r="2" /></>,
  bandage: <><rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-35 12 12)" /><path d="M10 11h.01M14 11h.01M10 13.5h.01M14 13.5h.01" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  basket: <><path d="M3 10h18l-2 10H5z" /><path d="M8 10l4-6 4 6M9 14v3M15 14v3" /></>,
  diamond: <><path d="M6 4h12l4 5-10 12L2 9z" /><path d="M2 9h20M9 4l3 17M15 4l-3 17" /></>,
  sunglasses: <><path d="M2 9h20" /><path d="M3 9l1 5a3 3 0 0 0 6 0l1-5M13 9l1 5a3 3 0 0 0 6 0l1-5" /></>,
  skull: <><path d="M5 11a7 7 0 1 1 14 0v3l-2 2v3H7v-3l-2-2z" /><circle cx="9" cy="12" r="1.6" fill="currentColor" /><circle cx="15" cy="12" r="1.6" fill="currentColor" /><path d="M10 19v-2M14 19v-2" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className = '', title }: { name: string; size?: number; className?: string; title?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name] ?? PATHS.help}
    </svg>
  );
}
