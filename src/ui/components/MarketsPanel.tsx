import { memo, useState } from 'react';
import { CONTENT } from '../../content';
import { fmtPrice } from '../../engine/money';
import type { Asset, RunState } from '../../engine/types';
import { useFlash, useGame } from '../hooks';
import { CATEGORY_LABEL, changeSinceStart, cx } from '../util';
import { AssetBadge, Signed, Sparkline } from './shared';

type Tab = 'all' | 'stock' | 'commodity' | 'crypto' | 'forex' | 'holdings';

const Row = memo(function Row({ asset, price, change, spark, owned, selected, onSelect }: { asset: Asset; price: number; change: number; spark: number[]; owned: string | null; selected: boolean; onSelect: () => void }) {
  const flash = useFlash(price);
  return (
    <button className={cx('mrow', selected && 'sel', flash && `flash-${flash}`)} onClick={onSelect} aria-pressed={selected}>
      <AssetBadge asset={asset} />
      <span className="mrow-name">
        <b>{asset.id}</b>
        <small>{asset.name}</small>
        <small className={owned ? 'owned' : 'dim'}>{owned ?? 'No position'}</small>
      </span>
      <Sparkline points={spark} up={change >= 0} />
      <span className="mrow-price">
        <b>{fmtPrice(price)}</b>
        <Signed value={change} />
      </span>
    </button>
  );
});

function ownedLabel(s: RunState, id: string): string | null {
  if (s.longs[id]) return `Owned: ${s.longs[id].qty}`;
  if (s.shorts[id]) return `Short: ${s.shorts[id].qty}`;
  return null;
}

export function MarketsPanel({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const g = useGame();
  const s = g.state!;
  const [tab, setTab] = useState<Tab>('all');
  const held = CONTENT.assets.filter((a) => s.longs[a.id] || s.shorts[a.id]);
  const list = tab === 'all' ? CONTENT.assets : tab === 'holdings' ? held : CONTENT.assets.filter((a) => a.category === tab);
  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: `All (${CONTENT.assets.length})` },
    { id: 'stock', label: CATEGORY_LABEL.stock },
    { id: 'commodity', label: CATEGORY_LABEL.commodity },
    { id: 'crypto', label: CATEGORY_LABEL.crypto },
    { id: 'forex', label: CATEGORY_LABEL.forex },
    { id: 'holdings', label: `My holdings (${held.length})` },
  ];
  return (
    <section className="panel markets">
      <div className="panel-head">
        <h2>Markets</h2>
        <span className="muted">{CONTENT.assets.length} tradable assets</span>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="muted small pad-x">Price change: since day 1</div>
      <div className="mlist">
        {list.length === 0 && <p className="muted pad">No open positions. Buy or short something from <b>All assets</b>.</p>}
        {list.map((a) => {
          const h = s.history[a.id];
          const spark = h.slice(-40).map((p) => p[1]);
          return <Row key={a.id} asset={a} price={s.prices[a.id]} change={changeSinceStart(s, a.id)} spark={spark} owned={ownedLabel(s, a.id)} selected={selected === a.id} onSelect={() => onSelect(a.id)} />;
        })}
      </div>
    </section>
  );
}
