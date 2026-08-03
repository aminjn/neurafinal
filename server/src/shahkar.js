// احرازِ هویتِ رسمی (سامانهٔ شاهکار + استعلامِ ثبت‌احوال) از طریقِ Pod.ir — پورتِ منطقِ ملک‌جت به Neura.
// ۱) استعلامِ ثبت‌احوال: کد ملی + تاریخ تولدِ شمسی → مشخصاتِ هویتی (نام/نام‌خانوادگی/…)
// ۲) تطبیقِ شاهکار: آیا شمارهٔ موبایل به نامِ همان کد ملی ثبت شده؟
// کلیدها هرگز در کد نیستند؛ از env یا از تنظیماتِ سوپرادمین (settings.podium) خوانده می‌شوند.
// تماس‌ها از DNS شکن (shecanRequest) می‌گذرند چون api.pod.ir داخلِ ایران است (مثل ippanel/گپ).
import { shecanRequest } from './shecan.js';

// امکانِ تزریقِ transport برای تست (تا بدونِ کلیدِ واقعیِ دولتی هم مسیر تست شود).
let _transport = null;
export function _setTransport(fn) { _transport = fn; }

export function shahkarConfig(settings = {}) {
  const p = (settings && settings.podium) || {};
  const v = (envKey, stored) => (process.env[envKey] && String(process.env[envKey]).trim()) || (stored && String(stored).trim()) || '';
  return {
    url: v('PODIUM_URL', p.url) || 'https://api.pod.ir/srv/sc2/consumers/services/do',
    token: v('PODIUM_TOKEN', p.token),
    idKey: v('GET_IDENTITY_INFO_API_KEY', p.idKey),
    matchKey: v('MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY', p.matchKey),
    idProduct: v('POD_IDENTITY_PRODUCT_ID', p.idProduct) || '46659320',
    matchProduct: v('POD_MATCH_PRODUCT_ID', p.matchProduct) || '46645324',
  };
}

export function podConfigured(settings) { const c = shahkarConfig(settings); return Boolean(c.token && c.idKey && c.matchKey); }
export function podMissing(settings) {
  const c = shahkarConfig(settings); const m = [];
  if (!c.token) m.push('PODIUM_TOKEN');
  if (!c.idKey) m.push('GET_IDENTITY_INFO_API_KEY');
  if (!c.matchKey) m.push('MATCH_NATIONAL_ID_AND_PHONE_NUMBER_API_KEY');
  return m;
}

// فقط برای خطای «شبکه» (درخواست اصلاً نرسیده) یک‌بار retry می‌شود؛ پاسخِ رسیده (حتی خطادار) هرگز
// دوباره فرستاده نمی‌شود چون استعلامِ دولتی هزینه دارد.
async function callPodium(c, payload) {
  if (_transport) return _transport(c, payload);
  for (let t = 0; ; t++) {
    try {
      const res = await shecanRequest(c.url, {
        method: 'POST',
        headers: { Authorization: `bearer ${c.token}`, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
        timeout: 12000,
      });
      try { return JSON.parse(res.body); } catch { return { hasError: true, message: `پاسخِ نامعتبر از پاد (HTTP ${res.status})` }; }
    } catch (e) {
      if (t >= 1) return { hasError: true, message: `اتصال به سرویسِ احراز ناموفق: ${e?.message || 'خطا'}` };
    }
  }
}

// استعلامِ ثبت‌احوال — jBirthDate: تاریخِ شمسیِ ۸ رقمی "YYYYMMDD".
export async function getIdentity(settings, nationalCode, jBirthDate) {
  const c = shahkarConfig(settings);
  if (!podConfigured(settings)) return { ok: false, error: 'POD_NOT_CONFIGURED' };
  try {
    const data = await callPodium(c, { productEntityId: Number(c.idProduct), apiKey: c.idKey, providerParameters: { nationalCode, birthDate: jBirthDate } });
    if (data.hasError || !data.result) return { ok: false, error: data.message || 'سرویسِ استعلام در دسترس نیست.' };
    const parsed = JSON.parse(data.result);
    if (!parsed || !parsed.identityInfo) return { ok: false, error: (parsed && parsed.message) || 'کد ملی یا تاریخِ تولد نادرست است.' };
    if (parsed.identityInfo.alive === false) return { ok: false, error: 'شخصِ موردنظر در سامانه فوت‌شده ثبت شده است.' };
    const i = parsed.identityInfo;
    return {
      ok: true,
      identity: {
        nationalCode: String(i.nationalCode || nationalCode),
        firstName: i.firstName || '', lastName: i.lastName || '',
        fatherName: i.fatherName || '', gender: String(i.gender || '').toLowerCase(),
        birthPlace: i.birthPlace || '', birthDate: String(i.birthDate || jBirthDate || ''),
        idNumber: i.identificationNumber != null ? String(i.identificationNumber) : '',
        idSerial: [i.identificationSerialCode, i.identificationSerialNumber != null ? String(i.identificationSerialNumber) : ''].filter(Boolean).join(' '),
        birthPlaceCode: i.birthPlaceCode != null ? String(i.birthPlaceCode) : '',
        fullName: i.fullName || `${i.firstName || ''} ${i.lastName || ''}`.trim(),
        issuancePlace: i.issuancePlace || i.issuingPlace || '',
        issuancePlaceCode: i.issuancePlaceCode != null ? String(i.issuancePlaceCode) : (i.issuingPlaceCode != null ? String(i.issuingPlaceCode) : ''),
        officeCode: i.officeCode != null ? String(i.officeCode) : '',
        raw: i,
      },
    };
  } catch (e) { return { ok: false, error: e?.message || 'IDENTITY_FETCH_ERROR' }; }
}

// تطبیقِ شاهکار: آیا این موبایل به نامِ این کد ملی است؟
export async function shahkarMatch(settings, nationalCode, mobileNumber) {
  const c = shahkarConfig(settings);
  if (!podConfigured(settings)) return { ok: false, matched: false, error: 'POD_NOT_CONFIGURED' };
  try {
    const data = await callPodium(c, { productEntityId: c.matchProduct, apiKey: c.matchKey, providerParameters: { body: { nationalCode, mobileNumber } } });
    if (!data.result) return { ok: false, matched: false, error: data.message || 'سرویسِ شاهکار پاسخ نداد.' };
    const parsed = JSON.parse(data.result);
    return { ok: true, matched: Boolean(parsed && parsed.matched) };
  } catch (e) { return { ok: false, matched: false, error: e?.message || 'MATCH_FETCH_ERROR' }; }
}

// چک‌سامِ کد ملیِ ایران (اعتبارسنجیِ آفلاین — قبل از هر تماسِ هزینه‌دار)
export function isValidNationalId(input) {
  let code = String(input);
  const L = code.length;
  if (L < 8 || parseInt(code, 10) === 0) return false;
  code = ('0000' + code).substr(L + 4 - 10);
  if (parseInt(code.substr(3, 6), 10) === 0) return false;
  const check = parseInt(code.substr(9, 1), 10);
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(code.substr(i, 1), 10) * (10 - i);
  s = s % 11;
  return (s < 2 && check === s) || (s >= 2 && check === 11 - s);
}

// نرمال‌سازی به قالبِ 09xxxxxxxxx (قالبی که pod برای شاهکار می‌خواهد)
export function to09(phone) {
  let s = String(phone || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
  if (s.startsWith('98')) s = '0' + s.slice(2);
  else if (s.startsWith('9') && s.length === 10) s = '0' + s;
  return s;
}
