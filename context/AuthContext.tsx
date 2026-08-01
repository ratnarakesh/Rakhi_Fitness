'use client';

import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
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
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // When Firebase isn't configured, auth is "ready" immediately (guest only).
  const [authReady, setAuthReady] = useState(!firebaseEnabled);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb) {
      setAuthReady(true);
      return;
    }
    // Complete any pending redirect sign-in (mobile).
    getRedirectResult(fb.auth).catch(() => {});
    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    const fb = getFirebase();
    if (!fb) return;
    try {
      await signInWithPopup(fb.auth, googleProvider);
    } catch {
      // Popup blocked / unsupported (common in installed PWAs) → redirect flow.
      try {
        await signInWithRedirect(fb.auth, googleProvider);
      } catch {
        /* surfaced to the user via unchanged signed-out state */
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const fb = getFirebase();
    if (fb) await fbSignOut(fb.auth).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ enabled: firebaseEnabled, authReady, user, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within <AuthProvider>.');
  return ctx;
}
