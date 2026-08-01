'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Check, Trash2, Wine } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import AnalysisChart, { type Point } from '@/components/AnalysisChart';
import { toDateKey, useGlobal } from '@/context/GlobalContext';
import { DRINK_TYPES, getDrinkType, unitsFor } from '@/lib/alcohol';
import { cn, fmt, humanDate } from '@/lib/utils';

function toNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export default function AlcoholPage() {
  const { alcoholLogs, addAlcohol, deleteAlcohol } = useGlobal();

  const now = Date.now();
  const [typeId, setTypeId] = useState('beer');
  const [ml, setMl] = useState(String(getDrinkType('beer').serving));
  const [count, setCount] = useState('1');
  const [saved, setSaved] = useState(false);

  const drink = getDrinkType(typeId);
  const perMl = toNum(ml);
  const c = Math.max(1, Math.round(toNum(count) || 1));
  const totalMl = perMl * c;
  const previewUnits = unitsFor(totalMl, drink.abv);

  const chooseType = (id: string) => {
    setTypeId(id);
    setMl(String(getDrinkType(id).serving));
  };

  const log = () => {
    if (totalMl <= 0) return;
    addAlcohol({ type: drink.label, volumeMl: totalMl, count: c, units: previewUnits });
    setCount('1');
    setMl(String(drink.serving));
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const todayKey = toDateKey();
  const today = alcoholLogs.filter((a) => toDateKey(new Date(a.createdAt)) === todayKey);
  const todayDrinks = today.reduce((n, a) => n + a.count, 0);
  const todayMl = today.reduce((n, a) => n + a.volumeMl, 0);
  const todayUnits = +today.reduce((n, a) => n + a.units, 0).toFixed(1);

  const weekCutoff = now - 7 * 86_400_000;
  const weekUnits = +alcoholLogs
    .filter((a) => Date.parse(a.createdAt) >= weekCutoff)
    .reduce((n, a) => n + a.units, 0)
    .toFixed(1);

  // Daily units for the chart.
  const chartData: Point[] = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const a of alcoholLogs) {
      const key = toDateKey(new Date(a.createdAt));
      byDay.set(key, (byDay.get(key) ?? 0) + a.units);
    }
    return [...byDay.entries()]
      .map(([k, v]) => ({ t: Date.parse(`${k}T12:00:00`), v: +v.toFixed(2) }))
      .sort((x, y) => x.t - y.t);
  }, [alcoholLogs]);

  return (
    <div className="px-5 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back"
          className="rounded-lg border border-border p-2 text-muted active:scale-90"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-warning">Tracker</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Alcohol</h1>
        </div>
      </div>

      {/* Today summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Drinks" value={String(todayDrinks)} tone="text-white" />
        <Stat label="Volume" value={`${fmt(todayMl)}`} unit="ml" tone="text-white" />
        <Stat label="Units" value={String(todayUnits)} tone="text-warning" />
      </div>
      <p className="mb-4 px-1 text-[11px] text-faint">
        Today · {todayUnits} units · this week {weekUnits} units. 1 unit ≈ 10 g pure alcohol.
      </p>

      {/* Quick log */}
      <div className="card">
        <p className="label mb-2">What are you drinking?</p>
        <div className="flex flex-wrap gap-2">
          {DRINK_TYPES.map((d) => (
            <button
              key={d.id}
              onClick={() => chooseType(d.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95',
                typeId === d.id ? 'text-background' : 'border-border bg-surface-alt text-muted'
              )}
              style={typeId === d.id ? { background: d.color, borderColor: d.color } : undefined}
            >
              {d.label} · {d.abv}%
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (ml each)</label>
            <input
              inputMode="numeric"
              value={ml}
              onChange={(e) => setMl(e.target.value)}
              className="input-field mt-1"
              data-testid="alc-ml"
            />
          </div>
          <div>
            <label className="label">Count</label>
            <input
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="input-field mt-1"
              data-testid="alc-count"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3">
          <span className="text-xs text-muted">
            {c} × {fmt(perMl)} ml = <span className="font-bold text-white">{fmt(totalMl)} ml</span>
          </span>
          <span className="text-sm font-extrabold text-warning">≈ {previewUnits} units</span>
        </div>

        <button
          onClick={log}
          disabled={totalMl <= 0}
          className="btn-accent mt-4 w-full disabled:opacity-60"
          data-testid="alc-log"
        >
          {saved ? (
            <>
              <Check size={18} /> Logged
            </>
          ) : (
            <>
              <Wine size={18} /> Log Drink
            </>
          )}
        </button>
      </div>

      {/* Chart */}
      <div className="mt-4">
        <AnalysisChart title="Alcohol (units)" data={chartData} unit="u" kind="bar" color="#FF8A5B" now={now} />
      </div>

      {/* History */}
      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">History</h2>
      {alcoholLogs.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-8 text-faint">
          <Wine size={26} />
          <p className="text-sm">No drinks logged. Cheers to that 🥂</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alcoholLogs.slice(0, 40).map((a) => {
            const color = getDrinkType(
              DRINK_TYPES.find((d) => d.label === a.type)?.id ?? 'other'
            ).color;
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex items-center justify-between gap-3 !p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  <div className="min-w-0">
                    <p className="font-bold text-white">
                      {a.type}{' '}
                      <span className="text-xs font-normal text-muted">
                        {a.count} × {fmt(a.volumeMl / a.count)} ml
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {fmt(a.volumeMl)} ml · {new Date(a.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-base font-extrabold text-warning">{a.units}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">units</p>
                  </div>
                  <button
                    onClick={() => deleteAlcohol(a.id)}
                    aria-label="Delete drink"
                    className="rounded-lg p-2 text-faint transition hover:text-danger active:scale-90"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="card !p-3 text-center">
      <p className="label">{label}</p>
      <p className={cn('mt-1 text-xl font-extrabold', tone)}>
        {value}
        {unit && <span className="text-xs text-muted"> {unit}</span>}
      </p>
    </div>
  );
}
