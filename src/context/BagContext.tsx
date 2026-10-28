import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { findProduct, Product } from '@/src/constants/catalog';
import { getRemote } from '@/src/lib/remoteProducts';
import { itemOf, trackItems } from '@/src/lib/track';

export type BagLine = { id: string; size: string; qty: number };
type Currency = 'ZAR' | 'EUR';

type BagState = {
  lines: BagLine[];
  count: number;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  add: (id: string, size: string, qty?: number, source?: string) => void;
  setQty: (id: string, size: string, qty: number) => void;
  clear: () => void;
};

const BagContext = createContext<BagState | null>(null);
const lookup = (id: string): Product | undefined => findProduct(id) ?? getRemote(id);

// Keep the bag through refreshes on the web, so a reload never empties it.
const SAVE = 'cb-bag';
const loadBag = (): BagLine[] => {
  try { const v = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(SAVE) || '[]') : []; return Array.isArray(v) ? v : []; } catch { return []; }
};

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>(loadBag);
  const [currency, setCurrency] = useState<Currency>('ZAR');

  useEffect(() => { try { if (typeof localStorage !== 'undefined') localStorage.setItem(SAVE, JSON.stringify(lines)); } catch { /* private mode */ } }, [lines]);

  // Snapshot of the bag for the abandoned-bag signal in cb-analytics.js.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items = lines.map((l) => { const p = lookup(l.id); return p ? itemOf(p, currency, l.size, l.qty) : null; }).filter(Boolean) as ReturnType<typeof itemOf>[];
    (window as any).__cbBag = { currency, count: items.reduce((n, i) => n + i.quantity, 0), value: items.reduce((n, i) => n + i.price * i.quantity, 0), items };
  }, [lines, currency]);

  const value = useMemo<BagState>(() => {
    const event = (name: string, id: string, size: string, qty: number, extra?: Record<string, unknown>) => {
      const p = lookup(id);
      if (p && qty > 0) trackItems(name, currency, [{ p, size, qty }], extra);
    };
    return {
      lines,
      currency,
      setCurrency,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add: (id, size, qty = 1, source = 'product_page') => {
        event('add_to_cart', id, size, qty, { source });
        setLines((prev) => {
          const hit = prev.find((l) => l.id === id && l.size === size);
          if (hit) return prev.map((l) => (l === hit ? { ...l, qty: l.qty + qty } : l));
          return [...prev, { id, size, qty }];
        });
      },
      setQty: (id, size, qty) => {
        const before = lines.find((l) => l.id === id && l.size === size)?.qty ?? 0;
        const next = Math.max(0, qty);
        if (next > before) event('add_to_cart', id, size, next - before, { source: 'bag' });
        if (next < before) event('remove_from_cart', id, size, before - next, { source: 'bag' });
        setLines((prev) => (next <= 0 ? prev.filter((l) => !(l.id === id && l.size === size)) : prev.map((l) => (l.id === id && l.size === size ? { ...l, qty: next } : l))));
      },
      clear: () => {
        const all = lines.map((l) => ({ p: lookup(l.id), size: l.size, qty: l.qty })).filter((x) => x.p) as { p: Product; size: string; qty: number }[];
        if (all.length) trackItems('remove_from_cart', currency, all, { source: 'clear_bag' });
        setLines([]);
      },
    };
  }, [lines, currency]);

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error('useBag must be used inside BagProvider');
  return ctx;
}
