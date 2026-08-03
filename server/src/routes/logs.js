import express from 'express';
import { query } from '../db.js';
import { authRequired, roleRequired } from '../auth.js';

const router = express.Router();

// لیست لاگ‌ها — صفحه‌بندی‌شده (admin/superadmin)
router.get('/', authRequired, roleRequired('admin', 'superadmin'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const list = await query(
    `SELECT id, admin, role, action, resource, target, ip, status,
            to_char(ts, 'YYYY-MM-DD HH24:MI:SS') AS timestamp
       FROM admin_logs ORDER BY ts DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const count = await query('SELECT count(*)::int AS total FROM admin_logs');
  res.json({ items: list.rows, total: count.rows[0].total, limit, offset });
});

export default router;
