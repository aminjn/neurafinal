// مسیردهی fetch خروجی (هم‌زمان، نه یکی‌یا‌اون‌یکی):
// - ippanel (پیامک، ایرانی) در NO_PROXY است ⇒ مستقیم می‌رود (پروکسی خارجی را بلاک می‌کند).
// - گپ/Noyan (هوش مصنوعی، بین‌الملل) در NO_PROXY نیست ⇒ از پروکسی می‌رود (مستقیم از ایران بلاک است).
// EnvHttpProxyAgent خودش HTTP(S)_PROXY و NO_PROXY را می‌خواند و per-domain تصمیم می‌گیرد.
import * as undici from 'undici';

const proxy =
  process.env.HTTPS_PROXY || process.env.https_proxy ||
  process.env.HTTP_PROXY || process.env.http_proxy ||
  process.env.ALL_PROXY || process.env.all_proxy;

// سرویس‌های ایرانی که از ایران «مستقیم» در دسترس‌اند و نباید از پروکسیِ خارجی رد شوند.
// (گپ/GapGPT مستقیم جواب می‌دهد؛ پروکسی فقط برای دامنه‌های واقعاً بلاک‌شده مثل api.openai.com لازم است.)
// این تضمین می‌کند حتی اگر NO_PROXYِ محیط تنظیم نشده باشد، این دامنه‌ها همیشه مستقیم بروند.
// سرویس‌های ایرانی همیشه مستقیم (شاهکار/پاد و ippanel از shecanRequest می‌روند و اصلاً به این dispatcher
// نمی‌رسند؛ ولی این‌جا هم در NO_PROXY می‌گذاریمشان تا هیچ مسیرِ fetchی هم اشتباهاً از پروکسی نرود).
const ALWAYS_DIRECT = ['api.gapapi.com', 'gapapi.com', 'api.pod.ir', 'pod.ir', 'api2.ippanel.com', 'ippanel.com'];
{
  const cur = (process.env.NO_PROXY || process.env.no_proxy || '')
    .split(',').map((h) => h.trim()).filter(Boolean);
  const merged = Array.from(new Set([...cur, ...ALWAYS_DIRECT])).join(',');
  process.env.NO_PROXY = merged;
  process.env.no_proxy = merged;
}

if (proxy) {
  try {
    // اتصالِ پروکسی را دیرتر ببند تا برقراریِ دوبارهٔ پرهزینه (CONNECT + TLS به GapGPT، ~۱۶ ثانیه)
    // کم‌تر اتفاق بیفتد. همراهِ keep-warm در ai.js، درخواست‌ها cold نمی‌شوند.
    const opts = { connections: 32, keepAliveTimeout: 60_000, keepAliveMaxTimeout: 600_000, connectTimeout: 30_000 };
    if (typeof undici.EnvHttpProxyAgent === 'function') {
      undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent(opts));
      console.log('Outbound fetch: EnvHttpProxyAgent (proxy + NO_PROXY)', 'NO_PROXY=', process.env.NO_PROXY || process.env.no_proxy || '');
    } else {
      undici.setGlobalDispatcher(new undici.ProxyAgent({ uri: proxy, ...opts }));
      console.log('Outbound fetch via proxy:', proxy);
    }
  } catch (e) {
    console.error('Failed to set proxy dispatcher:', e?.message || e);
  }
}
