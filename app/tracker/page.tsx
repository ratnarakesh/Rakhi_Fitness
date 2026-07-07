'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Dumbbell,
  Info,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ExerciseDemo from '@/components/ExerciseDemo';
import { useGlobal, type WorkoutSet } from '@/context/GlobalContext';
import { EXERCISES, getExercise } from '@/lib/exercises';
import { cn, fmt, humanDate } from '@/lib/utils';

interface DraftSet {
  key: string;
  weight: string;
  reps: string;
}

let keyCounter = 0;
const nextKey = () => `set-${keyCounter++}`;

function emptySet(): DraftSet {
  return { key: nextKey(), weight: '', reps: '' };
}

function toNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export default function TrackerPage() {
  const { workoutHistory, addWorkout, deleteWorkout } = useGlobal();

  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [showForm, setShowForm] = useState(false);
  const [draftSets, setDraftSets] = useState<DraftSet[]>([emptySet(), emptySet(), emptySet()]);
  const [justSaved, setJustSaved] = useState(false);

  const exercise = getExercise(exerciseId)!;

  // Pre-select an exercise when deep-linked from the plan (/tracker?exercise=id).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('exercise');
    if (q && getExercise(q)) setExerciseId(q);
  }, []);

  // Live volume preview over the valid rows.
  const validSets = draftSets.filter((s) => toNum(s.weight) > 0 && toNum(s.reps) > 0);
  const previewVolume = useMemo(
    () => validSets.reduce((sum, s) => sum + toNum(s.weight) * toNum(s.reps), 0),
    [validSets]
  );

  const updateSet = (key: string, field: 'weight' | 'reps', value: string) =>
    setDraftSets((rows) =>
      rows.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );

  const addRow = () => setDraftSets((rows) => [...rows, emptySet()]);
  const removeRow = (key: string) =>
    setDraftSets((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));

  const handleExerciseChange = (id: string) => {
    setExerciseId(id);
  };

  const commitLog = () => {
    // Filter empty inputs, then map into the persisted schema.
    const sets: WorkoutSet[] = validSets.map((s) => ({
      weight: toNum(s.weight),
      reps: toNum(s.reps),
    }));
    if (sets.length === 0) return;

    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);

    addWorkout({
      exerciseId: exercise.id,
      exercise: exercise.name,
      category: exercise.category,
      sets,
      totalSets: sets.length,
      totalReps,
      totalVolume,
    });

    // Reset the draft to a fresh 3-row card.
    setDraftSets([emptySet(), emptySet(), emptySet()]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  return (
    <div className="px-5 pt-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          Volume Engine
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Tracker</h1>
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
            {EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-surface">
                {ex.name} · {ex.category}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
            ▾
          </span>
        </div>

        {/* Execution frame — animated demonstration for the selected exercise */}
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
          <ExerciseDemo exercise={exercise} />
        </div>

        {/* Muscles worked */}
        <div className="mt-3">
          <p className="label mb-2">Muscles Worked</p>
          <div className="flex flex-wrap gap-1.5">
            {exercise.primaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-md bg-accent/15 px-2 py-1 text-xs font-bold text-accent"
              >
                {m}
              </span>
            ))}
            {exercise.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-md bg-surface-alt px-2 py-1 text-xs font-semibold text-muted"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Correct form */}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-lg bg-surface-alt px-3 py-2.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <Info size={15} className="text-accent" /> How to do it correctly
          </span>
          <ChevronDown
            size={16}
            className={cn('text-muted transition', showForm && 'rotate-180')}
          />
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
      </div>

      {/* Set rows */}
      <div className="mt-4 card">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Working Sets</span>
          <span className="text-xs text-muted">weight (kg) × reps</span>
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
                <span className="w-6 shrink-0 text-center text-sm font-bold text-faint">
                  {i + 1}
                </span>
                <input
                  inputMode="decimal"
                  placeholder="kg"
                  value={s.weight}
                  onChange={(e) => updateSet(s.key, 'weight', e.target.value)}
                  className="input-field text-center"
                />
                <span className="text-faint">×</span>
                <input
                  inputMode="numeric"
                  placeholder="reps"
                  value={s.reps}
                  onChange={(e) => updateSet(s.key, 'reps', e.target.value)}
                  className="input-field text-center"
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

      {/* Volume preview + COMMIT LOG */}
      <div className="mt-4 card flex items-center justify-between">
        <div>
          <span className="label">Total Volume</span>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-3xl font-extrabold text-accent">
              {fmt(previewVolume)}
            </span>
            <span className="mb-0.5 text-xs font-semibold text-muted">kg</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {validSets.length} valid {validSets.length === 1 ? 'set' : 'sets'}
          </p>
        </div>
        <button
          onClick={commitLog}
          disabled={validSets.length === 0}
          className={cn('btn-accent min-w-[9rem]', justSaved && 'bg-accent')}
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
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Recent Logs
        </h2>
        {workoutHistory.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-8 text-faint">
            <Dumbbell size={26} />
            <p className="text-sm">No workouts committed yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workoutHistory.map((w) => (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex items-center justify-between !p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{w.exercise}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {w.totalSets} sets · {w.totalReps} reps · {humanDate(w.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-accent">
                      {fmt(w.totalVolume)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      kg vol
                    </p>
                  </div>
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
