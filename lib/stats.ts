/**
 * Derived training stats: streaks, weekly activity, muscle-group split, and
 * today's plan progress. Pure functions over the workout history so both Home
 * and Stats can share them.
 */

import type { WorkoutEntry } from '@/context/GlobalContext';
import type { DayPlan } from '@/lib/plan';

const DAY = 86_400_000;

function key(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Set of local day-keys that have at least one logged workout. */
export function workoutDays(history: Pick<WorkoutEntry, 'createdAt'>[]): Set<string> {
  const s = new Set<string>();
  for (const w of history) s.add(key(new Date(w.createdAt)));
  return s;
}

/** Current + longest consecutive-day streaks. `now` passed for determinism. */
export function streaks(days: Set<string>, now: Date): { current: number; longest: number } {
  // Current: count back from today; if today isn't logged yet, start yesterday
  // so an in-progress day never breaks the streak.
  let current = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(key(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest: scan sorted days for the max consecutive run.
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of sorted) {
    const t = Date.parse(`${k}T00:00:00`);
    run = prev !== null && t - prev === DAY ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = t;
  }
  return { current, longest };
}

/** Start of the current week (Monday 00:00) in ms. */
export function weekStart(now: Date): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

export interface WeekDay {
  key: string;
  label: string;
  trained: boolean;
  isToday: boolean;
  future: boolean;
}

/** Mon–Sun activity for the current week. */
export function weekActivity(days: Set<string>, now: Date): { days: WeekDay[]; trainedCount: number } {
  const start = weekStart(now);
  const todayKey = key(now);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const out: WeekDay[] = [];
  let trainedCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start + i * DAY);
    const k = key(d);
    const trained = days.has(k);
    if (trained) trainedCount++;
    out.push({ key: k, label: labels[i], trained, isToday: k === todayKey, future: d.getTime() > now.getTime() });
  }
  return { days: out, trainedCount };
}

/** Total training volume (kg) logged this week. */
export function weekVolume(history: WorkoutEntry[], now: Date): number {
  const start = weekStart(now);
  return history
    .filter((w) => Date.parse(w.createdAt) >= start)
    .reduce((a, w) => a + (w.totalVolume || 0), 0);
}

export interface SplitSlice {
  category: string;
  sets: number;
  pct: number;
  color: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  Push: '#00d0ff',
  Pull: '#5ab0ff',
  Legs: '#ffb020',
  Chest: '#ff7a90',
  Back: '#5ab0ff',
  Shoulders: '#8b5cf6',
  Biceps: '#b980ff',
  Triceps: '#f45d9c',
  Forearms: '#33d17a',
  Core: '#34d399',
  Abs: '#34d399',
  Cardio: '#fb7185',
  Custom: '#9aa0aa',
};

export function splitColor(category: string): string {
  return CATEGORY_COLOR[category] ?? '#9aa0aa';
}

/** This week's set count grouped by exercise category, largest first. */
export function muscleSplit(history: WorkoutEntry[], now: Date): SplitSlice[] {
  const start = weekStart(now);
  const map = new Map<string, number>();
  for (const w of history) {
    if (Date.parse(w.createdAt) >= start) {
      const c = w.category || 'Custom';
      map.set(c, (map.get(c) || 0) + (w.totalSets || 0));
    }
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
  return [...map.entries()]
    .map(([category, sets]) => ({ category, sets, pct: Math.round((sets / total) * 100), color: splitColor(category) }))
    .sort((a, b) => b.sets - a.sets);
}

export interface TodayProgress {
  rest: boolean;
  done: number;
  planned: number;
}

/** How much of today's planned session is done (by logged exercises). */
export function todayProgress(history: WorkoutEntry[], plan: DayPlan, now: Date): TodayProgress {
  const todayKey = key(now);
  const todays = history.filter((w) => key(new Date(w.createdAt)) === todayKey);
  if (plan.rest) return { rest: true, done: todays.length, planned: 0 };

  const plannedIds = plan.main.filter((e) => e.exerciseId).map((e) => e.exerciseId as string);
  const doneIds = new Set(todays.map((w) => w.exerciseId));
  if (plannedIds.length > 0) {
    return { rest: false, done: plannedIds.filter((id) => doneIds.has(id)).length, planned: plannedIds.length };
  }
  // No trackable planned exercises — fall back to count logged today.
  return { rest: false, done: todays.length, planned: Math.max(plan.main.length, todays.length) };
}
