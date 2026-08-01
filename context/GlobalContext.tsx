'use client';

/**
 * Rakhi Fitness — Global State Engine (Web / PWA)
 * -----------------------------------------------------------------------------
 * Client-side global state persisted to localStorage. Single source of truth
 * for every tracked metric. All screens read/write through `useGlobal()`.
 *
 *   - Lazy hydration from localStorage on mount (SSR/export safe).
 *   - Write-through: every state change is serialized back to localStorage.
 *   - `hydrated` gates first paint so the UI never flashes defaults over stored.
 *   - Forward-compatible: `normalize()` backfills new fields on old payloads,
 *     so upgrading the schema never wipes a user's existing data.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/* -------------------------------------------------------------------------- */
/* Domain models                                                              */
/* -------------------------------------------------------------------------- */

export const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'rakhi-fitness/state/v1';

/** How an exercise is measured. */
export type MetricType = 'weight-reps' | 'reps' | 'seconds' | 'distance' | 'custom';

/** One recorded set. Fields present depend on the exercise's metric type. */
export interface WorkoutSet {
  weight?: number; // kg
  reps?: number;
  seconds?: number;
  distance?: number; // meters
  value?: number; // custom unit amount
}

/** A committed workout log (any metric type). */
export interface WorkoutEntry {
  id: string;
  createdAt: string; // ISO
  exerciseId: string;
  exercise: string;
  category: string;
  color?: string;
  metricType: MetricType;
  unit?: string; // label for custom / distance
  sets: WorkoutSet[];
  totalSets: number;
  totalReps: number;
  /** Σ(weight × reps) for weight-reps; 0 otherwise. */
  totalVolume: number;
  /** Human-readable one-line summary, e.g. "3 sets · 45s". */
  summary: string;
}

/** A user-defined exercise. */
export interface CustomExercise {
  id: string;
  name: string;
  category: string; // Legs / Chest / Cardio / Custom …
  metricType: MetricType;
  unit?: string;
  color: string; // hex accent
  machinePhoto?: string; // base64
  demoPhoto?: string; // base64
  notes?: string;
}

/** A bodyweight reading over time. */
export interface WeightEntry {
  id: string;
  createdAt: string; // ISO
  kg: number;
}

/** A logged alcohol drink. */
export interface AlcoholEntry {
  id: string;
  createdAt: string; // ISO
  type: string; // Beer / Whisky / Wine / Other
  volumeMl: number; // total ml for this entry
  count: number; // number of servings/pegs/bottles
  units: number; // standard units (10 g pure alcohol each)
}

/** A logged meal with mandatory compliance flags. */
export interface MealLog {
  id: string;
  createdAt: string;
  name: string;
  calories?: number;
  zeroOil: boolean;
  zeroSugar: boolean;
  zeroSalt: boolean;
}

/** A timestamped progress photo bound to a bodyweight reading. */
export interface ProgressPhoto {
  id: string;
  createdAt: string;
  dataUrl: string;
  weight: number;
}

/** Per-day manually-entered activity metrics, keyed by YYYY-MM-DD. */
export interface DailyMetric {
  steps: number;
  water: number; // ml consumed
}

export type Gender = 'male' | 'female' | 'other' | '';
export type FitnessGoal = 'Fat Loss' | 'Recomposition' | 'Muscle Gain' | 'Maintenance' | '';
export type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Athlete' | '';

export interface Profile {
  fullName: string;
  photo: string;
  age: number;
  gender: Gender;
  heightCm: number;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
}

/** Full persisted tree. */
export interface PersistedState {
  version: number;
  profile: Profile;
  currentWeight: number;
  targetWeight: number;
  stepGoal: number;
  waterGoal: number;
  dailyLog: Record<string, DailyMetric>;
  weightLog: WeightEntry[];
  alcoholLogs: AlcoholEntry[];
  workoutHistory: WorkoutEntry[];
  customExercises: CustomExercise[];
  mealLogs: MealLog[];
  progressPhotos: ProgressPhoto[];
  /** dateKey -> { itemId -> checked }. Supplement & diet checklist. */
  checklist: Record<string, Record<string, boolean>>;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM"
}

const DEFAULT_PROFILE: Profile = {
  fullName: '',
  photo: '',
  age: 0,
  gender: '',
  heightCm: 0,
  goal: '',
  activityLevel: '',
};

const DEFAULT_STATE: PersistedState = {
  version: SCHEMA_VERSION,
  profile: DEFAULT_PROFILE,
  currentWeight: 75,
  targetWeight: 69,
  stepGoal: 12000,
  waterGoal: 3500,
  dailyLog: {},
  weightLog: [],
  alcoholLogs: [],
  workoutHistory: [],
  customExercises: [],
  mealLogs: [],
  progressPhotos: [],
  checklist: {},
  reminderEnabled: false,
  reminderTime: '17:00',
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isCompliant(m: Pick<MealLog, 'zeroOil' | 'zeroSugar' | 'zeroSalt'>): boolean {
  return m.zeroOil && m.zeroSugar && m.zeroSalt;
}

/** Build a human-readable summary + volume for a set of logged sets. */
export function summarize(
  metricType: MetricType,
  sets: WorkoutSet[],
  unit?: string
): { summary: string; totalVolume: number; totalReps: number } {
  const n = sets.length;
  const s = (v: number) => (v === 1 ? '' : 's');
  if (metricType === 'weight-reps') {
    const vol = sets.reduce((a, x) => a + (x.weight ?? 0) * (x.reps ?? 0), 0);
    const reps = sets.reduce((a, x) => a + (x.reps ?? 0), 0);
    return { summary: `${n} set${s(n)} · ${vol.toLocaleString()} kg vol`, totalVolume: vol, totalReps: reps };
  }
  if (metricType === 'reps') {
    const reps = sets.reduce((a, x) => a + (x.reps ?? 0), 0);
    return { summary: `${n} set${s(n)} · ${reps} reps`, totalVolume: 0, totalReps: reps };
  }
  if (metricType === 'seconds') {
    const secs = sets.reduce((a, x) => a + (x.seconds ?? 0), 0);
    return { summary: `${n} set${s(n)} · ${secs}s total`, totalVolume: 0, totalReps: 0 };
  }
  if (metricType === 'distance') {
    const dist = sets.reduce((a, x) => a + (x.distance ?? 0), 0);
    return { summary: `${n} set${s(n)} · ${dist} m`, totalVolume: 0, totalReps: 0 };
  }
  const total = sets.reduce((a, x) => a + (x.value ?? 0), 0);
  return { summary: `${n} set${s(n)} · ${total} ${unit ?? ''}`.trim(), totalVolume: 0, totalReps: 0 };
}

/* --- Normalization -------------------------------------------------------- */

function normalizeWorkout(w: unknown): WorkoutEntry | null {
  if (!w || typeof w !== 'object') return null;
  const o = w as Partial<WorkoutEntry> & { volume?: number };
  if (typeof o.id !== 'string') return null;
  const sets: WorkoutSet[] = Array.isArray(o.sets) ? (o.sets as WorkoutSet[]) : [];
  const metricType: MetricType = o.metricType ?? 'weight-reps';
  const derived = summarize(metricType, sets, o.unit);
  return {
    id: o.id,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
    exerciseId: o.exerciseId ?? '',
    exercise: o.exercise ?? 'Exercise',
    category: o.category ?? '',
    color: o.color,
    metricType,
    unit: o.unit,
    sets,
    totalSets: typeof o.totalSets === 'number' ? o.totalSets : sets.length,
    totalReps: typeof o.totalReps === 'number' ? o.totalReps : derived.totalReps,
    totalVolume:
      typeof o.totalVolume === 'number'
        ? o.totalVolume
        : typeof o.volume === 'number'
          ? o.volume
          : derived.totalVolume,
    summary: typeof o.summary === 'string' ? o.summary : derived.summary,
  };
}

function normalize(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE };
  const o = raw as Partial<PersistedState>;
  const legacy = raw as { steps?: unknown; water?: unknown };
  const num = (v: unknown, f: number) => (typeof v === 'number' && Number.isFinite(v) ? v : f);
  const str = (v: unknown, f: string) => (typeof v === 'string' ? v : f);
  const bool = (v: unknown, f: boolean) => (typeof v === 'boolean' ? v : f);

  const dailyLog: Record<string, DailyMetric> = {};
  if (o.dailyLog && typeof o.dailyLog === 'object') {
    for (const [key, v] of Object.entries(o.dailyLog)) {
      const dm = (v ?? {}) as Partial<DailyMetric>;
      dailyLog[key] = { steps: num(dm.steps, 0), water: num(dm.water, 0) };
    }
  } else if (typeof legacy.steps === 'number' || typeof legacy.water === 'number') {
    dailyLog[toDateKey()] = { steps: num(legacy.steps, 0), water: num(legacy.water, 0) };
  }

  const checklist: Record<string, Record<string, boolean>> = {};
  if (o.checklist && typeof o.checklist === 'object') {
    for (const [day, items] of Object.entries(o.checklist)) {
      if (items && typeof items === 'object') {
        checklist[day] = {};
        for (const [k, v] of Object.entries(items)) checklist[day][k] = !!v;
      }
    }
  }

  const p = (o.profile ?? {}) as Partial<Profile>;
  const profile: Profile = {
    fullName: str(p.fullName, ''),
    photo: str(p.photo, ''),
    age: num(p.age, 0),
    gender: str(p.gender, '') as Gender,
    heightCm: num(p.heightCm, 0),
    goal: str(p.goal, '') as FitnessGoal,
    activityLevel: str(p.activityLevel, '') as ActivityLevel,
  };

  return {
    version: SCHEMA_VERSION,
    profile,
    currentWeight: num(o.currentWeight, DEFAULT_STATE.currentWeight),
    targetWeight: num(o.targetWeight, DEFAULT_STATE.targetWeight),
    stepGoal: num(o.stepGoal, DEFAULT_STATE.stepGoal),
    waterGoal: num(o.waterGoal, DEFAULT_STATE.waterGoal),
    dailyLog,
    weightLog: Array.isArray(o.weightLog) ? (o.weightLog as WeightEntry[]) : [],
    alcoholLogs: Array.isArray(o.alcoholLogs) ? (o.alcoholLogs as AlcoholEntry[]) : [],
    workoutHistory: Array.isArray(o.workoutHistory)
      ? o.workoutHistory.map(normalizeWorkout).filter((w): w is WorkoutEntry => w !== null)
      : [],
    customExercises: Array.isArray(o.customExercises) ? (o.customExercises as CustomExercise[]) : [],
    mealLogs: Array.isArray(o.mealLogs) ? o.mealLogs : [],
    progressPhotos: Array.isArray(o.progressPhotos) ? o.progressPhotos : [],
    checklist,
    reminderEnabled: bool(o.reminderEnabled, false),
    reminderTime: str(o.reminderTime, '17:00'),
  };
}

/* -------------------------------------------------------------------------- */
/* Context contract                                                          */
/* -------------------------------------------------------------------------- */

export interface GlobalContextValue extends PersistedState {
  hydrated: boolean;
  steps: number;
  water: number;

  updateProfile: (patch: Partial<Profile>) => void;

  setCurrentWeight: (kg: number) => void;
  setTargetWeight: (kg: number) => void;
  setStepGoal: (steps: number) => void;
  setWaterGoal: (ml: number) => void;

  setSteps: (steps: number) => void;
  addSteps: (delta: number) => void;
  setWater: (ml: number) => void;
  addWater: (delta: number) => void;
  getDay: (dateKey?: string) => DailyMetric;

  addWorkout: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => WorkoutEntry;
  deleteWorkout: (id: string) => void;

  addCustomExercise: (ex: Omit<CustomExercise, 'id'>) => CustomExercise;
  deleteCustomExercise: (id: string) => void;

  addAlcohol: (entry: Omit<AlcoholEntry, 'id' | 'createdAt'>) => AlcoholEntry;
  deleteAlcohol: (id: string) => void;

  addMeal: (meal: Omit<MealLog, 'id' | 'createdAt'>) => MealLog;
  deleteMeal: (id: string) => void;

  addPhoto: (photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => ProgressPhoto;
  deletePhoto: (id: string) => void;

  toggleChecklistItem: (itemId: string, dateKey?: string) => void;
  isChecked: (itemId: string, dateKey?: string) => boolean;

  setReminder: (enabled: boolean, time?: string) => void;

  resetAll: () => void;
}

const GlobalContext = createContext<GlobalContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setState(normalize(JSON.parse(raw)));
      }
    } catch {
      /* keep defaults */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* non-fatal */
    }
  }, [state, hydrated]);

  const patch = useCallback(
    (p: Partial<PersistedState>) => setState((s) => ({ ...s, ...p })),
    []
  );

  const updateProfile = useCallback(
    (p: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    []
  );

  const setCurrentWeight = useCallback((kg: number) => {
    setState((s) => {
      const entry: WeightEntry = { id: makeId(), createdAt: new Date().toISOString(), kg };
      return { ...s, currentWeight: kg, weightLog: [...s.weightLog, entry] };
    });
  }, []);
  const setTargetWeight = useCallback((kg: number) => patch({ targetWeight: kg }), [patch]);
  const setStepGoal = useCallback((n: number) => patch({ stepGoal: n }), [patch]);
  const setWaterGoal = useCallback((n: number) => patch({ waterGoal: n }), [patch]);

  const mutateToday = useCallback(
    (field: keyof DailyMetric, resolve: (prev: number) => number) => {
      const key = toDateKey();
      setState((s) => {
        const prev = s.dailyLog[key] ?? { steps: 0, water: 0 };
        const nextVal = Math.max(0, Math.round(resolve(prev[field])));
        return { ...s, dailyLog: { ...s.dailyLog, [key]: { ...prev, [field]: nextVal } } };
      });
    },
    []
  );
  const setSteps = useCallback((n: number) => mutateToday('steps', () => n), [mutateToday]);
  const addSteps = useCallback((d: number) => mutateToday('steps', (p) => p + d), [mutateToday]);
  const setWater = useCallback((n: number) => mutateToday('water', () => n), [mutateToday]);
  const addWater = useCallback((d: number) => mutateToday('water', (p) => p + d), [mutateToday]);
  const getDay = useCallback(
    (dateKey: string = toDateKey()): DailyMetric => state.dailyLog[dateKey] ?? { steps: 0, water: 0 },
    [state.dailyLog]
  );

  const addWorkout = useCallback((entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    const full: WorkoutEntry = { ...entry, id: makeId(), createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, workoutHistory: [full, ...s.workoutHistory] }));
    return full;
  }, []);
  const deleteWorkout = useCallback((id: string) => {
    setState((s) => ({ ...s, workoutHistory: s.workoutHistory.filter((w) => w.id !== id) }));
  }, []);

  const addCustomExercise = useCallback((ex: Omit<CustomExercise, 'id'>) => {
    const full: CustomExercise = { ...ex, id: makeId() };
    setState((s) => ({ ...s, customExercises: [full, ...s.customExercises] }));
    return full;
  }, []);
  const deleteCustomExercise = useCallback((id: string) => {
    setState((s) => ({ ...s, customExercises: s.customExercises.filter((e) => e.id !== id) }));
  }, []);

  const addAlcohol = useCallback((entry: Omit<AlcoholEntry, 'id' | 'createdAt'>) => {
    const full: AlcoholEntry = { ...entry, id: makeId(), createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, alcoholLogs: [full, ...s.alcoholLogs] }));
    return full;
  }, []);
  const deleteAlcohol = useCallback((id: string) => {
    setState((s) => ({ ...s, alcoholLogs: s.alcoholLogs.filter((a) => a.id !== id) }));
  }, []);

  const addMeal = useCallback((meal: Omit<MealLog, 'id' | 'createdAt'>) => {
    const full: MealLog = { ...meal, id: makeId(), createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, mealLogs: [full, ...s.mealLogs] }));
    return full;
  }, []);
  const deleteMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, mealLogs: s.mealLogs.filter((m) => m.id !== id) }));
  }, []);

  const addPhoto = useCallback((photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => {
    const full: ProgressPhoto = { ...photo, id: makeId(), createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, progressPhotos: [full, ...s.progressPhotos] }));
    return full;
  }, []);
  const deletePhoto = useCallback((id: string) => {
    setState((s) => ({ ...s, progressPhotos: s.progressPhotos.filter((p) => p.id !== id) }));
  }, []);

  const toggleChecklistItem = useCallback((itemId: string, dateKey: string = toDateKey()) => {
    setState((s) => {
      const day = s.checklist[dateKey] ?? {};
      return {
        ...s,
        checklist: { ...s.checklist, [dateKey]: { ...day, [itemId]: !day[itemId] } },
      };
    });
  }, []);
  const isChecked = useCallback(
    (itemId: string, dateKey: string = toDateKey()) => !!state.checklist[dateKey]?.[itemId],
    [state.checklist]
  );

  const setReminder = useCallback(
    (enabled: boolean, time?: string) =>
      setState((s) => ({ ...s, reminderEnabled: enabled, reminderTime: time ?? s.reminderTime })),
    []
  );

  const resetAll = useCallback(() => setState({ ...DEFAULT_STATE }), []);

  const today = state.dailyLog[toDateKey()] ?? { steps: 0, water: 0 };

  const value = useMemo<GlobalContextValue>(
    () => ({
      ...state,
      hydrated,
      steps: today.steps,
      water: today.water,
      updateProfile,
      setCurrentWeight,
      setTargetWeight,
      setStepGoal,
      setWaterGoal,
      setSteps,
      addSteps,
      setWater,
      addWater,
      getDay,
      addWorkout,
      deleteWorkout,
      addCustomExercise,
      deleteCustomExercise,
      addAlcohol,
      deleteAlcohol,
      addMeal,
      deleteMeal,
      addPhoto,
      deletePhoto,
      toggleChecklistItem,
      isChecked,
      setReminder,
      resetAll,
    }),
    [
      state,
      hydrated,
      today.steps,
      today.water,
      updateProfile,
      setCurrentWeight,
      setTargetWeight,
      setStepGoal,
      setWaterGoal,
      setSteps,
      addSteps,
      setWater,
      addWater,
      getDay,
      addWorkout,
      deleteWorkout,
      addCustomExercise,
      deleteCustomExercise,
      addAlcohol,
      deleteAlcohol,
      addMeal,
      deleteMeal,
      addPhoto,
      deletePhoto,
      toggleChecklistItem,
      isChecked,
      setReminder,
      resetAll,
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobal(): GlobalContextValue {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobal() must be used within <GlobalProvider>.');
  return ctx;
}

export default GlobalContext;
