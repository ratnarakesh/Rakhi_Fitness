'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0..100 */
  percent: number;
  className?: string;
  tone?: 'accent' | 'warning' | 'danger';
}

const TONE: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export default function ProgressBar({
  percent,
  className,
  tone = 'accent',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-alt', className)}>
      <motion.div
        className={cn('h-full rounded-full', TONE[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
