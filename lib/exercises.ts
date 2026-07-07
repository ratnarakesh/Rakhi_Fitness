/**
 * Pre-configured movement matrix for the tracker.
 *
 * Demonstration media: each exercise has two public-domain frames (start / end
 * position) from the open-source free-exercise-db. The tracker alternates them
 * to animate the rep — free, reliable, no licensing cost.
 *
 * Each movement also carries the muscles it targets and concise form cues so
 * the user sees *what it impacts* and *how to do it correctly*.
 *
 * Local override: drop a looping GIF at /public/gifs/<id>.gif and set `gif` to
 * that path; the UI prefers it when present.
 */

const MEDIA_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export type MuscleGroup =
  | 'Chest'
  | 'Shoulders'
  | 'Triceps'
  | 'Back'
  | 'Lats'
  | 'Biceps'
  | 'Forearms'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Traps'
  | 'Lower Back';

export interface Exercise {
  id: string;
  name: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Forearms';
  /** [start, end] demonstration frames (absolute URLs). */
  frames: [string, string];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Concise correct-form cues, shown step-by-step in the tracker. */
  formCues: string[];
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
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    level: 'Beginner',
    formCues: [
      'Lie flat, grip slightly wider than shoulders, arms locked over chest.',
      'Lower the bar slowly to mid-chest, elbows ~45°.',
      'Drive up powerfully through the chest and lock out.',
      'Lower twice as slow as you press.',
    ],
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'Push',
    frames: frames('Standing_Military_Press/0.jpg', 'Standing_Military_Press/1.jpg'),
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps'],
    level: 'Beginner',
    formCues: [
      'Bar on front delts, grip just outside shoulders, brace core.',
      'Press straight up, moving head slightly back then through.',
      'Lock out overhead with biceps by ears.',
      'Lower under control to the collarbone.',
    ],
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    category: 'Push',
    frames: frames('Incline_Dumbbell_Press/0.jpg', 'Incline_Dumbbell_Press/1.jpg'),
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    level: 'Beginner',
    formCues: [
      'Set bench to 30°, dumbbells at shoulder width, palms forward.',
      'Lower until you feel a stretch across the upper chest.',
      'Press up and slightly together, squeezing the chest.',
      'Keep control — no bouncing at the bottom.',
    ],
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Pull',
    frames: frames('Wide-Grip_Lat_Pulldown/0.jpg', 'Wide-Grip_Lat_Pulldown/1.jpg'),
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Back', 'Shoulders'],
    level: 'Beginner',
    formCues: [
      'Wide grip, chest up, lean back ~30°.',
      'Pull the bar to your upper chest, driving elbows down.',
      'Squeeze the lats hard at the bottom.',
      'Control the bar back up to a full stretch.',
    ],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'Pull',
    frames: frames('Bent_Over_Barbell_Row/0.jpg', 'Bent_Over_Barbell_Row/1.jpg'),
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Lats', 'Biceps', 'Shoulders'],
    level: 'Beginner',
    formCues: [
      'Hinge to ~45°, back flat, bar hanging at arms length.',
      'Row the bar to your lower ribs, elbows close.',
      'Squeeze the shoulder blades together at the top.',
      'Lower slowly, keep the torso still.',
    ],
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'Pull',
    frames: frames('Barbell_Deadlift/0.jpg', 'Barbell_Deadlift/1.jpg'),
    primaryMuscles: ['Lower Back'],
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Traps', 'Forearms', 'Quads'],
    level: 'Intermediate',
    formCues: [
      'Bar over mid-foot, shins close, grip just outside legs.',
      'Flat back, chest up, take the slack out of the bar.',
      'Drive through the floor, hips and chest rise together.',
      'Lock out tall, then hinge the bar back down under control.',
    ],
  },
  {
    id: 'back-squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    frames: frames('Barbell_Full_Squat/0.jpg', 'Barbell_Full_Squat/1.jpg'),
    primaryMuscles: ['Quads'],
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Lower Back', 'Calves'],
    level: 'Intermediate',
    formCues: [
      'Bar on upper back, feet shoulder-width, toes slightly out.',
      'Brace, break at hips and knees together, chest up.',
      'Descend until thighs are at least parallel.',
      'Drive up through mid-foot, knees tracking over toes.',
    ],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'Legs',
    frames: frames('Leg_Press/0.jpg', 'Leg_Press/1.jpg'),
    primaryMuscles: ['Quads'],
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves'],
    level: 'Beginner',
    formCues: [
      'Feet shoulder-width on the platform, back flat on the pad.',
      'Lower until knees reach ~90°, don’t let hips curl up.',
      'Press through the heels — never lock the knees hard.',
      'Keep the movement smooth and controlled.',
    ],
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'Legs',
    frames: frames('Romanian_Deadlift/0.jpg', 'Romanian_Deadlift/1.jpg'),
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Glutes', 'Lower Back', 'Calves'],
    level: 'Intermediate',
    formCues: [
      'Stand tall with the bar, soft knees, back flat.',
      'Push hips back, sliding the bar down the thighs.',
      'Feel the hamstring stretch — stop at mid-shin.',
      'Drive hips forward to stand, squeezing the glutes.',
    ],
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Core',
    frames: frames('Hanging_Leg_Raise/0.jpg', 'Hanging_Leg_Raise/1.jpg'),
    primaryMuscles: ['Core'],
    secondaryMuscles: ['Forearms'],
    level: 'Advanced',
    formCues: [
      'Hang from the bar, pelvis tucked slightly back.',
      'Raise legs until the torso makes a 90° angle.',
      'Exhale and pause at the top — no swinging.',
      'Lower slowly under full control.',
    ],
  },
  {
    id: 'wrist-curl',
    name: 'Cable / Barbell Wrist Curl',
    category: 'Forearms',
    frames: frames('Cable_Wrist_Curl/0.jpg', 'Cable_Wrist_Curl/1.jpg'),
    primaryMuscles: ['Forearms'],
    secondaryMuscles: [],
    level: 'Beginner',
    formCues: [
      'Forearms resting on thighs, palms up, wrists past the knees.',
      'Let the weight roll to the fingertips for a full stretch.',
      'Curl the wrists up and squeeze hard for a second.',
      'Lower slowly — this muscle responds to time under tension.',
    ],
  },
  {
    id: 'farmers-walk',
    name: "Farmer's Walk",
    category: 'Forearms',
    frames: frames('Farmers_Walk/0.jpg', 'Farmers_Walk/1.jpg'),
    primaryMuscles: ['Forearms'],
    secondaryMuscles: ['Traps', 'Core', 'Glutes'],
    level: 'Intermediate',
    formCues: [
      'Grip heavy dumbbells/handles, stand tall, shoulders back.',
      'Brace the core and walk with short, quick steps.',
      'Keep a crushing grip the entire distance.',
      'Walk 30–50m per set; rest and repeat.',
    ],
  },
];

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
