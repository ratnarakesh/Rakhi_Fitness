'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Dumbbell, ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { useGlobal, type MetricType } from '@/context/GlobalContext';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Legs', 'Chest', 'Triceps', 'Shoulders', 'Biceps', 'Back',
  'Forearms', 'Abs', 'Cardio', 'Custom',
];

const METRICS: { value: MetricType; label: string; hint: string }[] = [
  { value: 'weight-reps', label: 'Weight × Reps', hint: 'e.g. 60kg × 10' },
  { value: 'reps', label: 'Reps', hint: 'e.g. 20 reps' },
  { value: 'seconds', label: 'Seconds', hint: 'e.g. 60s plank' },
  { value: 'distance', label: 'Distance', hint: 'e.g. 2000 m row' },
  { value: 'custom', label: 'Custom', hint: 'your own unit' },
];

const COLORS = [
  '#00FFCC', '#5AB0FF', '#FFB020', '#FF5A5F', '#B980FF',
  '#33D17A', '#FF8A5B', '#F45D9C', '#7DD3FC', '#FDE047',
];

function readImage(file: File, cb: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') cb(reader.result);
  };
  reader.readAsDataURL(file);
}

export default function AddExercisePage() {
  const router = useRouter();
  const { addCustomExercise } = useGlobal();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [metricType, setMetricType] = useState<MetricType>('weight-reps');
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [machinePhoto, setMachinePhoto] = useState('');
  const [demoPhoto, setDemoPhoto] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const machineRef = useRef<HTMLInputElement>(null);
  const demoRef = useRef<HTMLInputElement>(null);

  const canSave = name.trim().length > 0;
  const needsUnit = metricType === 'custom' || metricType === 'distance';

  const handleSave = () => {
    if (!canSave) return;
    addCustomExercise({
      name: name.trim(),
      category,
      metricType,
      unit: needsUnit ? unit.trim() || (metricType === 'distance' ? 'm' : 'unit') : undefined,
      color,
      machinePhoto: machinePhoto || undefined,
      demoPhoto: demoPhoto || undefined,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => router.push('/tracker'), 700);
  };

  return (
    <div className="px-5 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/tracker"
          aria-label="Back"
          className="rounded-lg border border-border p-2 text-muted active:scale-90"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Create</p>
          <h1 className="text-2xl font-extrabold tracking-tight">New Exercise</h1>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cable Fly, Skipping"
            className="input-field mt-1"
            data-testid="ex-name"
          />
        </div>

        <div>
          <label className="label">Category</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
        </div>

        <div>
          <label className="label">How do you measure it?</label>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {METRICS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMetricType(m.value)}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition active:scale-[0.99]',
                  metricType === m.value
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface-alt'
                )}
              >
                <span className="text-sm font-bold text-white">{m.label}</span>
                <span className="text-xs text-muted">{m.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {needsUnit && (
          <div>
            <label className="label">Unit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={metricType === 'distance' ? 'meters / km' : 'e.g. calories, rounds'}
              className="input-field mt-1"
            />
          </div>
        )}

        <div>
          <label className="label">Color Tag</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={cn(
                  'h-9 w-9 rounded-full border-2 transition active:scale-90',
                  color === c ? 'border-white' : 'border-transparent'
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-3">
          <PhotoPicker
            label="Machine Photo"
            value={machinePhoto}
            onPick={() => machineRef.current?.click()}
            onClear={() => setMachinePhoto('')}
          />
          <PhotoPicker
            label="Exercise Photo"
            value={demoPhoto}
            onPick={() => demoRef.current?.click()}
            onClear={() => setDemoPhoto('')}
          />
        </div>
        <input
          ref={machineRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readImage(f, setMachinePhoto);
            e.target.value = '';
          }}
        />
        <input
          ref={demoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readImage(f, setDemoPhoto);
            e.target.value = '';
          }}
        />

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Setup, seat height, grip, tips…"
            rows={2}
            className="input-field mt-1 resize-none"
          />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={!canSave}
        className="btn-accent mt-6 w-full disabled:opacity-60"
        data-testid="ex-save"
      >
        {saved ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : (
          <>
            <Dumbbell size={18} /> Save Exercise
          </>
        )}
      </motion.button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95',
        active ? 'border-accent bg-accent text-background' : 'border-border bg-surface-alt text-muted'
      )}
    >
      {label}
    </button>
  );
}

function PhotoPicker({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value: string;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {value ? (
        <div className="relative mt-1 overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-28 w-full object-cover" />
          <button
            onClick={onClear}
            aria-label={`Remove ${label}`}
            className="absolute right-1.5 top-1.5 rounded-lg bg-black/70 p-1.5 text-white active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={onPick}
          className="mt-1 flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface-alt text-faint transition hover:border-accent hover:text-accent"
        >
          <Camera size={20} />
          <span className="flex items-center gap-1 text-[11px] font-semibold">
            <ImageIcon size={12} /> Add
          </span>
        </button>
      )}
    </div>
  );
}
