'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Arrow,
  Coffee,
  Dumbbell,
  Flame,
  HeartPulse,
  Repeat2,
  Shield,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { toDateKey, useGlobal } from '@/context/GlobalContext';
import { cn } from '@/lib/utils';
import { getDayPlan, WEEKLY_PLAN, type PlanExercise } from '@/lib/plan';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function keyOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function PlanPage() {
  const { workoutHistory } = useGlobal();

  // Days with at least one logged workout.
  const visited = useMemo(() => {
    const s = new Set<string>();
    for (const w of workoutHistory) s.add(toDateKey(new Date(w.createdAt)));
    return s;
  }, [workoutHistory]);

  const now = new Date();
  const todayKey = toDateKey(now);
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  // Cells: leading blanks + day numbers.
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const visitsThisMonth = useMemo(() => {
    let n = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (visited.has(keyOf(view.y, view.m, d))) n++;
    }
    return n;
  }, [visited, view, daysInMonth]);

  // Current streak: consecutive days ending today with a logged workout.
  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Allow the streak to "hold" if today isn't logged yet but yesterday was.
    if (!visited.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (visited.has(toDateKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [visited]); // eslint-disable-line react-hooks/exhaustive-deps

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });
  };

  const todayPlan = getDayPlan(now.getDay());

  return (
    <div className="px-5 pt-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          Schedule
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Plan</h1>
      </div>

      {/* Streak + visits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-accent">{streak}</p>
            <p className="label">Day Streak</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt text-muted">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white">{visitsThisMonth}</p>
            <p className="label">Visits · {MONTHS[view.m].slice(0, 3)}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-4 card">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-lg p-2 text-muted transition hover:text-accent active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm font-bold">
            {MONTHS[view.m]} {view.y}
          </p>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-lg p-2 text-muted transition hover:text-accent active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((d, i) => (
            <div key={i} className="py-1 text-center text-[10px] font-bold text-faint">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`b-${i}`} />;
            const key = keyOf(view.y, view.m, day);
            const isVisited = visited.has(key);
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg text-sm font-semibold',
                  isVisited
                    ? 'bg-accent font-extrabold text-background shadow-glow'
                    : 'bg-surface-alt text-muted',
                  isToday && !isVisited && 'ring-2 ring-accent',
                  isToday && isVisited && 'ring-2 ring-white'
                )}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-accent" /> Gym visit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-accent" /> Today
          </span>
        </div>
      </div>

      {/* Today's session */}
      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
        Today · {todayPlan.day}
      </h2>
      <PlanCard plan={todayPlan} highlight />

      {/* Full weekly split */}
      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
        Weekly Split
      </h2>
      <div className="space-y-3">
        {WEEKLY_PLAN.filter((d) => d.weekday !== now.getDay())
          // Order Mon..Sun for readability.
          .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))
          .map((plan) => (
            <PlanCard key={plan.day} plan={plan} />
          ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PlanCard({
  plan,
  highlight = false,
}: {
  plan: ReturnType<typeof getDayPlan>;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(highlight);

  return (
    <motion.div
      layout
      className={cn('card', highlight && 'border-accent/50 shadow-glow')}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${plan.color}22`, color: plan.color }}
        >
          {plan.rest ? <Coffee size={20} /> : <Dumbbell size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">{plan.title}</p>
            {!highlight && <span className="text-xs text-faint">{plan.day}</span>}
          </div>
          <p className="truncate text-xs text-muted">{plan.focus}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-muted">
          ~{plan.durationMin}m
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {/* Muscle pairing — "mix with what" */}
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="shrink-0 text-accent" />
            <p className="text-xs">
              <span className="font-bold text-white">Mix:</span>{' '}
              <span className="text-accent">{plan.pairing}</span>
            </p>
          </div>

          {/* Warm-up */}
          {plan.warmup && (
            <div className="flex items-start gap-2 text-xs text-muted">
              <Flame size={14} className="mt-0.5 shrink-0 text-warning" />
              <p>
                <span className="font-bold text-white">Warm-up:</span> {plan.warmup}
              </p>
            </div>
          )}

          {/* Main lifts */}
          {plan.main.length > 0 && (
            <Section label="Main Lifts" icon={<Dumbbell size={13} />}>
              {plan.main.map((ex, i) => (
                <ExerciseRow key={i} ex={ex} />
              ))}
            </Section>
          )}

          {/* Abs */}
          {plan.abs.length > 0 && (
            <Section label="Abs / Core" icon={<Shield size={13} />}>
              {plan.abs.map((ex, i) => (
                <ExerciseRow key={i} ex={ex} />
              ))}
            </Section>
          )}

          {/* Cardio */}
          {plan.cardio && (
            <Section label="Cardio" icon={<HeartPulse size={13} />}>
              <p className="px-3 py-2 text-sm text-muted">{plan.cardio}</p>
            </Section>
          )}

          {!plan.rest && (
            <p className="text-[11px] text-faint">
              Tap a linked movement to log it in the tracker. Rest 60–90s between
              sets to fit ~{plan.durationMin} minutes.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
        <span className="text-accent">{icon}</span> {label}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ExerciseRow({ ex }: { ex: PlanExercise }) {
  const inner = (
    <>
      <div className="min-w-0">
        <span className="text-sm font-semibold text-white">{ex.name}</span>
        {ex.variations && ex.variations.length > 0 && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-faint">
            <Repeat2 size={11} className="shrink-0" />
            {ex.variations.join(' · ')}
          </p>
        )}
      </div>
      <span
        className={cn(
          'flex shrink-0 items-center gap-2 text-xs font-semibold',
          ex.exerciseId ? 'text-accent' : 'text-muted'
        )}
      >
        {ex.sets} × {ex.reps}
        {ex.exerciseId && <Arrow size={14} />}
      </span>
    </>
  );

  if (ex.exerciseId) {
    return (
      <Link
        href={`/tracker?exercise=${ex.exerciseId}`}
        className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt px-3 py-2.5 transition active:scale-[0.99]"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      {inner}
    </div>
  );
}
