// تشخیصِ سریعِ سرویسِ تماس: با بازکردنِ /api/rtc/status در مرورگر معلوم می‌شود که آیا پروسهٔ RTC
// (mediasoup) بالا آمده، IP عمومی تنظیم شده، و بازهٔ پورتِ مدیا چیست — بدونِ نیاز به SSH.
import { Router } from 'express';
import net from 'node:net';

const router = Router();

router.get('/status', (req, res) => {
  const port = Number(process.env.RTC_PORT || 4001);
  const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || null;
  const mediaPorts = (process.env.MEDIASOUP_MIN_PORT || 40000) + '-' + (process.env.MEDIASOUP_MAX_PORT || 40200);
  let done = false;
  const finish = (obj) => { if (done) return; done = true; try { sock.destroy(); } catch (_) {} res.json({ port, announcedIp, mediaPorts, ...obj }); };
  const sock = net.connect({ host: '127.0.0.1', port });
  sock.setTimeout(2500);
  // اتصالِ TCP به پورتِ RTC موفق ⇒ پروسهٔ تماس بالا و worker بوت شده (initRtc پیش از listen، worker را await می‌کند).
  sock.on('connect', () => finish({ rtc: 'up', hint: announcedIp ? 'سیگنالینگ آماده است؛ اگر مدیا وصل نشد، UDP ' + mediaPorts + ' را روی فایروال باز کنید' : '⚠️ MEDIASOUP_ANNOUNCED_IP تنظیم نشده — مدیا وصل نمی‌شود' }));
  sock.on('error', (e) => finish({ rtc: 'down', error: e.code || String(e), hint: 'پروسهٔ RTC بالا نیامده — لاگِ neura-api را ببینید (احتمالاً بیلدِ mediasoup ناموفق بوده). systemctl status neura-api' }));
  sock.on('timeout', () => finish({ rtc: 'timeout', hint: 'پورتِ RTC پاسخ نداد' }));
});

export default router;
