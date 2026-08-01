/**
 * Alcohol tracking helpers. A "standard unit" here is 10 g of pure alcohol.
 * pure alcohol (g) = volume(ml) × ABV% × 0.789 (ethanol density).
 */

export interface DrinkType {
  id: string;
  label: string;
  abv: number; // %
  color: string;
  /** Typical single-serving size in ml (for quick-add). */
  serving: number;
}

export const DRINK_TYPES: DrinkType[] = [
  { id: 'beer', label: 'Beer', abv: 5, color: '#FFB020', serving: 330 },
  { id: 'whisky', label: 'Whisky', abv: 40, color: '#FF8A5B', serving: 30 },
  { id: 'wine', label: 'Wine', abv: 12, color: '#F45D9C', serving: 150 },
  { id: 'vodka', label: 'Vodka', abv: 40, color: '#7DD3FC', serving: 30 },
  { id: 'rum', label: 'Rum', abv: 40, color: '#B980FF', serving: 30 },
  { id: 'other', label: 'Other', abv: 5, color: '#8A8A8A', serving: 100 },
];

export function getDrinkType(id: string): DrinkType {
  return DRINK_TYPES.find((d) => d.id === id) ?? DRINK_TYPES[DRINK_TYPES.length - 1];
}

/** Standard units (10 g pure alcohol) for a volume at a given ABV. */
export function unitsFor(volumeMl: number, abv: number): number {
  const grams = volumeMl * (abv / 100) * 0.789;
  return +(grams / 10).toFixed(2);
}
