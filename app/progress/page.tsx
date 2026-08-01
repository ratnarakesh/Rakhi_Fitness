'use client';

import { motion } from 'framer-motion';
import { Camera, Check, ChevronRight, ImageIcon, Trash2, Weight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import AnalysisChart, { type Point } from '@/components/AnalysisChart';
import { useAuth } from '@/context/AuthContext';
import { toDateKey, useGlobal } from '@/context/GlobalContext';
import { fmt, humanDate } from '@/lib/utils';

export default function ProgressPage() {
  const {
    currentWeight,
    targetWeight,
    setCurrentWeight,
    weightLog,
    workoutHistory,
    progressPhotos,
    addPhoto,
    deletePhoto,
  } = useGlobal();

  const { enabled, user } = useAuth();
  const gated = enabled && !user; // bodyweight logging is a private detail

  const now = Date.now();

  // Bodyweight series (fall back to a single current point if no history).
  const weightData: Point[] = useMemo(() => {
    const pts = weightLog.map((w) => ({ t: Date.parse(w.createdAt), v: w.kg }));
    if (pts.length === 0 && currentWeight > 0) return [{ t: now, v: currentWeight }];
    return pts;
  }, [weightLog, currentWeight, now]);

  // Training volume per day (sum of weight×reps logs).
  const volumeData: Point[] = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const w of workoutHistory) {
      if (w.totalVolume > 0) {
        const key = toDateKey(new Date(w.createdAt));
        byDay.set(key, (byDay.get(key) ?? 0) + w.totalVolume);
      }
    }
    return [...byDay.entries()]
      .map(([key, v]) => ({ t: Date.parse(`${key}T12:00:00`), v }))
      .sort((a, b) => a.t - b.t);
  }, [workoutHistory]);

  const [weightInput, setWeightInput] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const commitWeight = () => {
    const kg = parseFloat(weightInput.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) return;
    setCurrentWeight(+kg.toFixed(1));
    setWeightInput('');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addPhoto({ dataUrl: reader.result, weight: currentWeight });
      }
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);

    // Reset input so the same file can be captured again.
    e.target.value = '';
  };

  return (
    <div className="px-5 pt-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          Analysis
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Progress</h1>
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <AnalysisChart title="Bodyweight" data={weightData} unit="kg" kind="line" now={now} />
        <AnalysisChart
          title="Training Volume"
          data={volumeData}
          unit="kg"
          kind="bar"
          color="#5AB0FF"
          now={now}
        />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
        Body Metrics
      </h2>

      {/* Bodyweight update card (gated for guests) */}
      {gated ? (
        <Link href="/account" className="card flex items-center justify-between active:scale-[0.99]">
          <div>
            <p className="font-bold text-white">Sign in to log bodyweight</p>
            <p className="mt-0.5 text-xs text-muted">Your weight is private to your account</p>
          </div>
          <ChevronRight size={20} className="text-accent" />
        </Link>
      ) : (
      <div className="card">
        <div className="flex items-center gap-2 text-muted">
          <Weight size={16} className="text-accent" />
          <span className="label">Update Bodyweight</span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-accent">
                {currentWeight > 0 ? currentWeight : '—'}
              </span>
              <span className="mb-1 text-sm font-semibold text-muted">kg</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {targetWeight > 0 ? `Target ${targetWeight} kg` : 'No target set'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            inputMode="decimal"
            placeholder="Enter new weight (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="input-field"
          />
          <button onClick={commitWeight} className="btn-accent min-w-[7rem]">
            {savedFlash ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </div>
      )}

      {/* Camera capture */}
      <div className="mt-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleCapture}
          className="hidden"
        />
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 px-5 py-5 text-accent transition active:scale-[0.98] disabled:opacity-60"
        >
          <Camera size={24} strokeWidth={2.5} />
          <span className="text-base font-extrabold uppercase tracking-wide">
            {uploading ? 'Processing…' : 'Capture Progress Photo'}
          </span>
        </motion.button>
        <p className="mt-2 text-center text-xs text-muted">
          Front camera opens on mobile · tagged at {currentWeight} kg
        </p>
      </div>

      {/* Masonry timeline */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Visual Timeline
          {progressPhotos.length > 0 && (
            <span className="ml-2 text-accent">{progressPhotos.length}</span>
          )}
        </h2>

        {progressPhotos.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-faint">
            <ImageIcon size={28} />
            <p className="text-sm">No photos yet. Capture your first checkpoint.</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 [column-fill:balance]">
            {progressPhotos.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.dataUrl}
                  alt={`Progress ${humanDate(p.createdAt)}`}
                  className="w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                  <p className="text-sm font-extrabold text-accent">{fmt(p.weight)} kg</p>
                  <p className="text-[10px] uppercase tracking-wide text-white/70">
                    {humanDate(p.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => deletePhoto(p.id)}
                  aria-label="Delete photo"
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white/80 backdrop-blur transition hover:bg-danger hover:text-white active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
