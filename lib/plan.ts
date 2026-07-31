/**
 * Rakhi's weekly training split (5 training days + 2 rest days):
 *   Mon  Legs           (+ Abs)
 *   Tue  Chest + Triceps (+ Abs)
 *   Wed  Shoulders       (+ Abs)
 *   Thu  Biceps + Forearms
 *   Fri  Back + Forearms (+ Abs)
 *   Sat  Rest
 *   Sun  Rest
 *
 * Every training day is scoped to ~1 hour: warm-up + main lifts (rep targets +
 * swap-in variations) + an abs block (on Mon/Wed/Fri) + a cardio finisher.
 * Exercises present in the tracker carry an `exerciseId` for deep-linking.
 */

export interface PlanExercise {
  name: string;
  exerciseId?: string;
  sets: number;
  reps: string;
  variations?: string[];
}

export interface DayPlan {
  weekday: number; // 0 = Sun … 6 = Sat
  day: string;
  title: string;
  pairing: string;
  focus: string;
  rest: boolean;
  durationMin: number;
  color: string;
  warmup: string;
  main: PlanExercise[];
  abs: PlanExercise[];
  cardio: string;
}

export const WEEKLY_PLAN: DayPlan[] = [
  {
    weekday: 1,
    day: 'Monday',
    title: 'Legs',
    pairing: 'Quads + Hamstrings + Glutes + Abs',
    focus: 'Squat-focused strength',
    rest: false,
    durationMin: 60,
    color: '#FFB020',
    warmup: '5 min bike + bodyweight squats, leg swings, hip openers.',
    main: [
      { name: 'Barbell Back Squat', exerciseId: 'back-squat', sets: 4, reps: '6-8', variations: ['Front Squat', 'Hack Squat'] },
      { name: 'Romanian Deadlift', exerciseId: 'romanian-deadlift', sets: 3, reps: '8-10', variations: ['Lying Leg Curl', 'Good Morning'] },
      { name: 'Leg Press', exerciseId: 'leg-press', sets: 3, reps: '12', variations: ['Walking Lunge', 'Bulgarian Split Squat'] },
      { name: 'Standing Calf Raise', sets: 4, reps: '15', variations: ['Seated Calf Raise'] },
    ],
    abs: [
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '12-15' },
      { name: 'Plank', exerciseId: 'plank', sets: 3, reps: '60s' },
    ],
    cardio: 'Finisher: 10 min incline treadmill walk.',
  },
  {
    weekday: 2,
    day: 'Tuesday',
    title: 'Chest + Triceps',
    pairing: 'Chest + Triceps + Abs',
    focus: 'Pressing power + arm lockout',
    rest: false,
    durationMin: 60,
    color: '#00FFCC',
    warmup: '5 min row + band pull-aparts and light presses.',
    main: [
      { name: 'Barbell Bench Press', exerciseId: 'bench-press', sets: 4, reps: '6-8', variations: ['Dumbbell Bench Press', 'Machine Chest Press'] },
      { name: 'Incline Dumbbell Press', exerciseId: 'incline-db-press', sets: 3, reps: '8-10', variations: ['Incline Barbell Press'] },
      { name: 'Push-Up', exerciseId: 'push-up', sets: 3, reps: 'AMRAP', variations: ['Dips', 'Decline Push-Up'] },
      { name: 'Triceps Rope Pushdown', sets: 3, reps: '12-15', variations: ['Skull Crushers'] },
      { name: 'Overhead Triceps Extension', sets: 3, reps: '12', variations: ['Close-Grip Bench'] },
    ],
    abs: [
      { name: 'Crunches', exerciseId: 'crunches', sets: 3, reps: '20' },
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '12' },
    ],
    cardio: 'Finisher: 8 min moderate cycling.',
  },
  {
    weekday: 3,
    day: 'Wednesday',
    title: 'Shoulders',
    pairing: 'Delts (all 3 heads) + Traps + Abs',
    focus: 'Overhead strength + width',
    rest: false,
    durationMin: 60,
    color: '#5AB0FF',
    warmup: '5 min row + rotator-cuff band work.',
    main: [
      { name: 'Overhead Press', exerciseId: 'overhead-press', sets: 4, reps: '6-8', variations: ['Push Press', 'Machine Shoulder Press'] },
      { name: 'Lateral Raise', sets: 4, reps: '15', variations: ['Cable Lateral Raise'] },
      { name: 'Rear Delt Fly', sets: 3, reps: '15', variations: ['Face Pull'] },
      { name: 'Front Raise', sets: 3, reps: '12', variations: ['Plate Raise'] },
      { name: 'Barbell Shrug', sets: 3, reps: '15', variations: ['Dumbbell Shrug'] },
    ],
    abs: [
      { name: 'Plank', exerciseId: 'plank', sets: 3, reps: '60s' },
      { name: 'Russian Twist', sets: 3, reps: '20 / side' },
    ],
    cardio: 'Finisher: 5 min HIIT (20s on / 40s off).',
  },
  {
    weekday: 4,
    day: 'Thursday',
    title: 'Biceps + Forearms',
    pairing: 'Biceps + Forearms + Grip',
    focus: 'Arm size & grip strength',
    rest: false,
    durationMin: 55,
    color: '#B980FF',
    warmup: '5 min row + light curls and wrist rotations.',
    main: [
      { name: 'Barbell Curl', sets: 4, reps: '10-12', variations: ['EZ-Bar Curl', 'Cable Curl'] },
      { name: 'Hammer Curl', sets: 3, reps: '12', variations: ['Incline DB Curl'] },
      { name: 'Preacher Curl', sets: 3, reps: '12', variations: ['Concentration Curl'] },
      { name: 'Wrist Curl', exerciseId: 'wrist-curl', sets: 3, reps: '20', variations: ['Reverse Wrist Curl'] },
      { name: "Farmer's Walk", exerciseId: 'farmers-walk', sets: 3, reps: '40m', variations: ['Plate Pinch Carry', 'Dead Hang'] },
    ],
    abs: [],
    cardio: 'Finisher: 8 min steady cycling.',
  },
  {
    weekday: 5,
    day: 'Friday',
    title: 'Back + Forearms',
    pairing: 'Back + Lats + Forearms + Abs',
    focus: 'Pulling strength & width',
    rest: false,
    durationMin: 60,
    color: '#33D17A',
    warmup: '5 min row + scapular pulls and dead hangs.',
    main: [
      { name: 'Conventional Deadlift', exerciseId: 'deadlift', sets: 3, reps: '5', variations: ['Trap-Bar Deadlift', 'Rack Pull'] },
      { name: 'Barbell Row', exerciseId: 'barbell-row', sets: 4, reps: '8-10', variations: ['Pendlay Row', 'T-Bar Row'] },
      { name: 'Lat Pulldown', exerciseId: 'lat-pulldown', sets: 4, reps: '10-12', variations: ['Pull-Ups'] },
      { name: 'Seated Cable Row', sets: 3, reps: '10-12', variations: ['Chest-Supported Row'] },
      { name: 'Wrist Curl', exerciseId: 'wrist-curl', sets: 3, reps: '20', variations: ['Reverse Wrist Curl'] },
    ],
    abs: [
      { name: 'Hanging Leg Raise', exerciseId: 'hanging-leg-raise', sets: 3, reps: '15' },
      { name: 'Plank', exerciseId: 'plank', sets: 3, reps: '60s' },
    ],
    cardio: 'Finisher: 8-10 min cycling.',
  },
  {
    weekday: 6,
    day: 'Saturday',
    title: 'Rest & Recover',
    pairing: 'Full-body recovery',
    focus: 'Mobility · walk · sleep',
    rest: true,
    durationMin: 30,
    color: '#8A8A8A',
    warmup: '',
    main: [],
    abs: [],
    cardio: 'Optional 20-30 min easy walk. Stretch, foam-roll, hydrate.',
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
    cardio: 'Optional easy walk or light mobility. Prep meals for the week.',
  },
];

export function getDayPlan(weekday: number = new Date().getDay()): DayPlan {
  return WEEKLY_PLAN.find((d) => d.weekday === weekday) ?? WEEKLY_PLAN[0];
}
