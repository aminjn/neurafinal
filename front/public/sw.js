// ┌─────────────────────────────────────────────────────────────────────────┐
// │ KILL-SWITCH service worker — به‌جای کش‌کردن، خودش را نابود می‌کند.          │
// │ نسخهٔ قبلیِ sw.js دارایی‌ها را cache-first نگه می‌داشت و باعث می‌شد گوشیِ    │
// │ کاربر برای همیشه باندلِ قدیمی را سرو کند (هیچ دیپلوی/purge/refreshی اثر     │
// │ نداشت). مرورگر برای بررسیِ به‌روزرسانی، sw.js را دوباره می‌گیرد؛ این نسخه   │
// │ همهٔ کش‌ها را پاک می‌کند، ثبتِ خودش را لغو می‌کند و همهٔ تب‌ها را ری‌لود      │
// │ می‌کند تا کدِ تازه از سرور بیاید. دیگر هیچ چیزی کش نمی‌شود.                  │
// └─────────────────────────────────────────────────────────────────────────┘
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) {}
  })());
});
// هیچ fetchای را intercept نکن — همه‌چیز مستقیم از شبکه بیاید.
