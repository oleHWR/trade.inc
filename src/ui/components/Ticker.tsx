import { memo, useMemo } from 'react';
import { CONTENT } from '../../content';
import { fmtPrice } from '../../engine/money';
import { useGame } from '../hooks';
import { changeSinceStart } from '../util';

/** Scrolling headline + movers strip. Rebuilt only when a new story arrives, so the scroll never jumps. */
const Strip = memo(function Strip({ items }: { items: { key: string; node: JSX.Element }[] }) {
  return (
    <div className="ticker-track" style={{ animationDuration: `${Math.max(40, items.length * 7)}s` }}>
      {[0, 1].map((n) => (
        <div className="ticker-set" key={n} aria-hidden={n === 1}>
          {items.map((i) => (
            <span className="ticker-item" key={i.key + n}>
              {i.node}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
});

export function Ticker() {
  const g = useGame();
  const s = g.state!;
  const count = s.instances.length;
  const items = useMemo(() => {
    const out: { key: string; node: JSX.Element }[] = [];
    const recent = s.instances.slice(-5).reverse();
    for (const inst of recent) {
      const def = CONTENT.eventById.get(inst.eventId)!;
      out.push({ key: 'n' + inst.id, node: <><b className={`tk-tag tk-${inst.tag}`}>{inst.tag === 'announcement' ? 'DEVELOPING' : inst.tag.toUpperCase()}</b> {def.headline}</> });
    }
    const movers = [...CONTENT.assets]
      .map((a) => ({ a, c: changeSinceStart(s, a.id) }))
      .sort((x, y) => Math.abs(y.c) - Math.abs(x.c))
      .slice(0, 8);
    for (const m of movers)
      out.push({
        key: 'm' + m.a.id,
        node: (
          <>
            <b>{m.a.id}</b> {fmtPrice(s.prices[m.a.id])} <em className={m.c >= 0 ? 'pos' : 'neg'}>{m.c >= 0 ? '▲' : '▼'} {(Math.abs(m.c) * 100).toFixed(1)}%</em>
          </>
        ),
      });
    if (!recent.length) out.unshift({ key: 'welcome', node: <><b className="tk-tag tk-update">LIVE</b> Markets open. Nothing has happened yet. Enjoy it.</> });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, Math.floor(s.clockDays / 10)]);
  return (
    <div className="ticker" aria-label="News ticker">
      <Strip items={items} />
    </div>
  );
}
