// تشخیصِ سریعِ سرویسِ تماس: با بازکردنِ /api/rtc/status در مرورگر معلوم می‌شود که آیا پروسهٔ RTC
// (mediasoup) بالا آمده، IP عمومی تنظیم شده، و بازهٔ پورتِ مدیا چیست — بدونِ نیاز به SSH.
import { Router } from 'express';
import http from 'node:http';

const router = Router();
const RTC_PORT = () => Number(process.env.RTC_PORT || 4001);

// GET به پورتِ RTC. اتصالِ موفق ⇒ پروسهٔ تماس بالا و worker بوت شده. /status فهرستِ آنلاین‌ها را می‌دهد.
function rtcGet(path, cb) {
  const req = http.get({ host: '127.0.0.1', port: RTC_PORT(), path, timeout: 2500 }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { cb(null, JSON.parse(d)); } catch (_) { cb(null, {}); } });
  });
  req.on('error', (e) => cb(e)); req.on('timeout', () => { req.destroy(); cb(new Error('timeout')); });
}

router.get('/status', (req, res) => {
  const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || null;
  const mediaPorts = (process.env.MEDIASOUP_MIN_PORT || 40000) + '-' + (process.env.MEDIASOUP_MAX_PORT || 40200);
  rtcGet('/status', (err, data) => {
    if (err) return res.json({ rtc: 'down', port: RTC_PORT(), announcedIp, error: err.code || err.message, hint: 'پروسهٔ RTC بالا نیامده — لاگِ neura-api را ببینید (systemctl status neura-api). احتمالاً بیلدِ mediasoup ناموفق بوده.' });
    const online = Array.isArray(data.online) ? data.online : [];
    res.json({ rtc: 'up', port: RTC_PORT(), announcedIp, mediaPorts, onlineCount: online.length, online,
      hint: announcedIp ? 'سیگنالینگ آماده است. اگر کاربر «آنلاین» نیست یعنی مرورگرش به سوکت وصل نشده (زنگ نمی‌خورد). اگر آنلاین است ولی مدیا نمی‌آید، UDP ' + mediaPorts + ' را باز کنید.' : '⚠️ MEDIASOUP_ANNOUNCED_IP تنظیم نشده — مدیا وصل نمی‌شود' });
  });
});

// حضورِ واقعی برای نشانگرِ آنلاین: ?subs=1,2,3 → { "1": true, "2": false, ... }
router.get('/presence', (req, res) => {
  const subs = String(req.query.subs || '').split(',').map((s) => s.trim()).filter(Boolean);
  rtcGet('/status', (err, data) => {
    if (err) return res.json({});
    const set = new Set((Array.isArray(data.online) ? data.online : []).map((x) => String(x.sub)));
    const out = {}; for (const s of subs) out[s] = set.has(s);
    res.json(out);
  });
});

export default router;
