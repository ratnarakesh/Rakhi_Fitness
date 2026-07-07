'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker once the app mounts. Kept as a tiny
 * client component so it can live inside the server-rendered root layout.
 * Registration is skipped in dev to avoid stale-cache confusion.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed:', err));
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
