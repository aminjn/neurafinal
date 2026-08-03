// ارسالِ پیامکِ الگویی (ippanel) — مشترک بین OTP و یادآورها.
// از shecanRequest (DNS شکن، IPv4) استفاده می‌کند چون ippanel داخلِ ایران است.
import { shecanRequest } from './shecan.js';

// settings: تنظیماتِ کاملِ سیستم (شاملِ ippanel*). phone: رقم بدونِ + (مثلِ 98912...).
// patternCode: کدِ الگو. variables: نگاشتِ نامِ متغیر→مقدار (مطابقِ الگوی ippanel).
export async function sendPatternSms(settings, phone, patternCode, variables = {}) {
  const s = settings || {};
  if (!s.ippanelApiKey || !patternCode) return { ok: false, error: 'sms_not_configured' };
  const baseUrl = (s.ippanelBaseUrl || 'https://api2.ippanel.com/api/v1').replace(/\/$/, '');
  const sendPath = s.ippanelSendPath || '/sms/pattern/normal/send';
  const sender = s.ippanelSender || '+983000505';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return { ok: false, error: 'bad_phone' };
  try {
    const r = await shecanRequest(`${baseUrl}${sendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: s.ippanelApiKey, accept: 'application/json' },
      body: JSON.stringify({ code: patternCode, sender, recipient: '+' + digits, variable: variables }),
      timeout: 15000,
    });
    let j = {}; try { j = JSON.parse(r.body); } catch { /* non-json */ }
    const good = r.status >= 200 && r.status < 300 && !(j && j.meta && j.meta.status === false) && !(j && j.status && j.status !== 'OK');
    if (!good) { console.error('sms send failed:', r.status, String(r.body).slice(0, 200)); return { ok: false, error: 'send_failed', status: r.status }; }
    return { ok: true };
  } catch (e) {
    console.error('sms send error:', e?.message || e);
    return { ok: false, error: 'send_error' };
  }
}
