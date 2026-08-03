import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import dataRoutes from './routes/data.js';
import myDataRoutes from './routes/mydata.js';
import walletRoutes from './routes/wallet.js';
import shopRoutes from './routes/shop.js';
import usersRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import voipRoutes from './routes/voip.js';
import logsRoutes from './routes/logs.js';
import analyticsRoutes from './routes/analytics.js';
import remindersRoutes from './routes/reminders.js';
import mapRoutes from './routes/map.js';
import peerRoutes from './routes/peer.js';
import { attachRtcHttpProxy } from './rtc/proxy-to-rtc.js';
import { auditMiddleware } from './audit.js';
import { agents as SEED_AGENTS } from './seed-data.js';
import { query } from './db.js';

// اطمینان از وجودِ ایجنت‌های پایه (idempotent): ایجنتِ جدید (مثلِ 'dine' = داین) با هر ری‌استارت اضافه
// می‌شود، بدونِ بازنویسیِ ایجنت‌های موجود (ON CONFLICT DO NOTHING). پس دیگر «seed» دستی لازم نیست.
// ایجنت‌های منسوخ که باید در هر ری‌استارت از دیتابیس پاک شوند (جایگزین شده‌اند).
const OBSOLETE_AGENTS = ['restaurant']; // «ایجنت رستوران»ِ قدیمی — «داین» جایگزینش شده
async function ensureAgents() {
  try {
    for (const a of SEED_AGENTS) {
      await query(
        "INSERT INTO documents (collection, id, company, data) VALUES ('agents', $1, $2, $3::jsonb) ON CONFLICT (collection, id) DO NOTHING",
        [String(a.id), a.company || null, JSON.stringify(a)]
      );
    }
    // پاک‌سازیِ ایجنت‌های منسوخ (تا در «تنظیمات عامل‌ها» دو ایجنتِ رستوران دیده نشود)
    for (const id of OBSOLETE_AGENTS) {
      await query("DELETE FROM documents WHERE collection = 'agents' AND id = $1", [id]);
    }
  } catch (e) { console.error('ensureAgents failed:', e && e.message); }
}

export function createApp() {
  const app = express();
  app.use(cors());
  // پراکسیِ سیگنالینگِ تماس (socket.io) → پروسهٔ mediasoup. باید پیش از body-parser باشد تا بدنه مصرف نشود.
  attachRtcHttpProxy(app);
  app.use(express.json({ limit: '30mb' })); // صوت (STT base64) ممکن است بزرگ باشد

  ensureAgents(); // در پس‌زمینه: ایجنت‌های تازه (داین) را تضمین کن

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use(auditMiddleware);

  app.use('/api/auth', authRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/data', dataRoutes);
  app.use('/api/me/data', myDataRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/shop', shopRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/peer', peerRoutes);
  app.use('/api/voip', voipRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/reminders', remindersRoutes);
  app.use('/api/map', mapRoutes);

  // 404 برای مسیرهای API
  // سرو کردنِ گزارش‌های ممیزی از مسیرِ /api (چون /*.html توسطِ SPA/CDN به index.html می‌افتد و اپ را نشان می‌دهد).
  // این مسیر مستقیم به بک‌اند می‌رسد و فایلِ HTMLِ گزارش را برمی‌گرداند.
  app.get('/api/report/:name', (req, res) => {
    const name = String(req.params.name || '').replace(/[^a-z]/g, '');
    if (!['ux', 'action', 'site', 'persist'].includes(name)) return res.status(404).json({ error: 'unknown_report' });
    const dir = process.env.REPORTS_DIR || '/opt/neuravergh/dist';
    fs.readFile(path.join(dir, name + '-audit-report.html'), (e, d) => {
      if (e) return res.status(404).send('<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;padding:40px;direction:rtl">گزارشی پیدا نشد. اول ممیزی را اجرا کن: <code>bash /opt/neura-ui/tools/run-ux-audit.sh</code></body>');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(d);
    });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

  // مدیریت خطای کلی
  app.use((err, _req, res, _next) => {
    console.error('API error:', err);
    res.status(500).json({ error: 'server_error' });
  });

  return app;
}
