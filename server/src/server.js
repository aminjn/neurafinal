import dotenv from 'dotenv';
dotenv.config();
import cluster from 'node:cluster';
import os from 'node:os';

const PORT = Number(process.env.PORT || 4000);
// تعدادِ workerها = هستهٔ CPU (قابلِ تنظیم با WEB_CONCURRENCY). هر worker یک پروسهٔ مستقل است و
// همهٔ هسته‌ها را به کار می‌گیرد؛ پورت بین‌شان به‌صورتِ خودکار (توسط cluster) به اشتراک گذاشته می‌شود.
const workers = Math.max(1, Number(process.env.WEB_CONCURRENCY || os.cpus().length || 1));
const RTC_PORT = Number(process.env.RTC_PORT || 4001);

// سرورِ تماس (mediasoup + socket.io) باید «تک‌پروسه» باشد (اتاق‌ها in-memory‌اند و بینِ workerها به اشتراک
// نمی‌روند). پس آن را فقط در processِ primaryِ cluster (که همیشه یکی است) روی پورتِ جدا اجرا می‌کنیم؛
// اپِ اصلی روی همهٔ هسته‌ها (workerها) باقی می‌ماند. اگر mediasoup نصب/بیلد نشده باشد، تماس بی‌صدا
// غیرفعال می‌شود و بقیهٔ اپ سالم می‌ماند.
async function startRtcServer() {
  try {
    const http = await import('node:http');
    const { initRtc } = await import('./rtc/index.js');
    const rtcServer = http.createServer((req, res) => { res.writeHead(200); res.end('rtc'); });
    await initRtc(rtcServer);
    rtcServer.listen(RTC_PORT, '127.0.0.1', () => console.log(`Neura RTC (calls) listening on http://127.0.0.1:${RTC_PORT}`));
  } catch (e) { console.error('[rtc] disabled —', e?.message || e); }
}

if (cluster.isPrimary && workers > 1) {
  console.log(`Neura API primary ${process.pid} → forking ${workers} workers`);
  for (let i = 0; i < workers; i++) cluster.fork();
  // اگر workerای بمیرد، بی‌درنگ یکی جایگزین کن (پایداری تحتِ بار)
  cluster.on('exit', (worker, code, signal) => {
    console.error(`worker ${worker.process.pid} exited (${signal || code}) — respawning`);
    cluster.fork();
  });
  // سرورِ تماس فقط در primary (تک‌پروسه) اجرا می‌شود.
  await import('./proxy.js');
  await startRtcServer();
} else {
  // پروسهٔ worker (یا حالتِ تک‌پروسه): پروکسیِ خروجی و اپ را همین‌جا می‌سازیم.
  await import('./proxy.js'); // پیکربندی پروکسی برای fetch خروجی (بعد از بارگذاری env)
  const { createApp } = await import('./app.js');
  const { attachRtcUpgradeProxy } = await import('./rtc/proxy-to-rtc.js');
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`Neura API worker ${process.pid} listening on http://127.0.0.1:${PORT}`);
  });
  // ارتقای وب‌سوکتِ /api/socket.io را به پروسهٔ تماس (پورتِ RTC) پراکسی کن.
  attachRtcUpgradeProxy(server);
  // حالتِ تک‌پروسه (workers=1): سرورِ تماس را هم همین‌جا بالا بیاور.
  if (workers <= 1) await startRtcServer();
}
