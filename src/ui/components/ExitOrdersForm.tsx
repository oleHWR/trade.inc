import { useId, useState, type FormEvent } from 'react';
import { fmtPrice, priceAfterChange } from '../../engine/money';
import type { ExitOrderEdits, ExitOrderInput, ExitOrders } from '../../engine/types';
import { store } from '../store';

function parseAmount(input: string): number | null {
  const text = input.trim();
  if (!text) return null;
  const match = /^(\d*)(?:[.,](\d{0,2}))?$/.exec(text);
  if (!match) return NaN;
  const [, whole, decimals = ''] = match;
  return Number(whole + decimals.padEnd(2, '0'));
}

function formatAmount(hundredths: number | null | undefined): string {
  if (hundredths == null) return '';
  const digits = String(hundredths).padStart(3, '0');
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

type Unit = ExitOrderInput['unit'];
type Draft = { unit: Unit; text?: string };

interface Props {
  assetId: string;
  orders?: ExitOrders;
  entryPriceCents: number;
  minimumPriceCents: number;
  short: boolean;
  disabled: boolean;
}

export function ExitOrdersForm({ assetId, orders, entryPriceCents, minimumPriceCents, short, disabled }: Props) {
  const formId = useId();
  const [drafts, setDrafts] = useState<Partial<Record<keyof ExitOrderEdits, Draft>>>({});
  const [error, setError] = useState('');
  const fields = [
    { key: 'stopLoss', label: 'Stop-loss', above: short, price: orders?.stopLossCents, percentage: orders?.stopLossBasisPoints },
    { key: 'takeProfit', label: 'Take-profit', above: !short, price: orders?.takeProfitCents, percentage: orders?.takeProfitBasisPoints },
  ] as const;
  const active = fields.flatMap(({ price, label }) => price == null ? [] : [`${label} ${fmtPrice(price)}`]).join(' · ');
  const hasEdits = Object.values(drafts).some(({ text }) => text !== undefined);
  const usesPercentage = fields.some(({ key, percentage }) => (drafts[key]?.unit ?? (percentage == null ? 'price' : 'percent')) === 'percent');

  const edit = (key: keyof ExitOrderEdits, draft: Draft) => {
    setDrafts((current) => ({ ...current, [key]: draft }));
    setError('');
  };

  const saveOrders = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || !hasEdits) return;
    const edits: ExitOrderEdits = {};
    for (const { key } of fields) {
      const draft = drafts[key];
      if (draft?.text === undefined) continue;
      const amount = parseAmount(draft.text);
      edits[key] = amount === null ? null : { unit: draft.unit, amount };
    }
    const result = store.updateExitOrders(assetId, edits);
    setError(result.ok ? '' : result.message);
    if (result.ok) setDrafts({});
  };

  return (
    <form className="exit-orders" onSubmit={saveOrders}>
      <fieldset disabled={disabled}>
        <legend>Exit orders</legend>
        <div className="exit-order-prices">
          {fields.map(({ key, label, above, price, percentage }) => {
            const draft = drafts[key];
            const unit = draft?.unit ?? (percentage == null ? 'price' : 'percent');
            const value = draft?.text ?? formatAmount(unit === 'price' ? price : percentage);
            const amount = draft?.text === undefined ? null : parseAmount(draft.text);
            const preview = unit === 'percent' && amount !== null && amount > 0 && Number.isSafeInteger(amount)
              ? priceAfterChange(entryPriceCents, above ? amount : -amount)
              : null;
            const inputId = `${formId}-${key}`;
            return (
              <div className="exit-order-field" key={key}>
                <label htmlFor={inputId}>{label}</label>
                <div className="exit-order-input">
                  <input
                    id={inputId}
                    inputMode="decimal"
                    value={value}
                    placeholder={unit === 'percent' ? 'e.g. 5' : above ? 'Above market' : 'Below market'}
                    onChange={(event) => edit(key, { unit, text: event.target.value })}
                  />
                  <select aria-label={`${label} unit`} value={unit} onChange={(event) => edit(key, { unit: event.target.value as Unit })}>
                    <option value="price">$</option>
                    <option value="percent">%</option>
                  </select>
                </div>
                {preview !== null && Number.isSafeInteger(preview) && preview >= minimumPriceCents && (
                  <span className="muted small">Trigger {fmtPrice(preview)}</span>
                )}
              </div>
            );
          })}
        </div>
        {usesPercentage && (
          <p className="muted small">Enter a positive percentage. New percentages use your {fmtPrice(Math.round(entryPriceCents))} average entry and save as fixed trigger prices.</p>
        )}
        <p className="muted small">Closes the entire position at market. Clear a value to remove its order.</p>
        <button className="btn" type="submit" disabled={!hasEdits}>Save exit orders</button>
      </fieldset>
      <p className="small" role="status">
        {active || 'No exit orders active.'}
        {error && <span className="exit-order-error neg">{error}</span>}
      </p>
    </form>
  );
}
