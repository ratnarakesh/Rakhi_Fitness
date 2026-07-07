/**
 * Pre-configured movement matrix for the tracker.
 *
 * Demonstration media: each exercise has two public-domain frames (start / end
 * position) from the open-source free-exercise-db. The tracker alternates them
 * to animate the rep — free, reliable, no licensing cost.
 *
 * Local override: drop a looping GIF at /public/gifs/<id>.gif and set `gif` to
 * that path; the UI prefers it when present.
 */

const MEDIA_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export interface Exercise {
  id: string;
  name: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core';
  /** [start, end] demonstration frames (absolute URLs). */
  frames: [string, string];
  /** Optional local GIF override served from /public/gifs. */
  gif?: string;
}

function frames(startPath: string, endPath: string): [string, string] {
  return [`${MEDIA_BASE}/${startPath}`, `${MEDIA_BASE}/${endPath}`];
}

export const EXERCISES: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    category: 'Push',
    frames: frames(
      'Barbell_Bench_Press_-_Medium_Grip/0.jpg',
      'Barbell_Bench_Press_-_Medium_Grip/1.jpg'
    ),
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'Push',
    frames: frames('Standing_Military_Press/0.jpg', 'Standing_Military_Press/1.jpg'),
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    category: 'Push',
    frames: frames('Incline_Dumbbell_Press/0.jpg', 'Incline_Dumbbell_Press/1.jpg'),
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Pull',
    frames: frames('Wide-Grip_Lat_Pulldown/0.jpg', 'Wide-Grip_Lat_Pulldown/1.jpg'),
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'Pull',
    frames: frames('Bent_Over_Barbell_Row/0.jpg', 'Bent_Over_Barbell_Row/1.jpg'),
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'Pull',
    frames: frames('Barbell_Deadlift/0.jpg', 'Barbell_Deadlift/1.jpg'),
  },
  {
    id: 'back-squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    frames: frames('Barbell_Full_Squat/0.jpg', 'Barbell_Full_Squat/1.jpg'),
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'Legs',
    frames: frames('Leg_Press/0.jpg', 'Leg_Press/1.jpg'),
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'Legs',
    frames: frames('Romanian_Deadlift/0.jpg', 'Romanian_Deadlift/1.jpg'),
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Core',
    frames: frames('Hanging_Leg_Raise/0.jpg', 'Hanging_Leg_Raise/1.jpg'),
  },
];

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
