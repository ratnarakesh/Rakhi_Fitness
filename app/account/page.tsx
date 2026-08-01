'use client';

import { motion } from 'framer-motion';
import { Bell, Camera, Check, Cloud, Lock, LogOut, User } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  useGlobal,
  type ActivityLevel,
  type FitnessGoal,
  type Gender,
} from '@/context/GlobalContext';
import { cn } from '@/lib/utils';

const GENDERS: Gender[] = ['male', 'female', 'other'];
const GOALS: FitnessGoal[] = ['Fat Loss', 'Recomposition', 'Muscle Gain', 'Maintenance'];
const ACTIVITY: ActivityLevel[] = ['Sedentary', 'Light', 'Moderate', 'Active', 'Athlete'];

function toNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function bmiCategory(bmi: number): { label: string; tone: string } {
  if (bmi <= 0) return { label: '—', tone: 'text-muted' };
  if (bmi < 18.5) return { label: 'Underweight', tone: 'text-warning' };
  if (bmi < 25) return { label: 'Healthy', tone: 'text-accent' };
  if (bmi < 30) return { label: 'Overweight', tone: 'text-warning' };
  return { label: 'Obese', tone: 'text-danger' };
}

export default function AccountPage() {
  const {
    profile,
    currentWeight,
    targetWeight,
    updateProfile,
    setCurrentWeight,
    setTargetWeight,
    reminderEnabled,
    reminderTime,
    setReminder,
  } = useGlobal();

  const { enabled, authReady, user, signIn, signOutUser } = useAuth();
  // Profile details are private: gated behind login when cloud is configured.
  const gated = enabled && !user;

  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  // Local draft mirrors context; committed on Save.
  const [fullName, setFullName] = useState(profile.fullName);
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [heightCm, setHeightCm] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [weight, setWeight] = useState(currentWeight ? String(currentWeight) : '');
  const [target, setTarget] = useState(targetWeight ? String(targetWeight) : '');
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal);
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);

  // BMI computed live from the draft height + weight.
  const bmi = useMemo(() => {
    const h = toNum(heightCm) / 100;
    const w = toNum(weight);
    if (h <= 0 || w <= 0) return 0;
    return +(w / (h * h)).toFixed(1);
  }, [heightCm, weight]);
  const cat = bmiCategory(bmi);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') updateProfile({ photo: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    updateProfile({
      fullName: fullName.trim(),
      age: Math.max(0, Math.round(toNum(age))),
      gender,
      heightCm: Math.max(0, toNum(heightCm)),
      goal,
      activityLevel: activity,
    });
    // Allow clearing back to neutral by emptying the field.
    const w = toNum(weight);
    const t = toNum(target);
    setCurrentWeight(w > 0 ? +w.toFixed(1) : 0);
    setTargetWeight(t > 0 ? +t.toFixed(1) : 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="px-5 pt-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          My Account
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Profile</h1>
      </div>

      {/* Cloud sync / Google sign-in */}
      {enabled && (
        <div className="mb-4 card" data-testid="cloud-card">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Cloud size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-accent">Synced · data available on all your devices</p>
              </div>
              <button
                onClick={signOutUser}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted active:scale-95"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-muted">
                <Cloud size={16} className="text-accent" />
                <span className="label">Cloud Backup &amp; Sync</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                Sign in to back up your data and access it from any phone or laptop.
                Without signing in, everything stays on this device.
              </p>
              <button
                onClick={signIn}
                disabled={!authReady}
                data-testid="google-signin"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-[#1f1f1f] active:scale-[0.98]"
              >
                <GoogleGlyph /> Sign in with Google
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guest gate — details are private until sign-in */}
      {gated && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-accent">
            <Lock size={22} />
          </div>
          <p className="font-bold text-white">Your details are private</p>
          <p className="max-w-[16rem] text-sm text-muted">
            Sign in with Google above to view and manage your profile, weight, BMI and goals.
          </p>
        </div>
      )}

      {!gated && (
        <>
      {/* Avatar + name */}
      <div className="card flex items-center gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-alt"
          aria-label="Change photo"
        >
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-faint">
              <User size={30} />
            </span>
          )}
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-background">
            <Camera size={14} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleAvatar}
          className="hidden"
        />
        <div className="min-w-0 flex-1">
          <label className="label">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your name"
            className="input-field mt-1"
          />
        </div>
      </div>

      {/* BMI summary */}
      <div className="mt-4 card flex items-center justify-between">
        <div>
          <span className="label">Body Mass Index</span>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-accent">{bmi || '—'}</span>
            <span className={cn('mb-1 text-sm font-bold', cat.tone)}>{cat.label}</span>
          </div>
        </div>
        <div className="text-right text-xs text-muted">
          <p>{currentWeight} kg → {targetWeight} kg</p>
          <p className="mt-0.5">{heightCm ? `${heightCm} cm` : 'set height'}</p>
        </div>
      </div>

      {/* Personal details */}
      <div className="mt-4 card space-y-4">
        <p className="label">Personal Details</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Years"
              className="input-field"
            />
          </Field>
          <Field label="Height (cm)">
            <input
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="cm"
              className="input-field"
            />
          </Field>
        </div>

        <Field label="Gender">
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <Chip key={g} active={gender === g} onClick={() => setGender(g)} label={g} />
            ))}
          </div>
        </Field>
      </div>

      {/* Body metrics */}
      <div className="mt-4 card grid grid-cols-2 gap-3">
        <Field label="Current Weight (kg)">
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
            className="input-field"
          />
        </Field>
        <Field label="Target Weight (kg)">
          <input
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="kg"
            className="input-field"
          />
        </Field>
      </div>

      {/* Fitness details */}
      <div className="mt-4 card space-y-4">
        <p className="label">Fitness Details</p>
        <Field label="Primary Goal">
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g} active={goal === g} onClick={() => setGoal(g)} label={g} />
            ))}
          </div>
        </Field>
        <Field label="Activity Level">
          <div className="flex flex-wrap gap-2">
            {ACTIVITY.map((a) => (
              <Chip key={a} active={activity === a} onClick={() => setActivity(a)} label={a} />
            ))}
          </div>
        </Field>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className="btn-accent mt-6 w-full"
      >
        {saved ? (
          <>
            <Check size={18} /> Saved
          </>
        ) : (
          'Save Profile'
        )}
      </motion.button>
        </>
      )}

      {/* Gym reminder — a device setting, available without login */}
      <div className="mt-4 card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-accent" />
            <span className="label">Daily Gym Reminder</span>
          </div>
          <button
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminder(!reminderEnabled)}
            data-testid="reminder-toggle"
            className={cn(
              'relative h-7 w-12 rounded-full transition',
              reminderEnabled ? 'bg-accent' : 'bg-surface-alt border border-border'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all',
                reminderEnabled ? 'left-[22px]' : 'left-0.5'
              )}
            />
          </button>
        </div>
        {reminderEnabled && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted">Remind me at</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminder(true, e.target.value)}
              className="rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm font-bold text-white outline-none"
            />
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Best-effort: fires while the app is open in your browser. A guaranteed
          alarm when the app is fully closed isn&apos;t possible on a free web app.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition active:scale-95',
        active
          ? 'border-accent bg-accent text-background'
          : 'border-border bg-surface-alt text-muted'
      )}
    >
      {label}
    </button>
  );
}
