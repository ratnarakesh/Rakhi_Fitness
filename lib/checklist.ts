/**
 * Rakhi's daily supplement + diet checklist. Grouped by time of day.
 * Item ids are stable — they key the per-day checked state in GlobalContext.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
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
      { id: 'omega3', label: 'Omega-3', detail: 'Fish oil' },
      { id: 'vitd3', label: 'Vitamin D3' },
      { id: 'k2', label: 'Vitamin K2' },
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
    id: 'night',
    title: 'Before Sleep',
    time: 'PM',
    color: '#5AB0FF',
    items: [
      { id: 'zinc', label: 'Zinc' },
      { id: 'magnesium', label: 'Magnesium' },
      { id: 'b6', label: 'Vitamin B6' },
      { id: 'water', label: 'Water', detail: '4 litres total' },
      { id: 'eggs', label: 'Eggs', detail: '3 whole' },
    ],
  },
];

/** All item ids, flattened — for progress calculations. */
export const CHECKLIST_ITEM_IDS = CHECKLIST.flatMap((g) => g.items.map((i) => i.id));

export const CHECKLIST_TOTAL = CHECKLIST_ITEM_IDS.length;
