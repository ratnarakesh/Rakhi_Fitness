/**
 * Rakhi's daily supplement + diet checklist. Grouped by time of day.
 * Item ids are stable — they key the per-day checked state in GlobalContext.
 *
 * Note: the morning and night vitamins each come as a single combined capsule,
 * taken 2 at a time — so they are one checklist item with a `qty` of 2, not one
 * tick per vitamin.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
  /** Number of pieces to take (rendered as a ×N badge). */
  qty?: number;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  time: string;
  color: string;
  items: ChecklistItem[];
}

export const CHECKLIST: ChecklistGroup[] = [
  {
    id: 'morning',
    title: 'Morning · With Breakfast',
    time: 'AM',
    color: '#FFB020',
    items: [
      {
        id: 'am-capsule',
        label: 'Morning Capsules',
        detail: 'Omega-3 · Vitamin D3 · K2 (combined)',
        qty: 2,
      },
    ],
  },
  {
    id: 'post-workout',
    title: 'Post-Workout',
    time: 'GYM',
    color: '#00FFCC',
    items: [
      { id: 'whey', label: 'Whey Protein', detail: '1 scoop' },
      { id: 'creatine', label: 'Creatine', detail: '5 g' },
    ],
  },
  {
    id: 'anytime',
    title: 'Anytime · Daily Targets',
    time: 'ANY',
    color: '#33D17A',
    items: [
      { id: 'water', label: 'Water', detail: '4 litres total (across the day)' },
      { id: 'eggs', label: 'Eggs', detail: '3 whole (any meal)' },
    ],
  },
  {
    id: 'night',
    title: 'Before Sleep',
    time: 'PM',
    color: '#5AB0FF',
    items: [
      {
        id: 'pm-capsule',
        label: 'Night Capsules',
        detail: 'Zinc · Magnesium · Vitamin B6 (combined)',
        qty: 2,
      },
    ],
  },
];

/** All item ids, flattened — for progress calculations. */
export const CHECKLIST_ITEM_IDS = CHECKLIST.flatMap((g) => g.items.map((i) => i.id));

export const CHECKLIST_TOTAL = CHECKLIST_ITEM_IDS.length;
