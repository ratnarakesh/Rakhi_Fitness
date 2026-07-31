'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface Point {
  t: number; // epoch ms
  v: number;
}

type Range = '1D' | '3D' | '1W' | '1M' | '1Y';
const RANGE_DAYS: Record<Range, number> = { '1D': 1, '3D': 3, '1W': 7, '1M': 30, '1Y': 365 };
const RANGES: Range[] = ['1D', '3D', '1W', '1M', '1Y'];

interface Props {
  title: string;
  data: Point[];
  color?: string;
  unit?: string;
  kind?: 'line' | 'bar';
  /** now in ms — passed in so the component stays deterministic. */
  now: number;
}

const H = 190; // svg height
const PAD_T = 18;
const PAD_B = 26;
const SLOT = 46; // px per point (drives horizontal scroll)

export default function AnalysisChart({
  title,
  data,
  color = '#00FFCC',
  unit = '',
  kind = 'line',
  now,
}: Props) {
  const [range, setRange] = useState<Range>('1M');
  const [sel, setSel] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const points = useMemo(() => {
    const cutoff = now - RANGE_DAYS[range] * 86_400_000;
    return data.filter((p) => p.t >= cutoff).sort((a, b) => a.t - b.t);
  }, [data, range, now]);

  // Keep the latest data in view; reset selection on range change.
  useEffect(() => {
    setSel(null);
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [range, points.length]);

  const width = Math.max(320, points.length * SLOT + 24);
  const innerW = width - 24;

  const { min, max } = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 1 };
    const vs = points.map((p) => p.v);
    let lo = Math.min(...vs);
    let hi = Math.max(...vs);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.15;
    return { min: lo - pad, max: hi + pad };
  }, [points]);

  const x = (i: number) =>
    points.length === 1 ? innerW / 2 + 12 : 12 + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.v)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${x(points.length - 1)} ${H - PAD_B} L ${x(0)} ${H - PAD_B} Z`
      : '';

  const fmtDate = (t: number) => {
    const d = new Date(t);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const fmtVal = (v: number) => `${v % 1 === 0 ? v : v.toFixed(1)}${unit ? ' ' + unit : ''}`;

  const latest = points.length ? points[points.length - 1] : null;
  const first = points.length ? points[0] : null;
  const delta = latest && first ? +(latest.v - first.v).toFixed(1) : 0;

  return (
    <div className="card">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <p className="label">{title}</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-extrabold text-white">
              {latest ? fmtVal(latest.v) : '—'}
            </span>
            {latest && first && (
              <span
                className={cn(
                  'mb-1 text-xs font-bold',
                  delta === 0 ? 'text-muted' : delta > 0 ? 'text-accent' : 'text-danger'
                )}
              >
                {delta > 0 ? '+' : ''}
                {delta} {unit}
              </span>
            )}
          </div>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 rounded-lg border border-border bg-surface-alt p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-bold transition',
                range === r ? 'bg-accent text-background' : 'text-muted'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="flex h-[190px] items-center justify-center text-sm text-faint">
          No data in this range yet.
        </div>
      ) : (
        <div ref={scrollRef} className="mt-2 overflow-x-auto" data-testid="chart-scroll">
          <svg width={width} height={H} className="block">
            <defs>
              <linearGradient id={`grad-${title.replace(/\s/g, '')}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* recessive gridlines */}
            {[0, 0.5, 1].map((g) => {
              const gy = PAD_T + g * (H - PAD_T - PAD_B);
              return (
                <line key={g} x1={12} x2={innerW + 12} y1={gy} y2={gy} stroke="#1E1E1E" strokeWidth="1" />
              );
            })}

            {kind === 'bar' ? (
              points.map((p, i) => {
                const bw = Math.min(26, innerW / points.length - 6);
                const by = y(p.v);
                const active = sel === i;
                return (
                  <g key={i} onClick={() => setSel(active ? null : i)} style={{ cursor: 'pointer' }}>
                    <rect
                      x={x(i) - bw / 2}
                      y={by}
                      width={bw}
                      height={H - PAD_B - by}
                      rx="4"
                      fill={color}
                      opacity={active ? 1 : 0.85}
                    />
                    <rect
                      x={x(i) - SLOT / 2}
                      y={PAD_T}
                      width={SLOT}
                      height={H - PAD_T}
                      fill="transparent"
                    />
                  </g>
                );
              })
            ) : (
              <>
                <path d={areaPath} fill={`url(#grad-${title.replace(/\s/g, '')})`} />
                <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <g key={i} onClick={() => setSel(sel === i ? null : i)} style={{ cursor: 'pointer' }}>
                    <circle cx={x(i)} cy={y(p.v)} r={sel === i ? 5 : 3.2} fill={color} />
                    <rect
                      x={x(i) - SLOT / 2}
                      y={PAD_T}
                      width={SLOT}
                      height={H - PAD_T}
                      fill="transparent"
                    />
                  </g>
                ))}
              </>
            )}

            {/* x labels: first, middle, last */}
            {points.length > 0 &&
              [0, Math.floor((points.length - 1) / 2), points.length - 1]
                .filter((v, idx, a) => a.indexOf(v) === idx)
                .map((i) => (
                  <text
                    key={i}
                    x={x(i)}
                    y={H - 8}
                    textAnchor="middle"
                    className="fill-faint"
                    style={{ fontSize: 10 }}
                  >
                    {fmtDate(points[i].t)}
                  </text>
                ))}

            {/* selected tooltip */}
            {sel !== null && points[sel] && (
              <g>
                <line
                  x1={x(sel)}
                  x2={x(sel)}
                  y1={PAD_T}
                  y2={H - PAD_B}
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
                <g transform={`translate(${Math.min(Math.max(x(sel), 44), innerW - 32)}, ${PAD_T})`}>
                  <rect x={-42} y={-2} width={84} height={34} rx="6" fill="#1A1A1A" stroke="#242424" />
                  <text x={0} y={11} textAnchor="middle" fill="#fff" style={{ fontSize: 11, fontWeight: 700 }}>
                    {fmtVal(points[sel].v)}
                  </text>
                  <text x={0} y={24} textAnchor="middle" fill="#8A8A8A" style={{ fontSize: 9 }}>
                    {fmtDate(points[sel].t)}
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>
      )}
      <p className="mt-1 text-[11px] text-faint">
        {points.length} point{points.length === 1 ? '' : 's'} · tap a point for detail · scroll ←→ for history
      </p>
    </div>
  );
}
