'use client';

/**
 * Rakhi Fitness — Global State Engine (Web / PWA)
 * -----------------------------------------------------------------------------
 * Client-side global state persisted to localStorage. Single source of truth
 * for every tracked metric. All screens read/write through `useGlobal()`;
 * no component touches localStorage directly.
 *
 * Persistence model:
 *   - Lazy hydration from localStorage on mount (SSR/export safe — guards on
 *     `typeof window`).
 *   - Write-through: every state change is serialized back to localStorage.
 *   - `hydrated` gates first paint so the UI never flashes default values over
 *     stored ones.
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

/** Storage schema version — bump + migrate on breaking shape changes. */
export const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'rakhi-fitness/state/v1';

/** One weight+reps entry within a workout. */
export interface WorkoutSet {
  weight: number; // kg
  reps: number;
}

/** A committed workout log. Volume is derived, never hand-entered. */
export interface WorkoutEntry {
  id: string;
  createdAt: string; // ISO
  exerciseId: string;
  exercise: string;
  category: string; // Push / Pull / Legs
  sets: WorkoutSet[];
  totalSets: number;
  totalReps: number;
  /** Total Training Volume = Σ(weight × reps) across all sets. */
  totalVolume: number;
}

/** A logged meal with mandatory compliance flags. */
export interface MealLog {
  id: string;
  createdAt: string; // ISO
  name: string;
  calories?: number;
  zeroOil: boolean;
  zeroSugar: boolean;
  zeroSalt: boolean;
}

/** A timestamped progress photo bound to a bodyweight reading. */
export interface ProgressPhoto {
  id: string;
  createdAt: string; // ISO
  dataUrl: string; // base64 image
  weight: number; // kg at capture time
}

/** Per-day manually-entered activity metrics, keyed by YYYY-MM-DD. */
export interface DailyMetric {
  steps: number;
  water: number; // ml consumed
}

export type Gender = 'male' | 'female' | 'other' | '';
export type FitnessGoal = 'Fat Loss' | 'Recomposition' | 'Muscle Gain' | 'Maintenance' | '';
export type ActivityLevel =
  | 'Sedentary'
  | 'Light'
  | 'Moderate'
  | 'Active'
  | 'Athlete'
  | '';

/** User profile / account details. */
export interface Profile {
  fullName: string;
  photo: string; // base64 avatar, '' when unset
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
  waterGoal: number; // ml
  /** Steps + water tracked independently for each calendar day. */
  dailyLog: Record<string, DailyMetric>;
  workoutHistory: WorkoutEntry[];
  mealLogs: MealLog[];
  progressPhotos: ProgressPhoto[];
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
  workoutHistory: [],
  mealLogs: [],
  progressPhotos: [],
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Local calendar day key (YYYY-MM-DD) in device local time. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A meal is fully compliant only when all three zero-* flags hold. */
export function isCompliant(m: Pick<MealLog, 'zeroOil' | 'zeroSugar' | 'zeroSalt'>): boolean {
  return m.zeroOil && m.zeroSugar && m.zeroSalt;
}

/** Coerce arbitrary parsed JSON into a valid PersistedState. */
function normalize(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE };
  const o = raw as Partial<PersistedState>;
  const legacy = raw as { steps?: unknown; water?: unknown };
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  // Rebuild the per-day log, coercing each entry.
  const dailyLog: Record<string, DailyMetric> = {};
  if (o.dailyLog && typeof o.dailyLog === 'object') {
    for (const [key, v] of Object.entries(o.dailyLog)) {
      const dm = (v ?? {}) as Partial<DailyMetric>;
      dailyLog[key] = { steps: num(dm.steps, 0), water: num(dm.water, 0) };
    }
  } else if (
    typeof legacy.steps === 'number' ||
    typeof legacy.water === 'number'
  ) {
    // Migrate v1 scalar steps/water into today's entry.
    dailyLog[toDateKey()] = {
      steps: num(legacy.steps, 0),
      water: num(legacy.water, 0),
    };
  }

  // Merge stored profile over defaults so new fields always exist.
  const p = (o.profile ?? {}) as Partial<Profile>;
  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' ? v : fallback;
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
    version: num(o.version, SCHEMA_VERSION),
    profile,
    currentWeight: num(o.currentWeight, DEFAULT_STATE.currentWeight),
    targetWeight: num(o.targetWeight, DEFAULT_STATE.targetWeight),
    stepGoal: num(o.stepGoal, DEFAULT_STATE.stepGoal),
    waterGoal: num(o.waterGoal, DEFAULT_STATE.waterGoal),
    dailyLog,
    workoutHistory: Array.isArray(o.workoutHistory) ? o.workoutHistory : [],
    mealLogs: Array.isArray(o.mealLogs) ? o.mealLogs : [],
    progressPhotos: Array.isArray(o.progressPhotos) ? o.progressPhotos : [],
  };
}

/* -------------------------------------------------------------------------- */
/* Context contract                                                          */
/* -------------------------------------------------------------------------- */

export interface GlobalContextValue extends PersistedState {
  hydrated: boolean;

  /** Today's step count (from dailyLog). */
  steps: number;
  /** Today's water intake in ml (from dailyLog). */
  water: number;

  /* Profile */
  updateProfile: (patch: Partial<Profile>) => void;

  /* Scalar setters */
  setCurrentWeight: (kg: number) => void;
  setTargetWeight: (kg: number) => void;
  setStepGoal: (steps: number) => void;
  setWaterGoal: (ml: number) => void;

  /* Daily activity (operate on today's entry) */
  setSteps: (steps: number) => void; // absolute value for today
  addSteps: (delta: number) => void; // increment today
  setWater: (ml: number) => void; // absolute value for today
  addWater: (delta: number) => void; // increment today
  /** Read a specific day's metrics (defaults to today). */
  getDay: (dateKey?: string) => DailyMetric;

  /* Workouts */
  addWorkout: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => WorkoutEntry;
  deleteWorkout: (id: string) => void;

  /* Meals */
  addMeal: (meal: Omit<MealLog, 'id' | 'createdAt'>) => MealLog;
  deleteMeal: (id: string) => void;

  /* Progress photos */
  addPhoto: (photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => ProgressPhoto;
  deletePhoto: (id: string) => void;

  /* Bulk */
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

  // --- Hydrate once on mount -------------------------------------------------
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setState(normalize(JSON.parse(raw)));
      }
    } catch {
      // Corrupt payload -> keep defaults rather than crash.
    } finally {
      setHydrated(true);
    }
  }, []);

  // --- Write-through persistence after hydration -----------------------------
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota / private-mode failure is non-fatal; retried next change.
    }
  }, [state, hydrated]);

  // --- Scalar setters --------------------------------------------------------
  const patch = useCallback(
    (p: Partial<PersistedState>) => setState((s) => ({ ...s, ...p })),
    []
  );

  const updateProfile = useCallback(
    (p: Partial<Profile>) =>
      setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    []
  );

  const setCurrentWeight = useCallback((kg: number) => patch({ currentWeight: kg }), [patch]);
  const setTargetWeight = useCallback((kg: number) => patch({ targetWeight: kg }), [patch]);
  const setStepGoal = useCallback((steps: number) => patch({ stepGoal: steps }), [patch]);
  const setWaterGoal = useCallback((ml: number) => patch({ waterGoal: ml }), [patch]);

  // --- Daily activity (steps / water) — always operate on today's entry ------
  const mutateToday = useCallback(
    (field: keyof DailyMetric, resolve: (prev: number) => number) => {
      const key = toDateKey();
      setState((s) => {
        const prev = s.dailyLog[key] ?? { steps: 0, water: 0 };
        const nextVal = Math.max(0, Math.round(resolve(prev[field])));
        return {
          ...s,
          dailyLog: { ...s.dailyLog, [key]: { ...prev, [field]: nextVal } },
        };
      });
    },
    []
  );

  const setSteps = useCallback((steps: number) => mutateToday('steps', () => steps), [mutateToday]);
  const addSteps = useCallback((d: number) => mutateToday('steps', (p) => p + d), [mutateToday]);
  const setWater = useCallback((ml: number) => mutateToday('water', () => ml), [mutateToday]);
  const addWater = useCallback((d: number) => mutateToday('water', (p) => p + d), [mutateToday]);

  const getDay = useCallback(
    (dateKey: string = toDateKey()): DailyMetric =>
      state.dailyLog[dateKey] ?? { steps: 0, water: 0 },
    [state.dailyLog]
  );

  // --- Workouts --------------------------------------------------------------
  const addWorkout = useCallback((entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    const full: WorkoutEntry = {
      ...entry,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, workoutHistory: [full, ...s.workoutHistory] }));
    return full;
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      workoutHistory: s.workoutHistory.filter((w) => w.id !== id),
    }));
  }, []);

  // --- Meals -----------------------------------------------------------------
  const addMeal = useCallback((meal: Omit<MealLog, 'id' | 'createdAt'>) => {
    const full: MealLog = {
      ...meal,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, mealLogs: [full, ...s.mealLogs] }));
    return full;
  }, []);

  const deleteMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, mealLogs: s.mealLogs.filter((m) => m.id !== id) }));
  }, []);

  // --- Progress photos -------------------------------------------------------
  const addPhoto = useCallback((photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => {
    const full: ProgressPhoto = {
      ...photo,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, progressPhotos: [full, ...s.progressPhotos] }));
    return full;
  }, []);

  const deletePhoto = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      progressPhotos: s.progressPhotos.filter((p) => p.id !== id),
    }));
  }, []);

  const resetAll = useCallback(() => setState({ ...DEFAULT_STATE }), []);

  // --- Value -----------------------------------------------------------------
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
      addMeal,
      deleteMeal,
      addPhoto,
      deletePhoto,
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
      addMeal,
      deleteMeal,
      addPhoto,
      deletePhoto,
      resetAll,
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useGlobal(): GlobalContextValue {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobal() must be used within <GlobalProvider>.');
  return ctx;
}

export default GlobalContext;
