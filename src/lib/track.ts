/**
 * Shopping analytics (GA4 ecommerce events + Clarity tags).
 * On the web this hands events to window.cbTrack, which the consent-gated
 * landing/cb-analytics.js script provides; before consent, and on native, it does nothing.
 */
import type { Product } from '@/src/constants/catalog';

type Currency = 'ZAR' | 'EUR';

export function track(name: string, params: Record<string, unknown> = {}) {
  const w = typeof window !== 'undefined' ? (window as any) : null;
  if (w && typeof w.cbTrack === 'function') w.cbTrack(name, params);
}

export const priceOf = (p: Product, currency: Currency) => (currency === 'EUR' ? p.priceEUR : p.priceZAR) ?? 0;

export const itemOf = (p: Product, currency: Currency, size?: string, qty = 1) => ({
  item_id: p.id,
  item_name: p.title,
  item_brand: 'Crazy Button SA',
  item_category: p.category,
  item_category2: p.collection,
  item_variant: size,
  price: priceOf(p, currency),
  quantity: qty,
});

/** One ecommerce event for a list of products. */
export function trackItems(name: string, currency: Currency, lines: { p: Product; size?: string; qty?: number }[], extra: Record<string, unknown> = {}) {
  const items = lines.map((l) => itemOf(l.p, currency, l.size, l.qty ?? 1));
  const value = items.reduce((n, i) => n + i.price * i.quantity, 0);
  track(name, { currency, value, items, ...extra });
}
