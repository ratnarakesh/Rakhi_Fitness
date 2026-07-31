'use client';

import { motion } from 'framer-motion';
import { Check, Pill } from 'lucide-react';

import { useGlobal } from '@/context/GlobalContext';
import { CHECKLIST, CHECKLIST_ITEM_IDS, CHECKLIST_TOTAL } from '@/lib/checklist';
import { cn } from '@/lib/utils';

export default function ChecklistPage() {
  const { isChecked, toggleChecklistItem } = useGlobal();

  const done = CHECKLIST_ITEM_IDS.filter((id) => isChecked(id)).length;
  const pctDone = Math.round((done / CHECKLIST_TOTAL) * 100);

  return (
    <div className="px-5 pt-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          Daily Stack
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Supplements &amp; Diet</h1>
      </div>

      {/* Progress ring */}
      <div className="card mb-4 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1A1A1A" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#00FFCC"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${pctDone}, 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-accent">
            {pctDone}%
          </span>
        </div>
        <div>
          <p className="text-lg font-extrabold text-white">
            {done} / {CHECKLIST_TOTAL} done today
          </p>
          <p className="text-xs text-muted">
            {pctDone === 100 ? 'Fully dialled in 💪' : 'Tap items as you take them. Resets daily.'}
          </p>
        </div>
      </div>

      {CHECKLIST.map((group) => {
        const groupDone = group.items.filter((i) => isChecked(i.id)).length;
        return (
          <div key={group.id} className="mb-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ background: `${group.color}22`, color: group.color }}
                >
                  {group.time}
                </span>
                <p className="text-sm font-bold text-white">{group.title}</p>
              </div>
              <span className="text-xs text-muted">
                {groupDone}/{group.items.length}
              </span>
            </div>

            <div className="space-y-2">
              {group.items.map((item) => {
                const checked = isChecked(item.id);
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleChecklistItem(item.id)}
                    data-testid={`chk-${item.id}`}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition',
                      checked ? 'border-accent/50 bg-accent/10' : 'border-border bg-surface'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition',
                        checked ? 'border-accent bg-accent text-background' : 'border-border text-transparent'
                      )}
                    >
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <Pill size={16} style={{ color: group.color }} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={cn('font-bold', checked ? 'text-white' : 'text-white')}>
                        {item.label}
                      </p>
                      {item.detail && <p className="text-xs text-muted">{item.detail}</p>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="mb-2 mt-6 px-1 text-[11px] leading-relaxed text-faint">
        This checklist resets every day. Take supplements as directed by your doctor;
        adjust timing to your own routine.
      </p>
    </div>
  );
}
