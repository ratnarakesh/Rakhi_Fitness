'use client';

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
}

/** Simple SVG progress ring, themed via the accent CSS variable. */
export default function ProgressRing({ value, max, size = 64, stroke = 6, center }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const r = 15.9155; // circumference ~= 100
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgb(var(--c-surface-alt))" strokeWidth={stroke} />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="rgb(var(--c-accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${pct * 100}, 100`}
          style={{ transition: 'stroke-dasharray .5s ease' }}
        />
      </svg>
      {center != null && (
        <div className="absolute inset-0 flex items-center justify-center">{center}</div>
      )}
    </div>
  );
}
