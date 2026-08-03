// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Service worker نورا — فقط برای Push Notification. عمداً هیچ چیز cache      │
// │ نمی‌کند (هیچ fetch handlerی نداریم) تا مشکلِ «باندلِ کهنه» که قبلاً بود     │
// │ دوباره برنگردد؛ همه‌چیز مستقیم از شبکه می‌آید. این SW فقط ثبت می‌ماند تا     │
// │ نوتیفیکیشن‌ها حتی وقتی اپ بسته است برسند.                                  │
// └─────────────────────────────────────────────────────────────────────────┘
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // کش‌های قدیمی را پاک کن (میراثِ SW کش‌کننده) — ولی هیچ کشِ جدیدی نساز.
    try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

// هیچ fetch را intercept نمی‌کنیم ⇒ بدونِ کش، بدونِ باندلِ کهنه.

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) { try { d = { title: 'نورا', body: event.data && event.data.text() }; } catch (__) {} }
  const title = d.title || 'نورا';
  const isCall = d.kind === 'call';
  const options = {
    body: d.body || '',
    icon: d.icon || '/pwa-192.png',
    badge: '/pwa-192.png',
    dir: 'rtl',
    lang: 'fa',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: Object.assign({ url: d.url || '/' }, d.data || {}),
    vibrate: isCall ? [300, 150, 300, 150, 300] : [120],
    requireInteraction: isCall,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) {
        try { await c.focus(); if (url && url !== '/' && c.navigate) await c.navigate(url); return; } catch (_) {}
      }
    }
    if (self.clients.openWindow) { try { await self.clients.openWindow(url); } catch (_) {} }
  })());
});
