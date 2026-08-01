/**
 * Firebase web config. These values are NOT secret — they ship in every web
 * app's client bundle; security is enforced by Firestore rules + Authorized
 * Domains in the Firebase console.
 *
 * While apiKey starts with "REPLACE", cloud sync stays OFF and the app runs in
 * local-only (guest) mode for everyone.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAnAfpY7876Uc8nzhjIo7lswt5s5Q-jRNA',
  // Own-domain auth handler (proxied to firebaseapp.com via functions/__)
  // so redirect sign-in is first-party and survives 3rd-party-cookie blocking.
  authDomain: 'rakhi-fitness.pages.dev',
  projectId: 'rakhi-fitness',
  storageBucket: 'rakhi-fitness.firebasestorage.app',
  messagingSenderId: '704989217605',
  appId: '1:704989217605:web:b31c8b835fd097d460f42c',
};
