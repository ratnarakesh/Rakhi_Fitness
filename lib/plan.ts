/**
 * Weekly training plan — a Push / Pull / Legs split with a dedicated Cardio &
 * Core day and one rest day. Every session is scoped to roughly one hour:
 * warm-up + main lifts (with rep targets and swap-in variations) + an abs block
 * + a cardio finisher. Forearm work is folded into pull and cardio days.
 *
 * Exercises present in the tracker matrix carry an `exerciseId` so the UI can
 * deep-link straight into logging with that movement pre-selected.
 */

export interface PlanExercise {
  name: string;
  exerciseId?: string;
  sets: number;
  reps: string; // e.g. "6-8"
  /** Alternative movements that train the same pattern. */
  variations?: string[];
}

export interface DayPlan {
  /** 0 = Sunday … 6 = Saturday (matches Date.getDay()). */
  weekday: number;
  day: string;
  title: string;
  /** Which muscles are trained together ("mix with what"). */
  pairing: string;
  focus: string;
  rest: boolean;
  durationMin: number;
  color: string;
  /** Cardio warm-up recommendation. */
  warmup: string;
  main: PlanExercise[];
  abs: PlanExercise[];
  /** Cardio session / finisher recommendation. */
  cardio: string;
}

export const WEEKLY_PLAN: DayPlan[] = [
  {
    weekday: 1,
    day: 'Monday',
    title: 'Push A',
    pairing: 'Chest + Shoulders + Triceps',
    focus: 'Heavy pressing strength',
    rest: false,
    durationMin: 60,
    color: '#00FFCC',
    warmup: '5 min row or bike + shoulder circles and band pull-aparts.',
    main: [
      { name: 'Barbell Bench Press', exerciseId: 'bench-press', sets: 4, reps: '6-8', variations: ['Dumbbell Bench Press', 'Machine Chest Press'] },
      { name: 'Overhead Press', exerciseId: 'overhead-press', sets: 3, reps: '8-10', variations: ['Seated DB Shoulder Press', 'Arnold Press'] },
      { name: 'Incline Dumbbell Press', exerciseId: 'incline-db-press', sets: 3, reps: '10-12', variations: ['Incline Barbell Press', 'Incline Machine Press'] },
      { name: 'Lateral Raise', sets: 3, reps: '15', variations: ['Cable Lateral Raise', 'Machine Lateral Raise'] },
      { name: 'Triceps Rope Pushdown', sets: 3, reps: '12-15', variations: ['Overhead Rope Extension', 'Dips'] },
    ],
    abs: [
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '12-15' },
      { name: 'Cable Crunch', sets: 3, reps: '15-20' },
    ],
    cardio: 'Finisher: 10 min incline treadmill walk (steady, ~120 bpm).',
  },
  {
    weekday: 2,
    day: 'Tuesday',
    title: 'Pull A',
    pairing: 'Back + Biceps + Forearms',
    focus: 'Vertical + horizontal pulling',
    rest: false,
    durationMin: 60,
    color: '#5AB0FF',
    warmup: '5 min row + band pull-aparts and light lat pulldowns.',
    main: [
      { name: 'Conventional Deadlift', exerciseId: 'deadlift', sets: 3, reps: '5', variations: ['Trap-Bar Deadlift', 'Rack Pull'] },
      { name: 'Barbell Row', exerciseId: 'barbell-row', sets: 4, reps: '8-10', variations: ['Pendlay Row', 'T-Bar Row'] },
      { name: 'Lat Pulldown', exerciseId: 'lat-pulldown', sets: 3, reps: '10-12', variations: ['Pull-Ups', 'Close-Grip Pulldown'] },
      { name: 'Barbell Curl', sets: 3, reps: '10-12', variations: ['Dumbbell Curl', 'Cable Curl'] },
      { name: 'Wrist Curl', exerciseId: 'wrist-curl', sets: 3, reps: '15-20', variations: ['Reverse Wrist Curl', 'Behind-Back Barbell Wrist Curl'] },
    ],
    abs: [
      { name: 'Plank', sets: 3, reps: '45s' },
      { name: 'Bicycle Crunch', sets: 3, reps: '20 / side' },
    ],
    cardio: 'Finisher: 8 min moderate cycling or 800m row.',
  },
  {
    weekday: 3,
    day: 'Wednesday',
    title: 'Legs A',
    pairing: 'Quads + Hamstrings + Glutes',
    focus: 'Squat-focused strength',
    rest: false,
    durationMin: 60,
    color: '#FFB020',
    warmup: '5 min bike + bodyweight squats, leg swings, hip openers.',
    main: [
      { name: 'Barbell Back Squat', exerciseId: 'back-squat', sets: 4, reps: '6-8', variations: ['Front Squat', 'Hack Squat'] },
      { name: 'Romanian Deadlift', exerciseId: 'romanian-deadlift', sets: 3, reps: '8-10', variations: ['Lying Leg Curl', 'Good Morning'] },
      { name: 'Leg Press', exerciseId: 'leg-press', sets: 3, reps: '12', variations: ['Walking Lunge', 'Bulgarian Split Squat'] },
      { name: 'Standing Calf Raise', sets: 4, reps: '15', variations: ['Seated Calf Raise', 'Leg-Press Calf Raise'] },
    ],
    abs: [
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '12-15' },
      { name: 'Russian Twist', sets: 3, reps: '20 / side' },
    ],
    cardio: 'Optional: 10 min easy walk to cool down (legs already taxed).',
  },
  {
    weekday: 4,
    day: 'Thursday',
    title: 'Push B',
    pairing: 'Shoulders + Chest + Triceps',
    focus: 'Shoulder-led hypertrophy',
    rest: false,
    durationMin: 60,
    color: '#00FFCC',
    warmup: '5 min row + rotator-cuff band work.',
    main: [
      { name: 'Overhead Press', exerciseId: 'overhead-press', sets: 4, reps: '6-8', variations: ['Push Press', 'Machine Shoulder Press'] },
      { name: 'Incline Dumbbell Press', exerciseId: 'incline-db-press', sets: 3, reps: '8-10', variations: ['Incline Barbell Press', 'Low-Incline DB Press'] },
      { name: 'Barbell Bench Press', exerciseId: 'bench-press', sets: 3, reps: '10-12', variations: ['Dumbbell Bench Press', 'Push-Ups'] },
      { name: 'Lateral Raise', sets: 3, reps: '15', variations: ['Cable Lateral Raise', 'Lean-Away Lateral'] },
      { name: 'Overhead Triceps Extension', sets: 3, reps: '12', variations: ['Skull Crushers', 'Rope Pushdown'] },
    ],
    abs: [
      { name: 'Cable Crunch', sets: 3, reps: '15-20' },
      { name: 'Leg Raise (floor)', sets: 3, reps: '15' },
    ],
    cardio: 'Finisher: 10 min incline walk or 5 min HIIT (20s on / 40s off).',
  },
  {
    weekday: 5,
    day: 'Friday',
    title: 'Pull B',
    pairing: 'Back Width + Biceps + Forearms',
    focus: 'Lat width & grip',
    rest: false,
    durationMin: 60,
    color: '#5AB0FF',
    warmup: '5 min row + scapular pulls and dead hangs.',
    main: [
      { name: 'Barbell Row', exerciseId: 'barbell-row', sets: 4, reps: '8-10', variations: ['Chest-Supported Row', 'Seated Cable Row'] },
      { name: 'Lat Pulldown', exerciseId: 'lat-pulldown', sets: 4, reps: '10-12', variations: ['Pull-Ups', 'Straight-Arm Pulldown'] },
      { name: 'Romanian Deadlift', exerciseId: 'romanian-deadlift', sets: 3, reps: '8-10', variations: ['Seated Leg Curl', 'Back Extension'] },
      { name: 'Hammer Curl', sets: 3, reps: '12', variations: ['Incline DB Curl', 'Preacher Curl'] },
      { name: "Farmer's Walk", exerciseId: 'farmers-walk', sets: 3, reps: '30-50m', variations: ['Plate Pinch Carry', 'Dead Hang 30s'] },
    ],
    abs: [
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '15' },
      { name: 'Plank', sets: 3, reps: '60s' },
    ],
    cardio: 'Finisher: 8-10 min steady cycling.',
  },
  {
    weekday: 6,
    day: 'Saturday',
    title: 'Cardio & Core',
    pairing: 'Conditioning + Abs + Forearms',
    focus: 'Fat burn & core strength',
    rest: false,
    durationMin: 50,
    color: '#FF5A5F',
    warmup: '5 min easy walk / bike ramp-up.',
    main: [
      { name: "Farmer's Walk", exerciseId: 'farmers-walk', sets: 4, reps: '40m', variations: ['Suitcase Carry', 'Kettlebell Carry'] },
      { name: 'Wrist Curl', exerciseId: 'wrist-curl', sets: 3, reps: '20', variations: ['Reverse Wrist Curl', 'Wrist Roller'] },
    ],
    abs: [
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '15' },
      { name: 'Cable Crunch', sets: 3, reps: '20' },
      { name: 'Russian Twist', sets: 3, reps: '20 / side' },
      { name: 'Plank', sets: 3, reps: '60s' },
    ],
    cardio:
      'Main session (25-30 min): choose HIIT — 10 rounds of 30s hard / 90s easy on bike/row/treadmill — OR steady 30 min incline walk / jog at conversational pace.',
  },
  {
    weekday: 0,
    day: 'Sunday',
    title: 'Rest & Recover',
    pairing: 'Full-body recovery',
    focus: 'Mobility · walk · sleep',
    rest: true,
    durationMin: 30,
    color: '#8A8A8A',
    warmup: '',
    main: [],
    abs: [],
    cardio: 'Optional 20-30 min easy walk. Stretch, foam-roll, and hydrate.',
  },
];

/** The plan entry for a given weekday (defaults to today). */
export function getDayPlan(weekday: number = new Date().getDay()): DayPlan {
  return WEEKLY_PLAN.find((d) => d.weekday === weekday) ?? WEEKLY_PLAN[0];
}
