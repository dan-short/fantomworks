// Minimal service worker: exists only to satisfy PWA installability. It does
// not cache anything — this app is a live call log, so serving stale leads
// from a cache would be worse than no offline support at all.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No-op: let the browser handle every request normally.
})
