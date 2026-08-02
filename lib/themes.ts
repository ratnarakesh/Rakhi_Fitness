/**
 * Available UI themes. The actual color values live in app/globals.css keyed by
 * data-theme; this list drives the in-app switcher and validation. `swatch`
 * values are for the picker preview only.
 */
export interface ThemeDef {
  id: string;
  name: string;
  blurb: string;
  swatch: { bg: string; accent: string; accent2: string };
}

export const THEMES: ThemeDef[] = [
  { id: 'aurora', name: 'Aurora Glass', blurb: 'Space-black with an aurora glow + frosted cards', swatch: { bg: '#06060c', accent: '#a78bfa', accent2: '#22d3ee' } },
  { id: 'ocean', name: 'Deep Ocean', blurb: 'Midnight navy with a cool cyan sheen', swatch: { bg: '#070f1e', accent: '#38bdf8', accent2: '#2dd4bf' } },
  { id: 'synth', name: 'Synthwave', blurb: 'Black-violet with glowing pink + cyan', swatch: { bg: '#0a0612', accent: '#ff4fd8', accent2: '#22d3ee' } },
  { id: 'ember', name: 'Ember Warmth', blurb: 'Warm plum-to-black, amber + coral', swatch: { bg: '#120a0b', accent: '#fb923c', accent2: '#f43f5e' } },
  { id: 'forest', name: 'Forest Calm', blurb: 'Deep pine-charcoal with emerald + lime', swatch: { bg: '#07120c', accent: '#34d399', accent2: '#a3e635' } },
  { id: 'mono', name: 'Graphite Mono', blurb: 'Slate graphite with one electric-lime accent', swatch: { bg: '#15171c', accent: '#d7ff3e', accent2: '#b6e21f' } },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const DEFAULT_THEME = 'aurora';

export function isTheme(v: unknown): v is string {
  return typeof v === 'string' && THEME_IDS.includes(v);
}
