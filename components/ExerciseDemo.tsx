'use client';

import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Exercise } from '@/lib/exercises';

/**
 * Animated exercise demonstration. Prefers a local looping GIF override
 * (/gifs/<id>.gif) when configured; otherwise alternates the two public-domain
 * frames to simulate the rep. Falls back to a placeholder if media fails.
 */
export default function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const [frame, setFrame] = useState(0);
  const [errored, setErrored] = useState(false);

  // Reset animation + error state whenever the selected exercise changes.
  useEffect(() => {
    setFrame(0);
    setErrored(false);
  }, [exercise.id]);

  // Alternate the two frames to animate (skip if a GIF override is used).
  useEffect(() => {
    if (exercise.gif) return;
    const t = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 900);
    return () => clearInterval(t);
  }, [exercise.id, exercise.gif]);

  if (errored) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-faint">
        <ImageOff size={28} />
        <p className="text-xs">Demo unavailable offline</p>
      </div>
    );
  }

  // Local GIF override path.
  if (exercise.gif) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={exercise.gif}
        alt={`${exercise.name} technique`}
        className="h-full w-full object-contain"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      {exercise.frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${exercise.name} ${i === 0 ? 'start' : 'end'} position`}
          className="absolute inset-0 h-full w-full bg-white object-contain transition-opacity duration-500"
          style={{ opacity: frame === i ? 1 : 0 }}
          onError={() => setErrored(true)}
        />
      ))}
      {/* Live "rep" badge */}
      <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent backdrop-blur">
        {frame === 0 ? 'Start' : 'End'}
      </span>
    </div>
  );
}
