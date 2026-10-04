import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type BagLine = { id: string; size: string; qty: number };
type Currency = 'ZAR' | 'EUR';

type BagState = {
  lines: BagLine[];
  count: number;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  add: (id: string, size: string, qty?: number) => void;
  setQty: (id: string, size: string, qty: number) => void;
  clear: () => void;
};

const BagContext = createContext<BagState | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [currency, setCurrency] = useState<Currency>('ZAR');

  const value = useMemo<BagState>(() => ({
    lines,
    currency,
    setCurrency,
    count: lines.reduce((n, l) => n + l.qty, 0),
    add: (id, size, qty = 1) =>
      setLines((prev) => {
        const hit = prev.find((l) => l.id === id && l.size === size);
        if (hit) return prev.map((l) => (l === hit ? { ...l, qty: l.qty + qty } : l));
        return [...prev, { id, size, qty }];
      }),
    setQty: (id, size, qty) =>
      setLines((prev) => (qty <= 0 ? prev.filter((l) => !(l.id === id && l.size === size)) : prev.map((l) => (l.id === id && l.size === size ? { ...l, qty } : l)))),
    clear: () => setLines([]),
  }), [lines, currency]);

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error('useBag must be used inside BagProvider');
  return ctx;
}
