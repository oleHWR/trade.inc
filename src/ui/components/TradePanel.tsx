import { useEffect, useRef, useState } from 'react';
import { CONTENT } from '../../content';
import { availableCash, coverCostOf, liquidationPriceCents, maxBuyQty, maxShortQty, unrealizedLong, unrealizedShort } from '../../engine/accounting';
import { fmtMoney, fmtPrice } from '../../engine/money';
import { useGame } from '../hooks';
import { store } from '../store';

export function TradePanel({ assetId }: { assetId: string }) {
  const g = useGame();
  const s = g.state!;
  const asset = CONTENT.assetById.get(assetId)!;
  const price = s.prices[assetId];
  const long = s.longs[assetId];
  const short = s.shorts[assetId];
  const [mode, setMode] = useState<'long' | 'short'>('long');
  const [qtyText, setQtyText] = useState('5');
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const fbTimer = useRef<ReturnType<typeof setTimeout>>();

  // follow the open position's direction
  useEffect(() => {
    if (short) setMode('short');
    else if (long) setMode('long');
  }, [assetId, !!long, !!short]);
  useEffect(() => setFb(null), [assetId]);

  const qty = qtyText.trim() === '' ? NaN : Number(qtyText);
  const validQty = Number.isInteger(qty) && qty > 0;
  const value = validQty ? qty * price : 0;
  const ended = s.status === 'won' || s.status === 'lost';
  const paused = s.status === 'paused';
  const disabled = paused || ended;
  const maxBuy = maxBuyQty(s, assetId);
  const maxShort = maxShortQty(s, assetId);
  const avail = availableCash(s);
  const frac = s.settings.shortCollateralFraction;

  const run = (action: 'buy' | 'sell' | 'short' | 'cover') => {
    const r = store.trade(action, assetId, validQty ? qty : Number(qtyText));
    setFb({ ok: r.ok, text: r.message });
    clearTimeout(fbTimer.current);
    fbTimer.current = setTimeout(() => setFb(null), 5000);
  };
  const setPct = (p: number) => {
    const m = mode === 'long' ? maxBuy : maxShort;
    setQtyText(String(Math.max(1, Math.floor(m * p))));
  };

  const hypotheticalLiq = price * (1 + frac * (1 - s.settings.shortMaintenanceFraction));
  const shortLiq = short ? liquidationPriceCents(s, assetId) : 0;

  return (
    <section className="panel trade">
      <div className="panel-head">
        <h2>Trade {asset.id}</h2>
        <div className="seg small" role="group" aria-label="Trade direction">
          <button className={mode === 'long' ? 'on' : ''} onClick={() => setMode('long')}>Long</button>
          <button className={mode === 'short' ? 'on short' : ''} onClick={() => setMode('short')}>Short</button>
        </div>
      </div>
      <div className="trade-price">{fmtPrice(price)}</div>
      <div className="trade-pos">
        {long && (
          <>
            <b>{long.qty}</b> {long.qty === 1 ? 'share' : 'shares'} owned · {fmtMoney(long.qty * price, { decimals: false })} ·{' '}
            <span className={unrealizedLong(s, assetId) >= 0 ? 'pos' : 'neg'}>{fmtMoney(unrealizedLong(s, assetId), { sign: true, decimals: false })}</span>
          </>
        )}
        {short && (
          <>
            <b>Short {short.qty}</b> · cover cost {fmtMoney(coverCostOf(s, assetId), { decimals: false })} ·{' '}
            <span className={unrealizedShort(s, assetId) >= 0 ? 'pos' : 'neg'}>{fmtMoney(unrealizedShort(s, assetId), { sign: true, decimals: false })}</span>
          </>
        )}
        {!long && !short && <span className="muted">No position in {asset.id}</span>}
      </div>

      <label className="qty">
        <span>Shares</span>
        <div className="qty-box">
          <button type="button" onClick={() => setQtyText(String(Math.max(1, (validQty ? qty : 1) - 1)))} aria-label="Decrease quantity">−</button>
          <input inputMode="numeric" value={qtyText} onChange={(e) => setQtyText(e.target.value)} aria-label="Quantity" />
          <button type="button" onClick={() => setQtyText(String((validQty ? qty : 0) + 1))} aria-label="Increase quantity">+</button>
        </div>
      </label>
      <div className="quick">
        {[0.25, 0.5, 1].map((p) => (
          <button key={p} onClick={() => setPct(p)} disabled={disabled}>{p === 1 ? 'Max' : `${p * 100}%`}</button>
        ))}
        {(long || short) && <button onClick={() => setQtyText(String(long?.qty ?? short?.qty))}>All {long?.qty ?? short?.qty}</button>}
        <span className="muted small">max {mode === 'long' ? maxBuy : maxShort}</span>
      </div>
      <div className="order-row">
        <span>Order value</span>
        <b>{validQty ? fmtMoney(value, { decimals: true }) : '—'}</b>
      </div>

      {mode === 'long' ? (
        <div className="btn-row">
          <button className="btn buy" disabled={disabled} onClick={() => run('buy')}>Buy</button>
          <button className="btn sell" disabled={disabled} onClick={() => run('sell')}>Sell</button>
        </div>
      ) : (
        <>
          <div className="btn-row">
            <button className="btn short" disabled={disabled} onClick={() => run('short')}>Short</button>
            <button className="btn cover" disabled={disabled} onClick={() => run('cover')}>Cover</button>
          </div>
          <p className="short-note">
            {short
              ? `Auto-closed if ${asset.id} reaches ${fmtPrice(Math.round(shortLiq))}. Locked: ${fmtMoney(short.proceedsCents + short.collateralCents, { decimals: false })}.`
              : validQty
                ? `Needs ${fmtMoney(Math.round(value * frac), { decimals: false })} collateral. Auto-closed near ${fmtPrice(Math.round(hypotheticalLiq))}. A price rise is a loss.`
                : 'Short = bet on a fall. Collateral is reserved; proceeds stay locked.'}
          </p>
        </>
      )}
      <div className={`feedback ${fb ? (fb.ok ? 'ok' : 'err') : ''}`} role="status" aria-live="polite">
        {fb?.text ?? (paused ? 'Game paused. Resume before trading.' : ended ? 'Run finished.' : `Available cash: ${fmtMoney(avail, { decimals: false })}`)}
      </div>
    </section>
  );
}
