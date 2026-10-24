import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { CONTENT, presentation } from '../../content';
import { COUNTRY_PATHS, MAP_HEIGHT, MAP_WIDTH } from '../../content/worldMap';
import { displayDay, storyStillMoving } from '../../engine/engine';
import type { EventInstance } from '../../engine/types';
import { useGame } from '../hooks';
import { project } from '../mapProjection';
import { store } from '../store';
import { TAG_COLOR, TAG_GLYPH, TAG_LABEL, dayLabel, mentionedAssets } from '../util';
import { Avatar, AssetBadge } from './shared';
import { Icon } from './icons';

const MapBase = memo(function MapBase() {
  const lons = [-120, -60, 0, 60, 120];
  const lats = [60, 30, 0, -30];
  const gx = (lon: number) => ((lon + 180) / 360) * MAP_WIDTH;
  const gy = (lat: number) => project(lat, 0).y;
  return (
    <g>
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} className="map-sea" />
      {lons.map((l) => <line key={l} x1={gx(l)} x2={gx(l)} y1={0} y2={MAP_HEIGHT} className="map-grid" />)}
      {lats.map((l) => <line key={l} y1={gy(l)} y2={gy(l)} x1={0} x2={MAP_WIDTH} className="map-grid" />)}
      <line x1={0} x2={MAP_WIDTH} y1={gy(0)} y2={gy(0)} className="map-grid eq" />
      {COUNTRY_PATHS.map((d, i) => <path key={i} d={d} className="map-land" />)}
    </g>
  );
});

interface Cluster {
  x: number;
  y: number;
  items: EventInstance[];
}

function clusterize(items: EventInstance[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const inst of items) {
    const def = CONTENT.eventById.get(inst.eventId)!;
    if (def.location.kind !== 'map' || def.location.lat === null || def.location.lon === null) continue;
    const p = project(def.location.lat, def.location.lon);
    const hit = clusters.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < 34);
    if (hit) hit.items.push(inst);
    else clusters.push({ x: p.x, y: p.y, items: [inst] });
  }
  return clusters;
}

export function WorldPanel({ selectedId, onSelect, onAsset }: { selectedId: number | null; onSelect: (id: number | null) => void; onAsset: (id: string) => void }) {
  const g = useGame();
  const s = g.state!;
  const [view, setView] = useState<'map' | 'feed'>('map');
  const lastManual = useRef(0);

  const active = s.instances.filter((i) => s.clockDays < i.expiresDay);
  const mapEvents = active.filter((i) => CONTENT.eventById.get(i.eventId)!.location.kind === 'map');
  const globals = active.filter((i) => CONTENT.eventById.get(i.eventId)!.location.kind === 'global');
  const clusters = useMemo(() => clusterize(mapEvents), [mapEvents.map((i) => i.id).join(',')]);
  const unread = s.instances.filter((i) => !i.read).length;

  // show new stories automatically unless the player is busy reading another one
  const newest = s.instances[s.instances.length - 1];
  useEffect(() => {
    if (!newest) return;
    if (performance.now() - lastManual.current > 9000) {
      onSelect(newest.id);
      store.read(newest.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newest?.id]);

  const pick = (id: number) => {
    lastManual.current = performance.now();
    onSelect(id);
    store.read(id);
  };

  const selected = s.instances.find((i) => i.id === selectedId) ?? newest ?? null;
  const cluster = selected ? clusters.find((c) => c.items.some((i) => i.id === selected.id)) : undefined;

  return (
    <section className="panel world">
      <div className="panel-head">
        <h2>The world</h2>
        <div className="head-right">
          <div className="seg small" role="group" aria-label="World view">
            <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><Icon name="map" /> Map</button>
            <button className={view === 'feed' ? 'on' : ''} onClick={() => setView('feed')}>
              <Icon name="news" /> News{unread > 0 && <span className="dot-count">{unread}</span>}
            </button>
          </div>
          <span className="muted">{s.instances.length} {s.instances.length === 1 ? 'story' : 'stories'}</span>
        </div>
      </div>

      <div className="world-body">
      <div className="world-left">
      {view === 'map' ? (
        <div className="map-wrap">
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="map-svg" role="img" aria-label="World map with news markers" preserveAspectRatio="xMidYMid meet">
            <MapBase />
            {clusters.map((c, ci) => {
              const lead = c.items[c.items.length - 1];
              const isSel = c.items.some((i) => i.id === selected?.id);
              const anyUnread = c.items.some((i) => !i.read);
              const col = TAG_COLOR[lead.tag];
              const age = Math.max(0, s.clockDays - lead.publishedDay);
              return (
                <g
                  key={ci}
                  className={`marker ${anyUnread ? 'unread' : 'read'} ${isSel ? 'sel' : ''}`}
                  transform={`translate(${c.x},${c.y}) scale(1.5)`}
                  onClick={() => pick(lead.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${TAG_LABEL[lead.tag]}: ${CONTENT.eventById.get(lead.eventId)!.headline}`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick(lead.id)}
                >
                  <title>{CONTENT.eventById.get(lead.eventId)!.headline}</title>
                  {anyUnread && <circle className="ping" r="9" fill="none" stroke={col} />}
                  {age < 1.5 && <circle className="ping slow" r="9" fill="none" stroke={col} />}
                  {isSel && <circle r="17" className="sel-ring" />}
                  <circle r="11" fill={anyUnread ? col : 'var(--panel-2)'} stroke={col} strokeWidth="2.2" strokeDasharray={anyUnread ? undefined : '3 2'} />
                  {c.items.length === 1 && lead.tag === 'announcement' ? (
                    <g stroke={anyUnread ? '#0b0e14' : col} strokeWidth="1.8" fill="none" strokeLinecap="round">
                      <circle r="5.5" />
                      <path d="M0 -3v3l2 1.5" />
                    </g>
                  ) : (
                    <text className="marker-glyph" textAnchor="middle" dy="4.2" fill={anyUnread ? '#0b0e14' : col}>
                      {c.items.length > 1 ? c.items.length : TAG_GLYPH[lead.tag]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {globals.length > 0 && (
            <div className="global-chips">
              <span className="muted small"><Icon name="globe" /> Worldwide</span>
              {globals.slice(-3).map((i) => (
                <button key={i.id} className={`gchip ${i.read ? '' : 'unread'} ${selected?.id === i.id ? 'sel' : ''}`} style={{ borderColor: TAG_COLOR[i.tag] }} onClick={() => pick(i.id)}>
                  {CONTENT.eventById.get(i.eventId)!.headline.slice(0, 34)}…
                </button>
              ))}
            </div>
          )}
          <div className="map-legend">
            {(['breaking', 'announcement', 'rumor', 'update'] as const).map((t) => (
              <span key={t}><i style={{ background: TAG_COLOR[t] }} />{TAG_LABEL[t]}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="feed">
          {s.instances.length === 0 && <p className="muted pad">No stories yet.</p>}
          {[...s.instances].reverse().map((i) => {
            const def = CONTENT.eventById.get(i.eventId)!;
            return (
              <button key={i.id} className={`feed-row ${i.read ? '' : 'unread'} ${selected?.id === i.id ? 'sel' : ''}`} onClick={() => pick(i.id)}>
                <span className="feed-tag" style={{ color: TAG_COLOR[i.tag], borderColor: TAG_COLOR[i.tag] }}>{TAG_LABEL[i.tag]}</span>
                <span className="feed-headline">{def.headline}</span>
                <span className="feed-meta">{def.place ?? 'Worldwide'} · {dayLabel(i.publishedDay)}</span>
              </button>
            );
          })}
        </div>
      )}

      </div>
      <NewsCard inst={selected} cluster={cluster} onPick={pick} onAsset={onAsset} />
      </div>
    </section>
  );
}

function NewsCard({ inst, cluster, onPick, onAsset }: { inst: EventInstance | null; cluster?: Cluster; onPick: (id: number) => void; onAsset: (id: string) => void }) {
  const g = useGame();
  const s = g.state!;
  if (!inst) {
    return (
      <div className="news-card empty">
        <div className="news-kicker">Quiet on the wires</div>
        <div className="news-headline">Nothing has happened. Yet.</div>
        <p>Stories appear on the map as they break. Some move prices immediately. Others are warnings. Keep your eyes open.</p>
      </div>
    );
  }
  const def = CONTENT.eventById.get(inst.eventId)!;
  const mentions = mentionedAssets(def);
  const parentId = CONTENT.parentOf.get(inst.eventId);
  const parent = parentId ? CONTENT.eventById.get(parentId) : null;
  const age = Math.max(0, (s.clockDays - inst.publishedDay) * (s.settings.durationSeconds / s.settings.gameDays));
  const ageText = age < 4 ? 'just now' : age < 90 ? `${Math.round(age)} s ago` : `${Math.round(age / 60)} min ago`;
  const idx = cluster ? cluster.items.findIndex((i) => i.id === inst.id) : -1;
  return (
    <article className="news-card" key={inst.id} style={{ borderLeftColor: TAG_COLOR[inst.tag] }}>
      <div className="news-kicker">
        <span className="tag-pill" style={{ background: `${TAG_COLOR[inst.tag]}26`, color: TAG_COLOR[inst.tag] }}>{TAG_LABEL[inst.tag]}</span>
        <span>{dayLabel(inst.publishedDay)} · {def.place ?? 'Worldwide'} · {ageText}</span>
        {cluster && cluster.items.length > 1 && (
          <span className="cluster-nav">
            <button onClick={() => onPick(cluster.items[(idx - 1 + cluster.items.length) % cluster.items.length].id)} aria-label="Previous story here">‹</button>
            {idx + 1}/{cluster.items.length}
            <button onClick={() => onPick(cluster.items[(idx + 1) % cluster.items.length].id)} aria-label="Next story here">›</button>
          </span>
        )}
      </div>
      <h3 className="news-headline">{def.headline}</h3>
      {storyStillMoving(s, inst.id) && (
        <p className="moving" title="This story's price impact has not fully played out yet.">
          <i /> Markets still reacting. There is time to trade this.
        </p>
      )}
      <p className="news-desc">{def.description}</p>
      {parent && <p className="news-follow">↳ Follows: “{parent.headline}”</p>}
      {inst.tag === 'announcement' && <p className="news-follow"><Icon name="clock" /> Developing story. More could follow.</p>}
      {inst.tag === 'rumor' && <p className="news-follow"><Icon name="help" /> Unconfirmed. Treat with suspicion and snacks.</p>}
      <div className="news-foot">
        {mentions.length > 0 && (
          <div className="spotlight">
            <span>In the spotlight:</span>
            {mentions.slice(0, 5).map((a) => (
              <button key={a.id} className="spot-chip" onClick={() => onAsset(a.id)}>
                <AssetBadge asset={a} size={20} /> {a.name}
              </button>
            ))}
          </div>
        )}
        {def.quip && (
          <div className="quip">
            <Avatar who={def.quip.who} size={30} />
            <div>
              <b>{presentation.characters[def.quip.who].name}</b>
              <span>{def.quip.text}</span>
            </div>
          </div>
        )}
      </div>
      <span className="visually-hidden">{displayDay(s)}</span>
    </article>
  );
}
