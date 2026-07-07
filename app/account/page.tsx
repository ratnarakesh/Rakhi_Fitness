'use client';

import { motion } from 'framer-motion';
import { Camera, Check, User } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

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
  } = useGlobal();

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
    const w = toNum(weight);
    const t = toNum(target);
    if (w > 0) setCurrentWeight(+w.toFixed(1));
    if (t > 0) setTargetWeight(+t.toFixed(1));
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
