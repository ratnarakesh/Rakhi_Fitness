'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Droplets,
  Dumbbell,
  Footprints,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import ProgressBar from '@/components/ProgressBar';
import { isCompliant, useGlobal } from '@/context/GlobalContext';
import { cn, fmt, pct } from '@/lib/utils';

export default function DashboardPage() {
  const {
    hydrated,
    profile,
    currentWeight,
    targetWeight,
    steps,
    stepGoal,
    water,
    waterGoal,
    mealLogs,
    setSteps,
    addSteps,
    setWater,
    addWater,
  } = useGlobal();

  const delta = +(currentWeight - targetWeight).toFixed(1);
  const atGoal = delta <= 0;
  const firstName = profile.fullName.trim().split(' ')[0] || 'Rakhi';

  // Dietary audit: inspect the 5 most recent meals for any rule break.
  const recentMeals = mealLogs.slice(0, 5);
  const violations = recentMeals.filter((m) => !isCompliant(m));
  const auditFail = violations.length > 0;

  return (
    <div className="px-5 pt-8">
      {/* Greeting header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            Rakhi Fitness
          </p>
          <h1 className="mt-1 truncate text-3xl font-extrabold tracking-tight">
            Hey {firstName}..!! <span className="text-accent">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Welcome back — let&apos;s train.</p>
        </div>
        <Link
          href="/account"
          aria-label="Open account"
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-surface-alt"
        >
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <User size={22} />
            </span>
          )}
        </Link>
      </div>

      {/* Executive KPI — body weight vs 69 kg target */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card relative overflow-hidden shadow-glow"
      >
        <div className="flex items-center gap-2 text-muted">
          <Target size={14} />
          <span className="label">Executive Bodyweight KPI</span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-extrabold leading-none text-accent">
                {hydrated ? currentWeight : '—'}
              </span>
              <span className="mb-1 text-lg font-semibold text-muted">kg</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Target <span className="font-bold text-white">{targetWeight} kg</span>
            </p>
          </div>

          <div
            className={cn(
              'flex flex-col items-end rounded-xl px-3 py-2',
              atGoal ? 'bg-accent/10' : 'bg-danger/10'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-1 text-lg font-bold',
                atGoal ? 'text-accent' : 'text-danger'
              )}
            >
              {atGoal ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
              {Math.abs(delta)} kg
            </div>
            <span className="text-[11px] uppercase tracking-wide text-muted">
              {atGoal ? 'at / below target' : 'to go'}
            </span>
          </div>
        </div>
      </motion.section>

      {/* 2-column metric grid: Steps + Water (manual daily entry) */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <MetricCard
          icon={<Footprints size={16} />}
          label="Steps"
          value={steps}
          goal={stepGoal}
          onSet={setSteps}
          onAdd={addSteps}
          increment={1000}
          incrementLabel="+1,000"
        />
        <MetricCard
          icon={<Droplets size={16} />}
          label="Water"
          unit="ml"
          value={water}
          goal={waterGoal}
          onSet={setWater}
          onAdd={addWater}
          increment={250}
          incrementLabel="+250 ml"
        />
      </div>
      <p className="mt-2 px-1 text-[11px] leading-relaxed text-faint">
        Tap a number to enter your daily total from Health / Pacer, or use the
        quick-add. Web apps can&apos;t read step data automatically.
      </p>

      {/* Dietary Audit Report */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          'mt-4 flex items-start gap-3 rounded-2xl border p-4',
          auditFail
            ? 'border-danger/50 bg-danger/10'
            : 'border-accent/40 bg-accent/5'
        )}
      >
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            auditFail ? 'bg-danger/20 text-danger' : 'bg-accent/15 text-accent'
          )}
        >
          {auditFail ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              'text-sm font-bold uppercase tracking-wide',
              auditFail ? 'text-danger' : 'text-accent'
            )}
          >
            {auditFail ? 'Dietary Violation Detected' : 'Dietary Audit Clear'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {recentMeals.length === 0
              ? 'No meals logged yet. Compliance monitoring is standing by.'
              : auditFail
                ? `${violations.length} of ${recentMeals.length} recent meals breach the Zero-Oil / Zero-Sugar / Zero-Salt protocol.`
                : `All ${recentMeals.length} recent meals pass the Zero-Oil / Zero-Sugar / Zero-Salt protocol.`}
          </p>
          {auditFail && (
            <ul className="mt-2 space-y-1">
              {violations.slice(0, 3).map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-xs text-danger">
                  <span className="h-1 w-1 rounded-full bg-danger" />
                  <span className="truncate font-medium">{m.name}</span>
                  <span className="text-muted">
                    {[
                      !m.zeroOil && 'oil',
                      !m.zeroSugar && 'sugar',
                      !m.zeroSalt && 'salt',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      {/* Primary navigation → workout logging */}
      <Link href="/tracker" className="mt-6 block">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-between rounded-2xl bg-accent px-5 py-5 text-background shadow-glow"
        >
          <div className="flex items-center gap-3">
            <Dumbbell size={24} strokeWidth={2.5} />
            <div>
              <p className="text-base font-extrabold uppercase tracking-wide">
                Log Training Volume
              </p>
              <p className="text-xs font-medium opacity-70">
                Open the exercise tracker
              </p>
            </div>
          </div>
          <ChevronRight size={24} strokeWidth={2.5} />
        </motion.div>
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MetricCard({
  icon,
  label,
  unit,
  value,
  goal,
  onSet,
  onAdd,
  increment,
  incrementLabel,
}: {
  icon: React.ReactNode;
  label: string;
  unit?: string;
  value: number;
  goal: number;
  onSet: (v: number) => void;
  onAdd: (delta: number) => void;
  increment: number;
  incrementLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(value ? String(value) : '');
    setEditing(true);
  };

  const commit = () => {
    const n = parseInt(draft.replace(/[^0-9]/g, ''), 10);
    onSet(Number.isFinite(n) ? Math.max(0, n) : 0);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card flex flex-col"
    >
      <div className="flex items-center gap-2 text-muted">
        <span className="text-accent">{icon}</span>
        <span className="label">{label}</span>
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            placeholder="0"
            className="w-full rounded-lg border border-accent bg-surface-alt px-2 py-1 text-2xl font-extrabold text-white outline-none"
          />
          <button
            onClick={commit}
            aria-label="Save"
            className="shrink-0 rounded-lg bg-accent p-2 text-background active:scale-90"
          >
            <Check size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="group mt-3 flex items-end gap-1 text-left"
        >
          <span className="text-3xl font-extrabold text-white">{fmt(value)}</span>
          {unit && (
            <span className="mb-0.5 text-xs font-semibold text-muted">{unit}</span>
          )}
          <Pencil
            size={12}
            className="mb-1.5 ml-1 text-faint transition group-hover:text-accent"
          />
        </button>
      )}

      <p className="mt-1 text-xs text-muted">
        Target {fmt(goal)}
        {unit ? ` ${unit}` : ''}
      </p>
      <ProgressBar percent={pct(value, goal)} className="mt-3" />

      <button
        onClick={() => onAdd(increment)}
        className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-border bg-surface-alt py-2 text-xs font-bold uppercase tracking-wide text-accent transition active:scale-95"
      >
        <Plus size={13} /> {incrementLabel}
      </button>
    </motion.div>
  );
}
