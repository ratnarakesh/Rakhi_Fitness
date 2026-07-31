'use client';

import { useEffect } from 'react';

import { useGlobal } from '@/context/GlobalContext';

/**
 * Best-effort daily gym reminder. Web apps cannot fire scheduled notifications
 * while fully closed (an OS limitation), so this arms a timer that notifies at
 * the chosen time whenever the app is open/backgrounded in the browser.
 */
export default function ReminderScheduler() {
  const { reminderEnabled, reminderTime, hydrated } = useGlobal();

  useEffect(() => {
    if (!hydrated || !reminderEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    let timeout: ReturnType<typeof setTimeout>;

    const fireAndReschedule = () => {
      if (Notification.permission === 'granted') {
        try {
          new Notification('Time to train 💪', {
            body: 'Your gym session is calling. Let’s go, Rakhi!',
            icon: '/icons/icon-192.png',
          });
        } catch {
          /* ignore */
        }
      }
      schedule();
    };

    const schedule = () => {
      const [h, m] = reminderTime.split(':').map((n) => parseInt(n, 10));
      const next = new Date();
      next.setHours(h || 17, m || 0, 0, 0);
      if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
      const delay = next.getTime() - Date.now();
      timeout = setTimeout(fireAndReschedule, delay);
    };

    schedule();
    return () => clearTimeout(timeout);
  }, [hydrated, reminderEnabled, reminderTime]);

  return null;
}
