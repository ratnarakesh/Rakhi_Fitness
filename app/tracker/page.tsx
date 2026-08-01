'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Dumbbell,
  Info,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import ExerciseDemo from '@/components/ExerciseDemo';
import MuscleMap from '@/components/MuscleMap';
import {
  summarize,
  useGlobal,
  type MetricType,
  type WorkoutSet,
} from '@/context/GlobalContext';
import {
  ALL_BUILTIN,
  CARDIO_EXERCISES,
  EXERCISES,
  getExercise,
  metricOf,
  type Exercise,
  type MuscleGroup,
} from '@/lib/exercises';
import { cn, fmt, humanDate } from '@/lib/utils';

/* --- unified exercise shape the tracker renders --------------------------- */
interface Resolved {
  id: string;
  name: string;
  category: string;
  metricType: MetricType;
  unit?: string;
  color?: string;
  isCustom: boolean;
  frames?: [string, string];
  primaryMuscles?: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  formCues?: string[];
  machinePhoto?: string;
  demoPhoto?: string;
  notes?: string;
}

function fromBuiltin(e: Exercise): Resolved {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    metricType: metricOf(e),
    unit: e.unit,
    isCustom: false,
    frames: e.frames,
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    formCues: e.formCues,
  };
}

const METRIC_HINT: Record<MetricType, string> = {
  'weight-reps': 'weight (kg) × reps',
  reps: 'reps per set',
  seconds: 'seconds per set',
  distance: 'distance per set',
  custom: 'amount per set',
};

interface DraftSet {
  key: string;
  weight: string;
  reps: string;
  seconds: string;
  distance: string;
  value: string;
}

let keyCounter = 0;
const nextKey = () => `set-${keyCounter++}`;
const emptySet = (): DraftSet => ({
  key: nextKey(),
  weight: '',
  reps: '',
  seconds: '',
  distance: '',
  value: '',
});

function toNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export default function TrackerPage() {
  const { workoutHistory, customExercises, addWorkout, deleteWorkout } = useGlobal();

  // Build the full option list: built-in strength, cardio, then custom.
  const resolvedById = useMemo(() => {
    const map = new Map<string, Resolved>();
    ALL_BUILTIN.forEach((e) => map.set(e.id, fromBuiltin(e)));
    customExercises.forEach((c) =>
      map.set(c.id, {
        id: c.id,
        name: c.name,
        category: c.category,
        metricType: c.metricType,
        unit: c.unit,
        color: c.color,
        isCustom: true,
        machinePhoto: c.machinePhoto,
        demoPhoto: c.demoPhoto,
        notes: c.notes,
      })
    );
    return map;
  }, [customExercises]);

  const router = useRouter();
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [deepLinked, setDeepLinked] = useState(false);
  const [view, setView] = useState<'anatomy' | 'photo'>('anatomy');
  const [showForm, setShowForm] = useState(false);
  const [draftSets, setDraftSets] = useState<DraftSet[]>([emptySet(), emptySet(), emptySet()]);
  const [justSaved, setJustSaved] = useState(false);

  const exercise = resolvedById.get(exerciseId) ?? fromBuiltin(EXERCISES[0]);
  const metric = exercise.metricType;
  const unitLabel = exercise.unit || (metric === 'distance' ? 'm' : '');

  // Deep-link ?exercise=id (from the plan).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('exercise');
    if (q && resolvedById.has(q)) {
      setExerciseId(q);
      setDeepLinked(true);
    }
  }, [resolvedById]);

  const isSetValid = (s: DraftSet): boolean => {
    switch (metric) {
      case 'weight-reps':
        return toNum(s.weight) > 0 && toNum(s.reps) > 0;
      case 'reps':
        return toNum(s.reps) > 0;
      case 'seconds':
        return toNum(s.seconds) > 0;
      case 'distance':
        return toNum(s.distance) > 0;
      case 'custom':
        return toNum(s.value) > 0;
    }
  };

  const validDraft = draftSets.filter(isSetValid);
  const loggedSets: WorkoutSet[] = validDraft.map((s) => {
    switch (metric) {
      case 'weight-reps':
        return { weight: toNum(s.weight), reps: toNum(s.reps) };
      case 'reps':
        return { reps: toNum(s.reps) };
      case 'seconds':
        return { seconds: toNum(s.seconds) };
      case 'distance':
        return { distance: toNum(s.distance) };
      case 'custom':
        return { value: toNum(s.value) };
    }
  });

  const preview = useMemo(
    () => summarize(metric, loggedSets, unitLabel),
    [metric, loggedSets, unitLabel]
  );

  const updateSet = (key: string, field: keyof DraftSet, value: string) =>
    setDraftSets((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const addRow = () => setDraftSets((rows) => [...rows, emptySet()]);
  const removeRow = (key: string) =>
    setDraftSets((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));

  const handleExerciseChange = (id: string) => {
    setExerciseId(id);
    setDraftSets([emptySet(), emptySet(), emptySet()]);
    const next = resolvedById.get(id);
    if (next && !next.frames) setView('photo');
    else setView('anatomy');
  };

  const commitLog = () => {
    if (loggedSets.length === 0) return;
    addWorkout({
      exerciseId: exercise.id,
      exercise: exercise.name,
      category: exercise.category,
      color: exercise.color,
      metricType: metric,
      unit: unitLabel || undefined,
      sets: loggedSets,
      totalSets: loggedSets.length,
      totalReps: preview.totalReps,
      totalVolume: preview.totalVolume,
      summary: preview.summary,
    });
    setDraftSets([emptySet(), emptySet(), emptySet()]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const hasAnatomy = !!exercise.frames && !!exercise.primaryMuscles;

  return (
    <div className="px-5 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {deepLinked && (
            <button
              onClick={() => router.push('/plan')}
              aria-label="Back to plan"
              className="rounded-lg border border-border p-2 text-muted active:scale-90"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              {deepLinked ? 'From Plan' : 'Log Session'}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Tracker</h1>
          </div>
        </div>
        <Link
          href="/tracker/add"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wide text-accent active:scale-95"
        >
          <Plus size={15} /> Exercise
        </Link>
      </div>

      {/* Movement selector */}
      <div className="card">
        <label htmlFor="exercise" className="label">
          Movement
        </label>
        <div className="relative mt-2">
          <select
            id="exercise"
            value={exerciseId}
            onChange={(e) => handleExerciseChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-surface-alt px-4 py-3 pr-10 text-base font-semibold text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <optgroup label="Strength">
              {EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} · {ex.category}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cardio & Bodyweight">
              {CARDIO_EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </optgroup>
            {customExercises.length > 0 && (
              <optgroup label="My Exercises">
                {customExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} · {ex.category}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
            ▾
          </span>
        </div>

        {/* View toggle (built-ins with anatomy only) */}
        {hasAnatomy && (
          <div className="mt-4 flex rounded-lg border border-border bg-surface-alt p-1">
            {(['anatomy', 'photo'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wide transition',
                  view === v ? 'bg-accent text-background' : 'text-muted'
                )}
              >
                {v === 'anatomy' ? 'Muscle Map' : 'Photo Demo'}
              </button>
            ))}
          </div>
        )}

        {/* Frame */}
        <div
          className={cn(
            'mt-3 w-full overflow-hidden rounded-xl border border-border bg-black',
            hasAnatomy && view === 'anatomy' ? 'h-80' : 'aspect-video'
          )}
        >
          {hasAnatomy && view === 'anatomy' ? (
            <MuscleMap
              exercise={{
                ...(getExercise(exercise.id) as Exercise),
              }}
            />
          ) : exercise.frames ? (
            <ExerciseDemo
              exercise={getExercise(exercise.id) as Exercise}
            />
          ) : exercise.demoPhoto || exercise.machinePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.demoPhoto || exercise.machinePhoto}
              alt={exercise.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2"
              style={{ background: exercise.color ? `${exercise.color}18` : undefined }}
            >
              <Dumbbell size={30} style={{ color: exercise.color || '#8A8A8A' }} />
              <p className="text-sm font-bold text-muted">{exercise.name}</p>
            </div>
          )}
        </div>

        {/* Machine photo thumbnail (custom) */}
        {exercise.isCustom && exercise.machinePhoto && exercise.demoPhoto && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exercise.machinePhoto}
              alt="Machine"
              className="h-12 w-12 rounded-lg border border-border object-cover"
            />
            <span className="text-xs text-muted">Machine reference</span>
          </div>
        )}

        {/* Muscles worked (built-ins) */}
        {exercise.primaryMuscles && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Muscles Worked</p>
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF3B3B' }} />
                  Primary
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#2FBF71' }} />
                  Secondary
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exercise.primaryMuscles.map((m) => (
                <span
                  key={m}
                  className="rounded-md px-2 py-1 text-xs font-bold text-white"
                  style={{ background: 'rgba(255,59,59,0.2)' }}
                >
                  {m}
                </span>
              ))}
              {exercise.secondaryMuscles?.map((m) => (
                <span
                  key={m}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                  style={{ background: 'rgba(47,191,113,0.18)' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Custom notes */}
        {exercise.isCustom && exercise.notes && (
          <p className="mt-3 rounded-lg bg-surface-alt px-3 py-2 text-sm text-muted">
            {exercise.notes}
          </p>
        )}

        {/* Correct form (built-ins) */}
        {exercise.formCues && exercise.formCues.length > 0 && (
          <>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="mt-3 flex w-full items-center justify-between rounded-lg bg-surface-alt px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                <Info size={15} className="text-accent" /> How to do it correctly
              </span>
              <ChevronDown size={16} className={cn('text-muted transition', showForm && 'rotate-180')} />
            </button>
            {showForm && (
              <ol className="mt-2 space-y-2">
                {exercise.formCues.map((cue, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                      {i + 1}
                    </span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      {/* Set rows */}
      <div className="mt-4 card">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Working Sets</span>
          <span className="text-xs text-muted">{METRIC_HINT[metric]}</span>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {draftSets.map((s, i) => (
              <motion.div
                key={s.key}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="w-6 shrink-0 text-center text-sm font-bold text-faint">{i + 1}</span>
                <MetricInputs
                  metric={metric}
                  unit={unitLabel}
                  draft={s}
                  onChange={(field, val) => updateSet(s.key, field, val)}
                />
                <button
                  onClick={() => removeRow(s.key)}
                  aria-label="Remove set"
                  className="shrink-0 rounded-lg p-2 text-faint transition hover:text-danger active:scale-90"
                >
                  <X size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={addRow}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-bold uppercase tracking-wide text-muted transition hover:border-accent hover:text-accent active:scale-[0.98]"
        >
          <Plus size={16} /> Add Set
        </button>
      </div>

      {/* Summary + COMMIT */}
      <div className="mt-4 card flex items-center justify-between">
        <div>
          <span className="label">This Session</span>
          <p className="mt-1 text-lg font-extrabold text-accent">{preview.summary}</p>
          <p className="mt-0.5 text-xs text-muted">
            {validDraft.length} valid {validDraft.length === 1 ? 'set' : 'sets'}
          </p>
        </div>
        <button
          onClick={commitLog}
          disabled={loggedSets.length === 0}
          className="btn-accent min-w-[9rem] disabled:opacity-100"
        >
          {justSaved ? (
            <>
              <Check size={18} /> Logged
            </>
          ) : (
            <>
              <Save size={18} /> Commit Log
            </>
          )}
        </button>
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Recent Logs</h2>
        {workoutHistory.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-8 text-faint">
            <Dumbbell size={26} />
            <p className="text-sm">No workouts committed yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workoutHistory.slice(0, 25).map((w) => (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex items-center justify-between gap-3 !p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ background: w.color || '#00FFCC' }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{w.exercise}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {w.summary} · {humanDate(w.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {w.totalVolume > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-accent">{fmt(w.totalVolume)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted">kg vol</p>
                    </div>
                  )}
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    aria-label="Delete log"
                    className="rounded-lg p-2 text-faint transition hover:text-danger active:scale-90"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MetricInputs({
  metric,
  unit,
  draft,
  onChange,
}: {
  metric: MetricType;
  unit: string;
  draft: DraftSet;
  onChange: (field: keyof DraftSet, value: string) => void;
}) {
  const field = (
    key: keyof DraftSet,
    placeholder: string,
    mode: 'decimal' | 'numeric' = 'numeric'
  ) => (
    <input
      inputMode={mode}
      placeholder={placeholder}
      value={draft[key]}
      onChange={(e) => onChange(key, e.target.value)}
      className="input-field text-center"
    />
  );

  if (metric === 'weight-reps') {
    return (
      <>
        {field('weight', 'kg', 'decimal')}
        <span className="text-faint">×</span>
        {field('reps', 'reps')}
      </>
    );
  }
  if (metric === 'reps') return field('reps', 'reps');
  if (metric === 'seconds') return field('seconds', 'seconds');
  if (metric === 'distance') return field('distance', unit || 'meters', 'decimal');
  return field('value', unit || 'amount', 'decimal');
}
