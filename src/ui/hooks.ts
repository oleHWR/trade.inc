import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { store } from './store';

export function useGame() {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store;
}

/** Smoothly tweens a number toward its target. */
export function useTween(target: number, ms = 450): number {
  const [v, setV] = useState(target);
  const from = useRef(target);
  const cur = useRef(target);
  cur.current = v;
  useEffect(() => {
    from.current = cur.current;
    const start = performance.now();
    let raf = 0;
    const tick = (n: number) => {
      const p = Math.min(1, (n - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from.current + (target - from.current) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Returns 'up' | 'down' | '' for ~700 ms whenever the value changes. */
export function useFlash(value: number): '' | 'up' | 'down' {
  const prev = useRef(value);
  const [flash, setFlash] = useState<'' | 'up' | 'down'>('');
  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? 'up' : 'down');
    prev.current = value;
    const t = setTimeout(() => setFlash(''), 700);
    return () => clearTimeout(t);
  }, [value]);
  return flash;
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 600, h: 300 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => setSize({ w: Math.max(100, el.clientWidth), h: Math.max(80, el.clientHeight) }));
    ro.observe(el);
    setSize({ w: Math.max(100, el.clientWidth), h: Math.max(80, el.clientHeight) });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}
