'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './firebaseConfig';

/** True once a real config has been pasted (cloud sync available). */
export const firebaseEnabled =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('REPLACE');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Lazily initialize Firebase in the browser only. Returns null when disabled
 * (placeholder config) or during SSR/build — so nothing breaks in guest mode.
 */
export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  if (typeof window === 'undefined' || !firebaseEnabled) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app: app!, auth: auth!, db: db! };
}

export const googleProvider = new GoogleAuthProvider();
