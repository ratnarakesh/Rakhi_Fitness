'use client';

import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
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
    // Complete the redirect sign-in when we land back on the app.
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
      // Full-page redirect (no popup / second tab) — most robust across
      // browsers, installed PWAs, and tab-manipulating extensions.
      await signInWithRedirect(fb.auth, googleProvider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError(err?.code || err?.message || 'sign-in-failed');
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
