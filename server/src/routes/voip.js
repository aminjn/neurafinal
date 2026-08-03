// مسیرهای ویپ (Asterisk ARI). تنظیمات در سوپرادمین؛ تماس‌ها در collection «call_tasks».
import express from 'express';
import { query } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';
import { testConnection, placeCall, channelStatus, hangup } from '../voip.js';

const router = express.Router();
const adminGuard = [authRequired, roleRequired('admin', 'superadmin')];

// تست اتصال به سرور ویپ — فقط ادمین
router.post('/test', ...adminGuard, async (_req, res) => {
  res.json(await testConnection());
});

// برقراری تماس دستی از پنل — فقط ادمین
// فوراً جواب می‌دهد و originate را در پس‌زمینه انجام می‌دهد تا CDN (آروان) سرِ تایم‌اوتِ
// مسیرِ کندِ ARI (ایران↔فرانسه) درخواست را دوباره نفرستد و تماس دوبار گرفته نشود.
router.post('/call', ...adminGuard, async (req, res) => {
  const { agentId, agentName, targetName, targetNumber, purpose, requestedBy, company } = req.body || {};
  placeCall({ agentId, agentName, targetName, targetNumber, purpose, requestedBy, company })
    .then((r) => console.log('VoIP manual call →', r.ok ? 'ok' : 'fail', r.task?.targetNumber || ''))
    .catch((e) => console.error('VoIP manual call error:', e?.message || e));
  res.json({ ok: true, queued: true });
});

// به‌روزرسانی وضعیت یک تماس از روی Asterisk — هر کاربر واردشده
router.get('/calls/:id/status', authRequired, async (req, res) => {
  const { rows } = await query("SELECT data FROM documents WHERE collection='call_tasks' AND id=$1", [req.params.id]);
  const task = rows[0]?.data;
  if (!task) return res.status(404).json({ error: 'not_found' });
  if (!task.channelId) return res.json({ ok: true, status: task.status });
  const st = await channelStatus(task.channelId);
  if (st.ok) {
    if (st.ended) task.status = task.status === 'failed' ? 'failed' : 'ended';
    else if (st.state === 'Up') task.status = 'answered';
    else if (['Ring', 'Ringing', 'Dialing'].includes(st.state)) task.status = 'ringing';
    task.updatedAt = new Date().toISOString();
    await query(
      `UPDATE documents SET data=$2::jsonb, updated_at=now() WHERE collection='call_tasks' AND id=$1`,
      [task.id, JSON.stringify(task)],
    );
  }
  res.json({ ok: true, status: task.status, asterisk: st });
});

// قطع تماس — فقط ادمین
router.post('/calls/:id/hangup', ...adminGuard, async (req, res) => {
  const { rows } = await query("SELECT data FROM documents WHERE collection='call_tasks' AND id=$1", [req.params.id]);
  const task = rows[0]?.data;
  if (!task?.channelId) return res.status(404).json({ error: 'not_found' });
  const r = await hangup(task.channelId);
  res.json(r);
});

export default router;
