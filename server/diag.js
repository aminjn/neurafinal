// تشخیص اتصال AI: آدرس‌های گپ را تست می‌کند تا بفهمیم کدام از این سرور در دسترس است.
// اجرا روی سرور:  node /opt/neura-ui/server/diag.js
import './src/proxy.js';
import { query } from './src/db.js';
import dns from 'node:dns/promises';

function mask(k) { return k ? `${String(k).slice(0, 6)}…(${String(k).length})` : '—'; }

async function reach(url, apiKey) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  const started = Date.now();
  try {
    const r = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, signal: ctrl.signal });
    clearTimeout(t);
    let body = '';
    try { body = (await r.text()).slice(0, 140).replace(/\s+/g, ' '); } catch {}
    return `HTTP ${r.status} (${Date.now() - started}ms)  ${body}`;
  } catch (e) {
    clearTimeout(t);
    return `FETCH FAILED (${Date.now() - started}ms): ${e?.message || e}`;
  }
}

async function resolve(host) {
  try { return (await dns.lookup(host, { all: true })).map((a) => a.address).join(', '); }
  catch (e) { return `DNS FAIL: ${e?.code || e?.message || e}`; }
}

console.log('NO_PROXY   =', process.env.NO_PROXY || process.env.no_proxy || '(none)');
console.log('HTTP_PROXY =', process.env.HTTP_PROXY || process.env.http_proxy || '(none)');
console.log('========================================');

// 1) آنچه در دیتابیس ثبت شده
const { rows } = await query("SELECT id, data FROM documents WHERE collection='ai_providers' ORDER BY id");
let dbKey = null;
for (const row of rows) {
  const p = row.data || {};
  const base = (p.baseUrl || '').replace(/\/$/, '');
  if (p.apiKey && !dbKey) dbKey = p.apiKey;
  console.log(`\n[DB] Provider: ${row.id}`);
  console.log(`  baseUrl : ${base || '—'}`);
  console.log(`  enabled : ${p.enabled !== false}`);
  console.log(`  apiKey  : ${mask(p.apiKey)}`);
}

// 2) تست هر دو آدرس شناخته‌شدهٔ گپ، صرف‌نظر از تنظیم دیتابیس
const HOSTS = ['api.gapgpt.app', 'api.gapapi.com'];
console.log('\n========================================');
for (const host of HOSTS) {
  console.log(`\n[PROBE] ${host}`);
  console.log(`  DNS : ${await resolve(host)}`);
  console.log(`  GET https://${host}/v1/models`);
  console.log(`    → ${await reach(`https://${host}/v1/models`, dbKey)}`);
}

// 3) شمارش مدل‌های چتِ فعال
const mc = await query("SELECT count(*)::int n FROM documents WHERE collection='ai_models' AND coalesce(data->>'kind','chat')='chat' AND coalesce((data->>'enabled')::boolean,true)=true");
console.log(`\n========================================`);
console.log(`مدل‌های چتِ فعال در کاتالوگ: ${mc.rows[0].n}`);
process.exit(0);
