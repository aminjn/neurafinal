// پروکسیِ نقشه/ژئوکدینگِ فارسی. کلیدِ API از تنظیماتِ سوپرادمین خوانده می‌شود و «هرگز» به کلاینت
// داده نمی‌شود — همهٔ درخواست‌ها از سرور به API بیرونی زده می‌شوند. کاربرِ واردشده می‌تواند آدرس/لوکیشن
// بگیرد (autocomplete/geocode/reverse) بدون دیدنِ کلید.
import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../auth.js';

const router = express.Router();

async function mapCfg() {
  let s = {};
  try { const r = await query('SELECT data FROM settings WHERE id = 1'); s = r.rows[0]?.data || {}; } catch (_) {}
  return {
    enabled: s.mapEnabled !== false && !!(s.mapApiBaseUrl && (s.mapApiKey || s.mapApiKeyHeader === '')),
    base: String(s.mapApiBaseUrl || '').replace(/\/+$/, ''),
    key: String(s.mapApiKey || ''),
    keyParam: (s.mapApiKeyParam == null ? 'api_key' : String(s.mapApiKeyParam)),
    keyHeader: String(s.mapApiKeyHeader || ''),
  };
}

async function callMap(cfg, path, params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) if (v != null && v !== '') usp.set(k, String(v));
  if (cfg.keyParam && cfg.key) usp.set(cfg.keyParam, cfg.key);
  const url = `${cfg.base}${path}?${usp.toString()}`;
  const headers = { Accept: 'application/json' };
  if (cfg.keyHeader && cfg.key) headers[cfg.keyHeader] = cfg.key;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, { headers, signal: ctrl.signal });
    const text = await r.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch (_) { data = { raw: text }; }
    return { ok: r.ok, status: r.status, data };
  } finally { clearTimeout(t); }
}

function guard(res, cfg) {
  if (!cfg.base) { res.status(503).json({ error: 'map_not_configured', detail: 'آدرسِ پایهٔ API نقشه در سوپرادمین تنظیم نشده' }); return false; }
  return true;
}

// تکمیلِ خودکارِ آدرس حین تایپ
router.get('/autocomplete', authRequired, async (req, res) => {
  const cfg = await mapCfg();
  if (!guard(res, cfg)) return;
  const q = String(req.query.q || '').trim();
  if (q.length < 1) return res.json({ predictions: [] });
  try {
    const r = await callMap(cfg, '/v1/autocomplete', { q, lat: req.query.lat, lng: req.query.lng, limit: req.query.limit || 8, session_token: req.query.session_token });
    res.status(r.ok ? 200 : (r.status || 502)).json(r.data || { predictions: [] });
  } catch (e) { res.status(502).json({ error: 'map_upstream', detail: String(e?.message || e) }); }
});

// ژئوکدِ مستقیم: آدرس آزاد → نقطه + آدرسِ ساخت‌یافته
router.get('/geocode', authRequired, async (req, res) => {
  const cfg = await mapCfg();
  if (!guard(res, cfg)) return;
  const address = String(req.query.address || '').trim();
  if (address.length < 2) return res.status(400).json({ error: 'address_required' });
  try {
    const r = await callMap(cfg, '/v1/geocode', { address, lang: req.query.lang || 'fa' });
    res.status(r.ok ? 200 : (r.status || 502)).json(r.data || { results: [] });
  } catch (e) { res.status(502).json({ error: 'map_upstream', detail: String(e?.message || e) }); }
});

// ژئوکدِ معکوس: نقطه → آدرس
router.get('/reverse', authRequired, async (req, res) => {
  const cfg = await mapCfg();
  if (!guard(res, cfg)) return;
  const lat = req.query.lat, lng = req.query.lng;
  if (lat == null || lng == null) return res.status(400).json({ error: 'lat_lng_required' });
  try {
    const r = await callMap(cfg, '/v1/reverse', { lat, lng, lang: req.query.lang || 'fa' });
    res.status(r.ok ? 200 : (r.status || 502)).json(r.data || { results: [] });
  } catch (e) { res.status(502).json({ error: 'map_upstream', detail: String(e?.message || e) }); }
});

// آیا نقشه پیکربندی شده؟ (برای اینکه UI دکمهٔ نقشه را نشان دهد یا نه) — بدونِ افشای کلید.
router.get('/status', authRequired, async (_req, res) => {
  const cfg = await mapCfg();
  res.json({ configured: !!cfg.base, hasKey: !!cfg.key });
});

export default router;
