/**
 * Reverse-proxy for Firebase Auth's sign-in helper.
 *
 * Requests to https://rakhi-fitness.pages.dev/__/auth/*  (and /__/firebase/*)
 * are forwarded to https://rakhi-fitness.firebaseapp.com/__/*. This makes the
 * OAuth handshake first-party on our own domain, so browsers that block
 * third-party cookies/storage (Safari ITP, Chrome partitioning) no longer drop
 * the redirect sign-in result.
 *
 * See: https://firebase.google.com/docs/auth/web/redirect-best-practices
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.protocol = 'https:';
  url.hostname = 'rakhi-fitness.firebaseapp.com';
  url.port = '';

  // Forward the original request (method, headers, body) to Firebase's host.
  const proxied = new Request(url.toString(), context.request);
  proxied.headers.set('Host', 'rakhi-fitness.firebaseapp.com');

  return fetch(proxied);
}
