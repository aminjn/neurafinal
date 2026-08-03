// اتصال به سرور ویپ Asterisk از طریق ARI (رابط REST روی HTTP).
// تنظیمات از جدول settings خوانده می‌شود (قابل‌پیکربندی در سوپرادمین).
import { query } from './db.js';
import { Agent } from 'undici';

// ARI یک IPِ ایرانی است؛ باید مستقیم برود (نه از پروکسیِ GapGPT) — مثل ippanel.
const directAgent = new Agent({ connect: { timeout: 20000 } });

export async function getVoipSettings() {
  const { rows } = await query('SELECT data FROM settings WHERE id = 1');
  return rows[0]?.data || {};
}

// fetch با تایم‌اوت — مستقیم (دور زدنِ پروکسیِ سراسری)
async function vfetch(url, opts = {}, ms = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, dispatcher: directAgent }); }
  finally { clearTimeout(t); }
}

function ariBase(s) {
  let base = String(s.voipBaseUrl || '').trim().replace(/\/+$/, '');
  // اگر اسکیم نداده (فقط host:port)، http:// اضافه کن
  if (base && !/^https?:\/\//i.test(base)) base = `http://${base}`;
  // اگر /ari ندارد، اضافه کن
  return /\/ari$/i.test(base) ? base : `${base}/ari`;
}
function authHeader(s) {
  const u = s.voipUsername || '';
  const p = s.voipPassword || '';
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

// تستِ اتصال: نسخه‌ی Asterisk را می‌گیرد
export async function testConnection(s = null) {
  s = s || (await getVoipSettings());
  if (!s.voipBaseUrl) return { ok: false, error: 'voip_not_configured' };
  try {
    const r = await vfetch(`${ariBase(s)}/asterisk/info`, { headers: { Authorization: authHeader(s) } });
    const text = await r.text();
    let j; try { j = JSON.parse(text); } catch { j = { raw: text.slice(0, 200) }; }
    if (!r.ok) return { ok: false, status: r.status, detail: j };
    return { ok: true, version: j?.system?.version || j?.build?.version || 'unknown', info: j?.system || null };
  } catch (e) {
    return { ok: false, error: 'fetch_failed', detail: String(e?.message || e) };
  }
}

// برقراری تماس خروجی. شماره‌ی مقصد را شماره‌گیری می‌کند و طبق dialplan
// (context/extension) یا اپ Stasis وصل می‌کند.
export async function originate({ number, callerId, variables }, s = null) {
  s = s || (await getVoipSettings());
  if (!s.voipEnabled) return { ok: false, error: 'voip_disabled' };
  if (!s.voipBaseUrl) return { ok: false, error: 'voip_not_configured' };
  if (!number) return { ok: false, error: 'number_required' };

  const trunk = (s.voipTrunk || '').trim();
  const context = (s.voipContext || 'from-internal').trim();
  const appName = (s.voipAppName || '').trim();
  let endpoint = String(s.voipEndpointPattern || 'PJSIP/{number}').trim();
  // اگر ترانک تنظیم شده و در الگو نیامده، خودکار @{trunk} اضافه کن
  if (trunk && !endpoint.includes('{trunk}') && !endpoint.includes('@')) endpoint += '@{trunk}';
  endpoint = endpoint.replace('{number}', number).replace('{trunk}', trunk).replace(/@\s*$/, '');

  // یک تلاش برای originate با endpoint مشخص. forceDialplan=true یعنی Stasis app را
  // نادیده بگیر و حتماً از context/extension استفاده کن (برای تلاشِ خودترمیمِ مطمئن).
  async function attempt(ep, forceDialplan = false) {
    const params = new URLSearchParams();
    params.set('endpoint', ep);
    params.set('callerId', callerId || s.voipCallerId || 'Neura');
    params.set('timeout', String(s.voipTimeout || 30));
    if (appName && !forceDialplan) {
      params.set('app', appName);
      if (s.voipAppArgs) params.set('appArgs', String(s.voipAppArgs).trim());
    } else {
      params.set('context', context);
      params.set('extension', String(s.voipExtension || number));
      params.set('priority', String(s.voipPriority || 1));
    }
    const url = `${ariBase(s)}/channels?${params.toString()}`;
    const body = variables ? JSON.stringify({ variables }) : undefined;
    console.log('VoIP originate →', ep, 'via', ariBase(s));
    const r = await vfetch(url, {
      method: 'POST',
      headers: { Authorization: authHeader(s), 'Content-Type': 'application/json' },
      body,
    });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 200) }; }
    return { r, j };
  }

  try {
    let { r, j } = await attempt(endpoint);
    // خودترمیمی: فقط اگر واقعاً شکست خورد و هیچ کانالی ساخته نشد (وگرنه دوبار زنگ می‌خورد)
    const issabelEp = `Local/${number}@${context}`;
    if (!r.ok && !j?.id && endpoint !== issabelEp) {
      console.error('VoIP originate FAILED status=', r.status, 'detail=', JSON.stringify(j).slice(0, 200), '→ retry with', issabelEp);
      ({ r, j } = await attempt(issabelEp, true));
      if (r.ok) endpoint = issabelEp;
    }
    if (!r.ok) { console.error('VoIP originate FAILED status=', r.status, 'detail=', JSON.stringify(j).slice(0, 300)); return { ok: false, status: r.status, detail: j }; }
    console.log('VoIP originate OK channel=', j?.id, 'state=', j?.state, 'endpoint=', endpoint);
    return { ok: true, channelId: j?.id || null, state: j?.state || 'Ring', channel: j };
  } catch (e) {
    console.error('VoIP originate fetch error:', String(e?.message || e));
    return { ok: false, error: 'fetch_failed', detail: String(e?.message || e) };
  }
}

// وضعیت یک کانال: اگر کانال نباشد یعنی تماس تمام شده.
export async function channelStatus(channelId, s = null) {
  s = s || (await getVoipSettings());
  if (!s.voipBaseUrl || !channelId) return { ok: false, error: 'bad_request' };
  try {
    const r = await vfetch(`${ariBase(s)}/channels/${encodeURIComponent(channelId)}`, { headers: { Authorization: authHeader(s) } });
    if (r.status === 404) return { ok: true, ended: true, state: 'ended' };
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: r.status, detail: j };
    return { ok: true, ended: false, state: j?.state || 'unknown' };
  } catch (e) {
    return { ok: false, error: 'fetch_failed', detail: String(e?.message || e) };
  }
}

// قطع تماس
export async function hangup(channelId, s = null) {
  s = s || (await getVoipSettings());
  if (!s.voipBaseUrl || !channelId) return { ok: false, error: 'bad_request' };
  try {
    const r = await vfetch(`${ariBase(s)}/channels/${encodeURIComponent(channelId)}`, {
      method: 'DELETE', headers: { Authorization: authHeader(s) },
    });
    return { ok: r.ok || r.status === 404 };
  } catch (e) {
    return { ok: false, error: 'fetch_failed', detail: String(e?.message || e) };
  }
}

// شماره‌ی مقصد را از روی نام در مشتریان/پرسنل پیدا می‌کند (اگر شماره مستقیم داده نشده باشد).
export async function lookupNumber(name) {
  if (!name) return null;
  const { rows } = await query(
    `SELECT data FROM documents
       WHERE collection IN ('customers','personnel','agents')
         AND (data->>'name') ILIKE $1
       LIMIT 1`,
    [`%${name}%`],
  );
  const d = rows[0]?.data;
  return d?.phone || d?.mobile || d?.tel || null;
}

// ثبت «کارِ تماس» در دیتابیس + برقراری تماس. هم مسیر API و هم ابزار چت از این استفاده می‌کنند.
export async function placeCall({ agentId, agentName, targetName, targetNumber, purpose, requestedBy, requestedBySub, company, chain }) {
  const id = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  let number = targetNumber;
  if (!number && targetName) number = await lookupNumber(targetName);

  const base = {
    id, agentId: agentId || null, agentName: agentName || null,
    targetName: targetName || null, targetNumber: number || null,
    purpose: purpose || null, requestedBy: requestedBy || null,
    requestedBySub: requestedBySub || null,
    company: company || null, outcome: null, notes: null,
    chain: (chain && chain.then) ? chain : null,
    createdAt: now, updatedAt: now,
  };

  if (!number) {
    const data = { ...base, status: 'no_number' };
    await saveTask(data);
    return { ok: false, reason: 'no_number', task: data };
  }

  const data = { ...base, status: 'dialing' };
  await saveTask(data);

  // هدفِ تماس را به‌صورتِ متغیرهای کانال به پلِ صوتی می‌فرستیم تا تماسِ هدف‌مند شروع شود.
  const variables = {
    NEURA_PURPOSE: String(purpose || '').slice(0, 600),
    NEURA_TARGET: String(targetName || '').slice(0, 120),
    NEURA_BY: String(requestedBy || '').slice(0, 120),
    NEURA_AGENT: String(agentId || 'assistant'),
    NEURA_TASK: String(id),
  };
  const r = await originate({ number, callerId: agentName, variables });
  data.updatedAt = new Date().toISOString();
  if (r.ok) { data.status = 'ringing'; data.channelId = r.channelId || null; }
  else { data.status = 'failed'; data.error = r.error || r.detail || `status_${r.status}`; }
  await saveTask(data);
  return { ok: r.ok, task: data, originate: r };
}

async function saveTask(data) {
  await query(
    `INSERT INTO documents (collection, id, company, data)
       VALUES ('call_tasks', $1, $2, $3::jsonb)
     ON CONFLICT (collection, id) DO UPDATE SET data = $3::jsonb, updated_at = now()`,
    [data.id, data.company || null, JSON.stringify(data)],
  );
}
