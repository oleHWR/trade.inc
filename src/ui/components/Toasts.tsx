import { useEffect, useState } from 'react';
import { CONTENT, presentation } from '../../content';
import { ACHIEVEMENTS } from '../../engine/achievements';
import type { CharacterId } from '../../engine/types';
import { store } from '../store';
import { TAG_COLOR, TAG_LABEL } from '../util';
import { Avatar } from './shared';

interface Toast {
  id: number;
  kind: 'news' | 'message' | 'achievement' | 'alert';
  title: string;
  body?: string;
  who?: CharacterId;
  color?: string;
  instanceId?: number;
  ttl: number;
}

let nextId = 1;

export function Toasts({ onNews }: { onNews: (id: number) => void }) {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const add = (t: Omit<Toast, 'id'>) => {
      const id = nextId++;
      setItems((cur) => [...cur.slice(-3), { ...t, id }]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), t.ttl);
    };
    return store.onEvent((e) => {
      const s = store.state;
      if (!s) return;
      if (e.type === 'news') {
        const inst = s.instances.find((i) => i.id === e.instanceId);
        if (!inst) return;
        const def = CONTENT.eventById.get(inst.eventId)!;
        add({ kind: 'news', title: `${TAG_LABEL[inst.tag].toUpperCase()} · ${def.place ?? 'Worldwide'}`, body: def.headline, color: TAG_COLOR[inst.tag], instanceId: inst.id, ttl: inst.tag === 'breaking' ? 7000 : 5000 });
      } else if (e.type === 'checkpoint') {
        const m = (presentation.checkpointMessages as Record<string, { who: CharacterId; pass: string; fail: string }>)[String(e.day)];
        if (m) add({ kind: 'message', who: m.who, title: `${presentation.characters[m.who].name} · Day ${e.day} review`, body: e.passed ? m.pass : m.fail, color: e.passed ? '#3ddc97' : '#ff5d73', ttl: 9000 });
      } else if (e.type === 'achievement') {
        const a = ACHIEVEMENTS.find((x) => x.id === e.id);
        if (a) add({ kind: 'achievement', title: `Trophy: ${a.title}`, body: a.description, color: '#ffb454', ttl: 6000 });
      } else if (e.type === 'liquidation') {
        add({ kind: 'alert', title: 'Margin call', body: e.text, color: '#ff5d73', ttl: 9000 });
      }
    });
  }, []);
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} style={{ borderLeftColor: t.color }} onClick={() => t.instanceId && onNews(t.instanceId)} role={t.instanceId ? 'button' : undefined}>
          {t.who ? <Avatar who={t.who} size={38} /> : <span className="toast-icon" style={{ color: t.color }}>{t.kind === 'news' ? '📡' : t.kind === 'achievement' ? '🏆' : '🚨'}</span>}
          <div>
            <b style={{ color: t.color }}>{t.title}</b>
            {t.body && <p>{t.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
