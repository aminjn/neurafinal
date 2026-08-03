// Web Push (نوتیفیکیشن حتی وقتی اپ بسته است) — برای کاربرانی که وب‌اپ را نصب کرده‌اند.
// کلیدهای VAPID از env می‌آیند (deploy یک‌بار می‌سازد و در .env می‌گذارد). اگر نباشند، push بی‌صدا غیرفعال است.
import webpush from 'web-push';
import { query } from './db.js';

const PUB = process.env.VAPID_PUBLIC || '';
const PRIV = process.env.VAPID_PRIVATE || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@servein.ir';

let enabled = false;
try {
  if (PUB && PRIV) { webpush.setVapidDetails(SUBJECT, PUB, PRIV); enabled = true; }
} catch (e) { console.error('[push] VAPID setup failed —', e?.message || e); }
if (!enabled) console.log('[push] disabled — VAPID_PUBLIC/PRIVATE تنظیم نشده');

export const vapidPublicKey = PUB;
export function pushEnabled() { return enabled; }

function subKey(sub) { return 'u:' + String(sub); }
function endpointId(endpoint) {
  // شناسهٔ پایدار و کوتاه از endpoint (تا هر مرورگر/دستگاه یک ردیف داشته باشد و تکراری نشود).
  let h = 0; const s = String(endpoint || '');
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return 'ps_' + (h >>> 0).toString(36) + '_' + s.length;
}

// ذخیرهٔ اشتراکِ push یک کاربر (idempotent بر اساسِ endpoint).
export async function saveSubscription(sub, subscription) {
  if (!subscription || !subscription.endpoint) return false;
  const id = endpointId(subscription.endpoint);
  try {
    await query(
      `INSERT INTO documents (collection, id, company, data) VALUES ('push_subs', $1, $2, $3::jsonb)
       ON CONFLICT (collection, id) DO UPDATE SET company = EXCLUDED.company, data = EXCLUDED.data`,
      [id, subKey(sub), JSON.stringify(subscription)]
    );
    return true;
  } catch (e) {
    // اگر قید یکتا/ON CONFLICT سازگار نبود، حداقل یک‌بار درج کن.
    try { await query(`INSERT INTO documents (collection, id, company, data) VALUES ('push_subs', $1, $2, $3::jsonb)`, [id, subKey(sub), JSON.stringify(subscription)]); return true; } catch (_) { return false; }
  }
}

// ارسالِ نوتیفیکیشن به همهٔ دستگاه‌های یک کاربر. اشتراک‌های مرده (۴۰۴/۴۱۰) پاک می‌شوند.
export async function sendPush(sub, payload) {
  if (!enabled) return { sent: 0, disabled: true };
  let rows = [];
  try { rows = (await query(`SELECT id, data FROM documents WHERE collection='push_subs' AND company=$1`, [subKey(sub)])).rows; } catch (_) { return { sent: 0 }; }
  let sent = 0;
  const body = JSON.stringify(payload || {});
  for (const row of rows) {
    const subscription = row.data;
    try { await webpush.sendNotification(subscription, body); sent++; }
    catch (e) {
      const code = e && e.statusCode;
      if (code === 404 || code === 410) { try { await query(`DELETE FROM documents WHERE collection='push_subs' AND id=$1`, [row.id]); } catch (_) {} }
    }
  }
  return { sent };
}
