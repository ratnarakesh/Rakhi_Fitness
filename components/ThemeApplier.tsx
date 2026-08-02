'use client';

import { useEffect } from 'react';

import { useGlobal } from '@/context/GlobalContext';

/**
 * Applies the selected theme to <html data-theme>. Also mirrors it to a small
 * dedicated localStorage key so the inline boot script (in the root layout) can
 * set the theme before first paint — no flash of the default theme on reload.
 */
export default function ThemeApplier() {
  const { theme } = useGlobal();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('rakhi-fitness/theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return null;
}
