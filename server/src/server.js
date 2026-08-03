import dotenv from 'dotenv';
dotenv.config();
import cluster from 'node:cluster';
import os from 'node:os';

const PORT = Number(process.env.PORT || 4000);
// تعدادِ workerها = هستهٔ CPU (قابلِ تنظیم با WEB_CONCURRENCY). هر worker یک پروسهٔ مستقل است و
// همهٔ هسته‌ها را به کار می‌گیرد؛ پورت بین‌شان به‌صورتِ خودکار (توسط cluster) به اشتراک گذاشته می‌شود.
const workers = Math.max(1, Number(process.env.WEB_CONCURRENCY || os.cpus().length || 1));

if (cluster.isPrimary && workers > 1) {
  console.log(`Neura API primary ${process.pid} → forking ${workers} workers`);
  for (let i = 0; i < workers; i++) cluster.fork();
  // اگر workerای بمیرد، بی‌درنگ یکی جایگزین کن (پایداری تحتِ بار)
  cluster.on('exit', (worker, code, signal) => {
    console.error(`worker ${worker.process.pid} exited (${signal || code}) — respawning`);
    cluster.fork();
  });
} else {
  // پروسهٔ worker (یا حالتِ تک‌پروسه): پروکسیِ خروجی و اپ را همین‌جا می‌سازیم.
  await import('./proxy.js'); // پیکربندی پروکسی برای fetch خروجی (بعد از بارگذاری env)
  const { createApp } = await import('./app.js');
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Neura API worker ${process.pid} listening on http://127.0.0.1:${PORT}`);
  });
}
