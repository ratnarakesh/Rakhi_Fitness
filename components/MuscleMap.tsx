'use client';

import Model, { type IExerciseData, type Muscle } from 'react-body-highlighter';

import type { Exercise, MuscleGroup } from '@/lib/exercises';

/**
 * Anatomical muscle-activation map. Renders front + back body SVGs and shades
 * the worked muscles — primary movers in red, secondary in green — driven by
 * the exercise's muscle data. Free & open-source (react-body-highlighter, MIT).
 */

// Map our display muscle groups onto the library's muscle vocabulary.
const MAP: Record<MuscleGroup, Muscle[]> = {
  Chest: ['chest'],
  Shoulders: ['front-deltoids', 'back-deltoids'],
  Triceps: ['triceps'],
  Back: ['upper-back'],
  Lats: ['upper-back'],
  Biceps: ['biceps'],
  Forearms: ['forearm'],
  Quads: ['quadriceps'],
  Hamstrings: ['hamstring'],
  Glutes: ['gluteal'],
  Calves: ['calves'],
  Core: ['abs', 'obliques'],
  Traps: ['trapezius'],
  'Lower Back': ['lower-back'],
};

function toMuscles(groups: MuscleGroup[]): Muscle[] {
  const set = new Set<Muscle>();
  for (const g of groups) for (const m of MAP[g] ?? []) set.add(m);
  return [...set];
}

// frequency 1 -> green (secondary), frequency 2 -> red (primary)
const COLORS = ['#2FBF71', '#FF3B3B'];
const BODY_COLOR = '#3A3A3A';

export default function MuscleMap({ exercise }: { exercise: Exercise }) {
  const primary = toMuscles(exercise.primaryMuscles);
  const primarySet = new Set(primary);
  const secondary = toMuscles(exercise.secondaryMuscles).filter(
    (m) => !primarySet.has(m)
  );

  const data: IExerciseData[] = [
    { name: 'secondary', muscles: secondary, frequency: 1 },
    { name: 'primary', muscles: primary, frequency: 2 },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center gap-4 bg-[#0c0c0c] px-4 py-3">
      <Model
        data={data}
        type="anterior"
        bodyColor={BODY_COLOR}
        highlightedColors={COLORS}
        style={{ width: '42%', maxHeight: '100%' }}
      />
      <Model
        data={data}
        type="posterior"
        bodyColor={BODY_COLOR}
        highlightedColors={COLORS}
        style={{ width: '42%', maxHeight: '100%' }}
      />
    </div>
  );
}
