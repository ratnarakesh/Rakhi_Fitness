'use client';

import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';

/**
 * Installed PWAs and browsers with aggressive tab-manipulating extensions break
 * popup sign-in (the popup tab can't return its result). A full-page redirect
 * avoids the second tab entirely, so we prefer it on mobile / standalone and
 * fall back to popup only on desktop browsers.
 */
function preferRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  const mobile = /Android|iPhone|iPad|iPod|Mobi/i.test(window.navigator.userAgent);
  return standalone || mobile;
}
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { firebaseEnabled, getFirebase, googleProvider } from '@/lib/firebase';

interface AuthValue {
  /** Whether cloud sync is configured at all. */
  enabled: boolean;
  /** True once the initial auth state is known. */
  authReady: boolean;
  user: User | null;
  /** Last sign-in error code/message, surfaced to the UI (null when fine). */
  error: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

// Popup errors that mean "try the full-page redirect instead".
const REDIRECT_FALLBACK = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/popup-closed-by-user',
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  // When Firebase isn't configured, auth is "ready" immediately (guest only).
  const [authReady, setAuthReady] = useState(!firebaseEnabled);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb) {
      setAuthReady(true);
      return;
    }
    // Complete any pending redirect sign-in and surface its error if any.
    getRedirectResult(fb.auth).catch((e: unknown) => {
      const err = e as { code?: string; message?: string };
      setError(err?.code || err?.message || 'redirect-failed');
    });
    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) setError(null);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    const fb = getFirebase();
    if (!fb) return;
    setError(null);
    try {
      // Prefer full-page redirect on mobile / installed PWA (popup can't return).
      if (preferRedirect()) {
        await signInWithRedirect(fb.auth, googleProvider);
        return;
      }
      await signInWithPopup(fb.auth, googleProvider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const code = err?.code || '';
      if (REDIRECT_FALLBACK.has(code)) {
        try {
          await signInWithRedirect(fb.auth, googleProvider);
        } catch (e2: unknown) {
          const err2 = e2 as { code?: string; message?: string };
          setError(err2?.code || err2?.message || 'redirect-failed');
        }
      } else {
        // e.g. auth/unauthorized-domain, auth/operation-not-allowed — show it.
        setError(code || err?.message || 'sign-in-failed');
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const fb = getFirebase();
    if (fb) await fbSignOut(fb.auth).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{ enabled: firebaseEnabled, authReady, user, error, signIn, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within <AuthProvider>.');
  return ctx;
}
