import clsx, { type ClassValue } from 'clsx';

/** Conditional className joiner. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Locale-grouped integer formatting (e.g. 12000 -> "12,000"). */
export function fmt(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : '0';
}

/** Clamp a 0..1 ratio to a percentage string for width styles. */
export function pct(value: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, (value / target) * 100));
}

/** Human date from an ISO timestamp. */
export function humanDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
