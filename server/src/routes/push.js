// مسیرهای Web Push: کلیدِ عمومیِ VAPID و ثبتِ اشتراکِ مرورگر.
import express from 'express';
import { authRequired } from '../auth.js';
import { vapidPublicKey, pushEnabled, saveSubscription } from '../push.js';

const router = express.Router();

// کلیدِ عمومی برای subscribe در مرورگر (عمومی است، نیاز به احراز ندارد).
router.get('/vapid', (_req, res) => res.json({ publicKey: vapidPublicKey || '', enabled: pushEnabled() }));

// ثبتِ اشتراکِ push برای کاربرِ واردشده.
router.post('/subscribe', authRequired, async (req, res) => {
  const sub = req.body && req.body.subscription ? req.body.subscription : req.body;
  const ok = await saveSubscription(req.user.sub, sub);
  res.json({ ok });
});

export default router;
