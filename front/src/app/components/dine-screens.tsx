// ============================================================================
// ایجنتِ رستوران‌داری (داین) — بک‌آفیسِ رستوران/کافه. همه‌چیز واقعی و per-user است:
//   منو از menu_categories/menu_items، تنظیماتِ رستوران از dine_settings، همه از /api/me/data.
// هیچ داده‌ی فیکی اینجا نیست. این فایل هنگام دیپلوی کنار بقیهٔ کامپوننت‌ها کپی می‌شود.
// فاز ۱: DineSettingsScreen (پروفایل + برندینگ/تمِ منوی مشتری) + DineMenuBuilderScreen.
// ============================================================================
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from './app-context';
import { api } from '../services/api';

const toFa = (n: any) => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const faNum = (n: number) => toFa((Number(n) || 0).toLocaleString('en-US'));
const enDigits = (s: any) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
const num = (s: any) => Number(enDigits(s).replace(/[^0-9.]/g, '')) || 0;

const CARD: React.CSSProperties = { background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 14 };
const INPUT: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--aw-border)', background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)', fontSize: 13, outline: 'none' };
const BTN: React.CSSProperties = { padding: '9px 14px', borderRadius: 10, border: 'none', background: 'var(--aw-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' };

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{label}</span>
      {children}
      {hint ? <span className="text-[10px] text-[var(--aw-text-muted)]">{hint}</span> : null}
    </div>
  );
}

// ── تم‌های منوی مشتری: هر رستوران بر اساسِ گرافیک/برندِ خودش یکی را انتخاب می‌کند ──────────────
// این تم‌ها را نمای مشتری (اسکنِ QR) برای رندرِ منو می‌خواند. «چند مدل و تیپ با توجه به گرافیکِ مجموعه».
export const DINE_MENU_THEMES = [
  { id: 'classic', name: 'کلاسیک', desc: 'کارت‌های روشن، تصویرِ بزرگ', bg: '#ffffff', fg: '#1f2937', accent: '#b45309', layout: 'list', font: 'serif' },
  { id: 'modern', name: 'مدرن', desc: 'گرید، مینیمال، رنگِ برند', bg: '#f8fafc', fg: '#0f172a', accent: '#7c3aed', layout: 'grid', font: 'sans' },
  { id: 'dark', name: 'تیره/شبانه', desc: 'زمینهٔ تیره، مناسبِ بار/کافه‌شب', bg: '#0f1115', fg: '#e5e7eb', accent: '#f59e0b', layout: 'list', font: 'sans' },
  { id: 'cafe', name: 'کافه دنج', desc: 'گرم، قهوه‌ای، صمیمی', bg: '#fbf6ee', fg: '#3b2f2a', accent: '#8d6e4b', layout: 'list', font: 'serif' },
  { id: 'elegant', name: 'لاکچری', desc: 'مشکی-طلایی، فاین‌داینینگ', bg: '#111013', fg: '#f5efe0', accent: '#c9a24a', layout: 'grid', font: 'serif' },
  { id: 'minimal', name: 'مینیمال', desc: 'سفید، بدونِ تصویر، سریع', bg: '#ffffff', fg: '#111827', accent: '#111827', layout: 'compact', font: 'sans' },
];
export const VENUE_TYPES = ['رستوران', 'کافه', 'فست‌فود', 'قنادی/شیرینی', 'کبابی', 'پیتزا', 'آبمیوه/بستنی', 'سفره‌خانه', 'فودکورت', 'سایر'];
const WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

const DEFAULT_SETTINGS: any = {
  id: 'main', venueName: '', venueType: 'رستوران', tagline: '', phone: '', address: '', lat: null, lng: null,
  menuTheme: 'modern', primaryColor: '#7c3aed', logo: '', cover: '',
  taxPct: 9, serviceChargePct: 0, tipPresets: [5, 10, 15], currency: 'تومان',
  orderTypes: { dinein: true, takeout: true, delivery: false },
  hours: WEEK.map((d) => ({ day: d, open: '09:00', close: '23:00', closed: false })),
  stations: ['آشپزخانه', 'بار'], receiptFooter: 'با تشکر از انتخابِ شما',
  published: false,
};

// ── تنظیماتِ رستوران (پروفایل + برندینگ/تم + عملیاتی) ───────────────────────────────────────
// ── کارتِ اشتراکِ داین (درآمدزایی): وضعیتِ اشتراک + خرید/تمدید از کیف‌پول ──────────────
// اشتراکِ فعال = رستوران عمومی می‌شود و سفارش می‌گیرد. با انقضا، خودبه‌خود از دیدِ مشتری خارج می‌شود.
function DineSubCard() {
  const { showToast } = useApp() as any;
  const [sub, setSub] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { const r: any = await api.dineSubscription(); setSub(r || {}); } catch (_e) { setSub({}); } };
  useEffect(() => { load(); }, []);
  const buy = async (months: number) => {
    setBusy(true);
    try { await api.dineSubscribe(months); showToast('اشتراکِ داین فعال شد ✅', 'success'); await load(); }
    catch (e: any) {
      const msg = (e && (e.error || e.message)) || '';
      showToast(String(msg).includes('insufficient') ? 'موجودیِ کیف‌پول کافی نیست' : 'خطا در فعال‌سازیِ اشتراک');
    } finally { setBusy(false); }
  };
  if (!sub) return null;
  const active = !!sub.active;
  const price = Number(sub.monthlyPrice) || 0;
  const bg = active ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.12)';
  const bd = active ? '#10B981' : '#F59E0B';
  return (
    <div className="p-3.5 flex flex-col gap-2" style={{ ...CARD, background: bg, borderColor: bd }}>
      <div className="flex items-center gap-2">
        <i className={'fa-solid ' + (active ? 'fa-circle-check' : 'fa-triangle-exclamation')} style={{ color: bd }} />
        <span className="text-[13px]" style={{ fontWeight: 800 }}>{active ? 'اشتراکِ داین فعال' : 'اشتراکِ داین غیرفعال'}</span>
        {active && sub.daysLeft != null && <span className="text-[11px] text-[var(--aw-text-muted)]">— {toFa(sub.daysLeft)} روزِ باقی‌مانده</span>}
      </div>
      <div className="text-[11px] text-[var(--aw-text-secondary)]" style={{ lineHeight: 1.7 }}>
        {active
          ? 'رستورانِ شما عمومی است و می‌تواند سفارشِ آنلاین بگیرد. با «انتشار» در پایین، در «سفارش غذا»ی مشتری‌ها دیده می‌شوید.'
          : 'برای عمومی‌شدنِ رستوران و دریافتِ سفارشِ آنلاین، اشتراکِ ماهانهٔ داین را فعال کنید. تا وقتی فعال نباشد، منو برای مشتری‌ها نمایش داده نمی‌شود.'}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => !busy && buy(1)} disabled={busy} className="px-3 py-2 rounded-lg border-none text-white text-[12px] cursor-pointer disabled:opacity-60" style={{ background: bd, fontWeight: 700 }}>
          <i className="fa-solid fa-wallet ml-1" />{active ? 'تمدیدِ ۱ ماه' : 'فعال‌سازیِ اشتراک'}{price > 0 ? ' — ' + faNum(price) + ' ت/ماه' : ''}
        </button>
        {active && <button onClick={() => !busy && buy(12)} disabled={busy} className="px-3 py-2 rounded-lg border cursor-pointer text-[12px]" style={{ background: 'transparent', borderColor: bd, color: bd, fontWeight: 700 }}>تمدیدِ ۱ ساله</button>}
      </div>
    </div>
  );
}

export function DineSettingsScreen() {
  const { showToast } = useApp() as any;
  const [s, setS] = useState<any>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [mapOn, setMapOn] = useState(false);
  const [addrPreds, setAddrPreds] = useState<any[]>([]);
  const set = (k: string, v: any) => setS((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      try { const r: any = await api.myList('dine_settings'); const rec = Array.isArray(r) && r[0] ? r[0] : null; if (rec) setS({ ...DEFAULT_SETTINGS, ...rec, orderTypes: { ...DEFAULT_SETTINGS.orderTypes, ...(rec.orderTypes || {}) } }); } catch (_e) {}
      setLoaded(true);
    })();
    (api as any).mapStatus().then((r: any) => setMapOn(!!(r && r.configured))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapOn || !s.address || String(s.address).trim().length < 3) { setAddrPreds([]); return; }
    let alive = true; const h = setTimeout(() => {
      (api as any).mapAutocomplete(String(s.address).trim()).then((r: any) => { if (alive) setAddrPreds(Array.isArray(r && r.predictions) ? r.predictions.slice(0, 5) : []); }).catch(() => {});
    }, 400);
    return () => { alive = false; clearTimeout(h); };
  }, [s.address, mapOn]);

  const save = async () => {
    try { await api.myCreate('dine_settings', { ...s, id: 'main' }); showToast('تنظیماتِ رستوران ذخیره شد ✅', 'success'); }
    catch (_e) { showToast('خطا در ذخیره', 'info'); }
  };
  const pickLogo = (key: 'logo' | 'cover') => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { const img = new Image(); img.onload = () => { const max = key === 'cover' ? 720 : 256; let w = img.width, h = img.height; const sc = Math.min(1, max / Math.max(w, h)); w = Math.round(w * sc); h = Math.round(h * sc); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); if (!ctx) return; ctx.drawImage(img, 0, 0, w, h); set(key, cv.toDataURL('image/jpeg', 0.85)); }; img.src = String(rd.result); };
      rd.readAsDataURL(f); };
    inp.click();
  };
  const theme = DINE_MENU_THEMES.find((t) => t.id === s.menuTheme) || DINE_MENU_THEMES[1];

  if (!loaded) return <div className="flex-1 flex items-center justify-center text-[var(--aw-text-muted)] text-[13px]">در حال بارگذاری…</div>;

  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-4 flex flex-col gap-3">
      {/* اشتراکِ داین (درآمدزایی) */}
      <DineSubCard />
      {/* پروفایل */}
      <div className="p-3.5 flex flex-col gap-2.5" style={CARD}>
        <div className="text-[13px]" style={{ fontWeight: 800 }}>پروفایلِ رستوران</div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="نامِ مجموعه"><input style={INPUT} value={s.venueName} onChange={(e) => set('venueName', e.target.value)} placeholder="مثلاً رستورانِ پارس" /></Field>
          <Field label="نوع"><select style={INPUT} value={s.venueType} onChange={(e) => set('venueType', e.target.value)}>{VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="شعار (اختیاری)"><input style={INPUT} value={s.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="طعمِ اصیل" /></Field>
          <Field label="تلفن"><input style={INPUT} value={s.phone} onChange={(e) => set('phone', e.target.value)} placeholder="۰۲۱..." dir="ltr" /></Field>
        </div>
        <Field label={'آدرس' + (mapOn ? ' (جستجو روی نقشه)' : '')}>
          <textarea style={{ ...INPUT, minHeight: 52, resize: 'vertical' }} value={s.address} onChange={(e) => { set('address', e.target.value); set('lat', null); set('lng', null); }} placeholder="آدرسِ کامل" />
        </Field>
        {addrPreds.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--aw-border)' }}>
            {addrPreds.map((p: any, i: number) => (
              <button key={p.place_id || i} type="button" onClick={() => { const t = p.main_text ? (p.main_text + (p.secondary_text ? '، ' + p.secondary_text : '')) : (p.formatted_address || s.address); set('address', t); if (p.location) { set('lat', p.location.lat); set('lng', p.location.lng); } setAddrPreds([]); }}
                className="w-full text-right px-3 py-2 bg-transparent border-none cursor-pointer text-[12px] text-[var(--aw-text-primary)]" style={{ borderTop: i ? '1px solid var(--aw-border)' : 'none' }}>{p.main_text || p.formatted_address}</button>
            ))}
          </div>
        )}
        {s.lat != null && <div className="text-[10px] text-[#10B981]"><i className="fa-solid fa-location-crosshairs ml-1" />موقعیتِ نقشه ثبت شد</div>}
      </div>

      {/* برندینگ + تمِ منوی مشتری */}
      <div className="p-3.5 flex flex-col gap-3" style={CARD}>
        <div className="text-[13px]" style={{ fontWeight: 800 }}>برندینگ و تمِ منوی مشتری</div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => pickLogo('logo')} className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0" style={{ border: '2px dashed var(--aw-border)', background: 'var(--aw-bg-input)' }}>
            {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-image text-[var(--aw-text-muted)] text-[18px]" />}
          </button>
          <div className="flex-1">
            <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1" style={{ fontWeight: 600 }}>لوگو + رنگِ برند</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['#7c3aed', '#b45309', '#0ea5e9', '#e11d48', '#059669', '#111827', '#c9a24a', '#8d6e4b'].map((c) => (
                <button key={c} type="button" onClick={() => set('primaryColor', c)} className="w-7 h-7 rounded-full cursor-pointer" style={{ background: c, outline: s.primaryColor === c ? '2px solid var(--aw-text-primary)' : '2px solid transparent', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1.5" style={{ fontWeight: 600 }}>تمِ منو (مشتری با اسکنِ QR این را می‌بیند)</div>
          <div className="grid grid-cols-2 gap-2">
            {DINE_MENU_THEMES.map((t) => {
              const active = s.menuTheme === t.id;
              return (
                <button key={t.id} type="button" onClick={() => set('menuTheme', t.id)} className="rounded-xl overflow-hidden text-right cursor-pointer p-0 border-0" style={{ outline: active ? '2px solid var(--aw-primary)' : '1px solid var(--aw-border)', outlineOffset: 0 }}>
                  <div style={{ background: t.bg, color: t.fg, padding: '10px 12px', minHeight: 62 }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 800, fontSize: 12 }}>{t.name}</span>
                      <span style={{ width: 14, height: 14, borderRadius: 4, background: s.primaryColor && active ? s.primaryColor : t.accent, display: 'inline-block' }} />
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.75, marginTop: 3 }}>{t.desc}</div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                      <span style={{ height: 6, flex: 2, background: (active && s.primaryColor) || t.accent, borderRadius: 3, opacity: 0.9 }} />
                      <span style={{ height: 6, flex: 1, background: t.fg, opacity: 0.25, borderRadius: 3 }} />
                    </div>
                  </div>
                  {active && <div className="text-[9px] text-white text-center py-0.5" style={{ background: 'var(--aw-primary)' }}>انتخاب‌شده</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* عملیاتی */}
      <div className="p-3.5 flex flex-col gap-2.5" style={CARD}>
        <div className="text-[13px]" style={{ fontWeight: 800 }}>مالی و سرویس</div>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label="مالیات (٪)"><input style={INPUT} value={toFa(s.taxPct)} onChange={(e) => set('taxPct', num(e.target.value))} dir="ltr" /></Field>
          <Field label="حقِ سرویس (٪)"><input style={INPUT} value={toFa(s.serviceChargePct)} onChange={(e) => set('serviceChargePct', num(e.target.value))} dir="ltr" /></Field>
          <Field label="واحدِ پول"><input style={INPUT} value={s.currency} onChange={(e) => set('currency', e.target.value)} /></Field>
        </div>
        <div>
          <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1" style={{ fontWeight: 600 }}>نوعِ سفارش</div>
          <div className="flex gap-1.5">
            {[['dinein', 'حضوری/سرِ میز'], ['takeout', 'بیرون‌بر'], ['delivery', 'ارسال']].map(([k, lbl]) => (
              <button key={k} type="button" onClick={() => set('orderTypes', { ...s.orderTypes, [k]: !s.orderTypes[k] })}
                className="flex-1 py-2 rounded-lg text-[11px] cursor-pointer border" style={s.orderTypes[k] ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ساعاتِ کاری */}
      <div className="p-3.5 flex flex-col gap-2" style={CARD}>
        <div className="text-[13px]" style={{ fontWeight: 800 }}>ساعاتِ کاری</div>
        {(s.hours || []).map((h: any, i: number) => (
          <div key={h.day} className="flex items-center gap-2">
            <span className="w-16 text-[12px]">{h.day}</span>
            <input style={{ ...INPUT, flex: 1 }} value={h.open} onChange={(e) => set('hours', s.hours.map((x: any, j: number) => j === i ? { ...x, open: e.target.value } : x))} dir="ltr" disabled={h.closed} />
            <span className="text-[11px] text-[var(--aw-text-muted)]">تا</span>
            <input style={{ ...INPUT, flex: 1 }} value={h.close} onChange={(e) => set('hours', s.hours.map((x: any, j: number) => j === i ? { ...x, close: e.target.value } : x))} dir="ltr" disabled={h.closed} />
            <button type="button" onClick={() => set('hours', s.hours.map((x: any, j: number) => j === i ? { ...x, closed: !x.closed } : x))} className="text-[10px] px-2 py-1.5 rounded-lg cursor-pointer border" style={h.closed ? { background: 'var(--aw-danger)', color: '#fff', borderColor: 'transparent' } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>{h.closed ? 'تعطیل' : 'باز'}</button>
          </div>
        ))}
      </div>

      {/* انتشار + ذخیره */}
      <div className="p-3.5 flex items-center justify-between" style={CARD}>
        <div>
          <div className="text-[13px]" style={{ fontWeight: 800 }}>انتشارِ رستوران</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">با فعال‌کردن، رستوران در «سفارشِ غذا»ی دستیارِ کاربران دیده می‌شود.</div>
        </div>
        <button type="button" onClick={() => set('published', !s.published)} className="relative w-12 h-6 rounded-full border-none cursor-pointer" style={{ background: s.published ? '#10B981' : 'var(--aw-bg-input)' }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', [s.published ? 'left' : 'right']: 2 } as any} />
        </button>
      </div>
      <button type="button" onClick={save} style={{ ...BTN, padding: '12px', fontSize: 14 }}><i className="fa-solid fa-check-circle ml-1.5" />ذخیرهٔ تنظیمات</button>
      <div className="h-4" />
    </div>
  );
}

// ── منوساز: دسته‌بندی‌ها + آیتم‌های منو (واقعی، per-user) ────────────────────────────────────
const CAT_ICONS = ['fa-solid fa-utensils', 'fa-solid fa-mug-hot', 'fa-solid fa-burger', 'fa-solid fa-pizza-slice', 'fa-solid fa-drumstick-bite', 'fa-solid fa-ice-cream', 'fa-solid fa-cookie-bite', 'fa-solid fa-bowl-food', 'fa-solid fa-wine-glass', 'fa-solid fa-leaf', 'fa-solid fa-fish', 'fa-solid fa-bread-slice'];

export function DineMenuBuilderScreen() {
  const { showToast, openModal, closeModal } = useApp() as any;
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');

  const load = async () => {
    try { const c: any = await api.myList('menu_categories'); setCats(Array.isArray(c) ? c.slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : []); } catch (_e) {}
    try { const it: any = await api.myList('menu_items'); setItems(Array.isArray(it) ? it : []); } catch (_e) {}
  };
  useEffect(() => { load(); }, []);

  const saveCat = async (v: any) => {
    const rec = { ...v, id: v.id || 'cat_' + Date.now(), order: v.order != null ? v.order : cats.length };
    try { if (v.id) await api.myUpdate('menu_categories', String(v.id), rec); else await api.myCreate('menu_categories', rec); showToast('دسته ذخیره شد'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); }
  };
  const delCat = async (c: any) => { try { await api.myRemove('menu_categories', String(c.id)); showToast('دسته حذف شد'); load(); } catch (_e) {} };
  const saveItem = async (v: any) => {
    const rec = { ...v, id: v.id || 'mi_' + Date.now(), priceNum: num(v.priceNum), available: v.available !== false };
    try { if (v.id && items.some((x) => String(x.id) === String(v.id))) await api.myUpdate('menu_items', String(v.id), rec); else await api.myCreate('menu_items', rec); showToast('آیتم ذخیره شد'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); }
  };
  const delItem = async (it: any) => { try { await api.myRemove('menu_items', String(it.id)); showToast('آیتم حذف شد'); load(); } catch (_e) {} };
  const toggleAvail = async (it: any) => { const nv = { ...it, available: it.available === false }; setItems((prev) => prev.map((x) => x.id === it.id ? nv : x)); try { await api.myUpdate('menu_items', String(it.id), { available: nv.available }); } catch (_e) {} };

  const shown = items.filter((i) => activeCat === 'all' || String(i.categoryId) === String(activeCat));
  const catName = (id: any) => (cats.find((c) => String(c.id) === String(id)) || {}).name || 'بدون دسته';

  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[14px]" style={{ fontWeight: 800 }}>منوی رستوران</div>
        <div className="flex gap-1.5">
          <button style={{ ...BTN, background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)' }} onClick={() => openModal('دستهٔ جدید', <CatForm onSave={saveCat} />)}><i className="fa-solid fa-folder-plus ml-1" />دسته</button>
          <button style={BTN} onClick={() => openModal('آیتمِ جدید', <ItemForm cats={cats} onSave={saveItem} />)}><i className="fa-solid fa-plus ml-1" />آیتم</button>
        </div>
      </div>

      {/* نوارِ دسته‌ها */}
      <div className="flex gap-1.5 overflow-x-auto aw-scroll pb-1">
        <button onClick={() => setActiveCat('all')} className="px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border cursor-pointer" style={activeCat === 'all' ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>همه ({toFa(items.length)})</button>
        {cats.map((c) => (
          <span key={c.id} className="inline-flex items-center rounded-full border" style={activeCat === String(c.id) ? { borderColor: 'var(--aw-primary)' } : { borderColor: 'var(--aw-border)' }}>
            <button onClick={() => setActiveCat(String(c.id))} className="px-3 py-1.5 text-[11px] whitespace-nowrap bg-transparent border-none cursor-pointer" style={activeCat === String(c.id) ? { color: 'var(--aw-primary)', fontWeight: 700 } : { color: 'var(--aw-text-secondary)' }}><i className={(c.icon || 'fa-solid fa-utensils') + ' ml-1 text-[10px]'} />{c.name}</button>
            <button onClick={() => openModal('ویرایشِ دسته', <CatForm initial={c} onSave={saveCat} onDelete={() => { closeModal(); delCat(c); }} />)} className="pl-2 pr-1 text-[var(--aw-text-muted)] bg-transparent border-none cursor-pointer"><i className="fa-solid fa-pen text-[9px]" /></button>
          </span>
        ))}
        {cats.length === 0 && <span className="text-[11px] text-[var(--aw-text-muted)] py-1.5">اول یک دسته بسازید</span>}
      </div>

      {/* آیتم‌ها */}
      <div className="flex flex-col gap-2">
        {shown.map((it) => (
          <div key={it.id} className="p-2.5 flex items-center gap-3" style={{ ...CARD, opacity: it.available === false ? 0.55 : 1 }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--aw-bg-input)' }}>
              {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-utensils text-[var(--aw-text-muted)]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] truncate" style={{ fontWeight: 700 }}>{it.name}</span>
                {it.popular && <span className="text-[8px] px-1.5 py-0.5 rounded-md text-white" style={{ background: '#F59E0B' }}>پرفروش</span>}
              </div>
              <div className="text-[10px] text-[var(--aw-text-muted)] truncate">{catName(it.categoryId)}{it.desc ? ' — ' + it.desc : ''}</div>
              <div className="text-[12px] text-[#F59E0B] mt-0.5" style={{ fontWeight: 700 }}>{faNum(it.priceNum)} <span className="text-[9px] text-[var(--aw-text-muted)]">تومان</span></div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={() => toggleAvail(it)} title={it.available === false ? 'ناموجود (86)' : 'موجود'} className="text-[9px] px-2 py-1 rounded-md border cursor-pointer" style={it.available === false ? { background: 'var(--aw-danger)', color: '#fff', borderColor: 'transparent' } : { background: 'transparent', color: '#10B981', borderColor: '#10B981' }}>{it.available === false ? 'ناموجود' : 'موجود'}</button>
              <div className="flex gap-1">
                <button onClick={() => openModal('ویرایشِ آیتم', <ItemForm cats={cats} initial={it} onSave={saveItem} />)} className="w-7 h-7 rounded-lg border cursor-pointer text-[var(--aw-text-secondary)]" style={{ borderColor: 'var(--aw-border)', background: 'transparent' }}><i className="fa-solid fa-pen text-[10px]" /></button>
                <button onClick={() => delItem(it)} className="w-7 h-7 rounded-lg border-none cursor-pointer text-white" style={{ background: 'var(--aw-danger)' }}><i className="fa-solid fa-trash text-[10px]" /></button>
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <div className="text-center py-10 text-[var(--aw-text-muted)] text-[12px]"><i className="fa-solid fa-utensils text-[28px] opacity-30 block mb-3" />هنوز آیتمی در این بخش نیست</div>}
      </div>
      <div className="h-4" />
    </div>
  );
}

function CatForm({ initial, onSave, onDelete }: { initial?: any; onSave: (v: any) => void; onDelete?: () => void }) {
  const [f, setF] = useState<any>(() => ({ name: '', icon: CAT_ICONS[0], ...(initial || {}) }));
  return (
    <div className="flex flex-col gap-2.5">
      <Field label="نامِ دسته"><input style={INPUT} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="مثلاً پیش‌غذا / نوشیدنی گرم" /></Field>
      <Field label="آیکون">
        <div className="grid grid-cols-6 gap-1.5">
          {CAT_ICONS.map((ic) => <button key={ic} type="button" onClick={() => setF({ ...f, icon: ic })} className="h-9 rounded-lg border cursor-pointer" style={f.icon === ic ? { borderColor: 'var(--aw-primary)', color: 'var(--aw-primary)', background: 'var(--aw-primary-bg)' } : { borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', background: 'transparent' }}><i className={ic} /></button>)}
        </div>
      </Field>
      <div className="flex gap-2">
        <button type="button" style={{ ...BTN, flex: 1 }} onClick={() => { if (!f.name.trim()) return; onSave(f); }}>ذخیره</button>
        {onDelete && <button type="button" onClick={onDelete} className="px-4 rounded-[10px] border cursor-pointer text-[13px]" style={{ borderColor: 'var(--aw-danger)', color: 'var(--aw-danger)', background: 'transparent', fontWeight: 700 }}><i className="fa-solid fa-trash" /></button>}
      </div>
    </div>
  );
}

function ItemForm({ cats, initial, onSave }: { cats: any[]; initial?: any; onSave: (v: any) => void }) {
  const [f, setF] = useState<any>(() => ({ name: '', desc: '', priceNum: '', categoryId: (cats[0] && cats[0].id) || '', image: '', available: true, popular: false, ...(initial || {}) }));
  const pickImg = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = () => { const file = inp.files && inp.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const max = 512; let w = img.width, h = img.height; const sc = Math.min(1, max / Math.max(w, h)); w = Math.round(w * sc); h = Math.round(h * sc); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); if (!ctx) return; ctx.drawImage(img, 0, 0, w, h); setF((p: any) => ({ ...p, image: cv.toDataURL('image/jpeg', 0.85) })); }; img.src = String(rd.result); }; rd.readAsDataURL(file); }; inp.click(); };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={pickImg} className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0" style={{ border: '2px dashed var(--aw-border)', background: 'var(--aw-bg-input)' }}>{f.image ? <img src={f.image} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-camera text-[var(--aw-text-muted)]" />}</button>
        <div className="flex-1"><Field label="نامِ آیتم"><input style={INPUT} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="مثلاً جوجه‌کباب" /></Field></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="دسته"><select style={INPUT} value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>{cats.length === 0 && <option value="">— اول دسته بسازید —</option>}{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="قیمت (تومان)"><input style={INPUT} value={toFa(f.priceNum)} onChange={(e) => setF({ ...f, priceNum: num(e.target.value) })} dir="ltr" placeholder="۱۲۰۰۰۰" /></Field>
      </div>
      <Field label="توضیح (اختیاری)"><textarea style={{ ...INPUT, minHeight: 48, resize: 'vertical' }} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="مواد، اندازه، …" /></Field>
      <div className="flex gap-2">
        <button type="button" onClick={() => setF({ ...f, available: !f.available })} className="flex-1 py-2 rounded-lg text-[12px] cursor-pointer border" style={f.available !== false ? { background: 'transparent', color: '#10B981', borderColor: '#10B981' } : { background: 'var(--aw-danger)', color: '#fff', borderColor: 'transparent' }}>{f.available !== false ? 'موجود' : 'ناموجود (86)'}</button>
        <button type="button" onClick={() => setF({ ...f, popular: !f.popular })} className="flex-1 py-2 rounded-lg text-[12px] cursor-pointer border" style={f.popular ? { background: '#F59E0B', color: '#fff', borderColor: 'transparent' } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>پرفروش</button>
      </div>
      <button type="button" style={{ ...BTN, padding: '11px' }} onClick={() => { if (!f.name.trim()) return; onSave(f); }}>ذخیرهٔ آیتم</button>
    </div>
  );
}

// ============================================================================
// فاز ۲ — میز + QR، آشپزخانه (KDS)، صندوق (POS). حلقهٔ عملیاتیِ واقعیِ رستوران:
//   نشستنِ میز → ثبتِ سفارش (POS) → آشپزخانه می‌بیند (KDS) → آماده → سرو → پرداخت.
//   همه در dine_orders/dine_tables per-user ذخیره می‌شوند. هیچ داده‌ی فیکی نیست.
// ============================================================================

// QRِ واقعی (کتابخانهٔ qrcode، آفلاین و خودکفا)
function QrImg({ text, size }: { text: string; size?: number }) {
  const sz = size || 200;
  const [url, setUrl] = useState('');
  useEffect(() => { let a = true; (QRCode as any).toDataURL(text, { margin: 1, width: sz, errorCorrectionLevel: 'M' }).then((u: string) => { if (a) setUrl(u); }).catch(() => {}); return () => { a = false; }; }, [text, sz]);
  return url ? <img src={url} alt="QR" style={{ width: sz, height: sz }} /> : <div style={{ width: sz, height: sz }} className="flex items-center justify-center text-[var(--aw-text-muted)] text-[11px]">در حال ساخت…</div>;
}

function orderTotals(lines: any[], s: any) {
  const subtotal = (lines || []).reduce((a: number, l: any) => a + (Number(l.priceNum) || 0) * (Number(l.qty) || 0), 0);
  const service = Math.round(subtotal * (Number(s && s.serviceChargePct) || 0) / 100);
  const tax = Math.round((subtotal + service) * (Number(s && s.taxPct) || 0) / 100);
  return { subtotal, service, tax, total: subtotal + service + tax };
}
const ORDER_STATUS: Record<string, { label: string; color: string; next?: string }> = {
  received: { label: 'دریافت‌شده', color: '#3B82F6', next: 'cooking' },
  cooking: { label: 'در حالِ آماده‌سازی', color: '#F59E0B', next: 'ready' },
  ready: { label: 'آماده', color: '#10B981', next: 'served' },
  served: { label: 'سرو شد', color: '#8B5CF6', next: 'paid' },
  paid: { label: 'تسویه‌شده', color: '#059669' },
  cancelled: { label: 'لغو', color: '#EF4444' },
};
function elapsedMin(iso: string) { if (!iso) return 0; const t = new Date(iso).getTime(); if (isNaN(t)) return 0; return Math.max(0, Math.floor((Date.now() - t) / 60000)); }

// ── میزها + QR ──────────────────────────────────────────────────────────────────────────────
export function DineTablesScreen() {
  const { showToast, openModal, closeModal, setAdminScreen } = useApp() as any;
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [venue, setVenue] = useState<any>({});
  const load = async () => {
    try { const t: any = await api.myList('dine_tables'); setTables(Array.isArray(t) ? t : []); } catch (_e) {}
    try { const o: any = await api.myList('dine_orders'); setOrders(Array.isArray(o) ? o : []); } catch (_e) {}
    try { const v: any = await api.myList('dine_settings'); setVenue((Array.isArray(v) && v[0]) || {}); } catch (_e) {}
  };
  useEffect(() => { load(); }, []);
  const activeOrderFor = (tid: any) => orders.find((o) => String(o.tableId) === String(tid) && o.status !== 'paid' && o.status !== 'cancelled');
  const saveTable = async (v: any) => {
    const rec = { ...v, id: v.id || 'tbl_' + Date.now(), qrToken: v.qrToken || ('q' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)), seats: num(v.seats) || 2 };
    try { if (v.id) await api.myUpdate('dine_tables', String(v.id), rec); else await api.myCreate('dine_tables', rec); showToast('میز ذخیره شد'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); }
  };
  const delTable = async (t: any) => { try { await api.myRemove('dine_tables', String(t.id)); showToast('میز حذف شد'); load(); } catch (_e) {} };
  const link = (t: any) => (typeof location !== 'undefined' ? location.origin : 'https://nr.servein.ir') + '/?dine=' + (t.qrToken || '');
  const openQr = (t: any) => openModal('QR میزِ ' + (t.label || ''), (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 rounded-xl bg-white">{QrImg({ text: link(t), size: 220 })}</div>
      <div className="text-[12px] text-[var(--aw-text-secondary)] text-center">{venue.venueName || 'رستوران'} — میزِ {t.label}</div>
      <div className="text-[10px] text-[var(--aw-text-muted)] break-all text-center" dir="ltr">{link(t)}</div>
      <button style={{ ...BTN, width: '100%' }} onClick={() => { try { const w = window.open('', '_blank'); if (w) { w.document.write('<div style="text-align:center;font-family:sans-serif;padding:24px"><h2>' + (venue.venueName || 'رستوران') + '</h2><h3>میزِ ' + t.label + '</h3><img src="' + (document.querySelector('img[alt=QR]') as any || {}).src + '" style="width:280px"/><p>برای دیدنِ منو و سفارش، QR را اسکن کنید</p></div>'); w.print(); } } catch (_e) {} }}><i className="fa-solid fa-print ml-1.5" />چاپِ QR</button>
    </div>
  ));
  const openTable = (t: any) => {
    const ord = activeOrderFor(t.id);
    if (ord) { try { sessionStorage.setItem('dine_pos_order', String(ord.id)); } catch (_e) {} }
    try { sessionStorage.setItem('dine_pos_table', String(t.id)); } catch (_e) {}
    setAdminScreen('dinePosScreen');
  };

  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[14px]" style={{ fontWeight: 800 }}>میزها و QR</div>
        <button style={BTN} onClick={() => openModal('میزِ جدید', <TableForm onSave={saveTable} />)}><i className="fa-solid fa-plus ml-1" />میز</button>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {tables.map((t) => {
          const ord = activeOrderFor(t.id);
          const st = ord ? 'seated' : 'free';
          return (
            <div key={t.id} className="p-3 flex flex-col items-center gap-1.5 relative" style={{ ...CARD, borderColor: ord ? '#F59E0B' : 'var(--aw-border)' }}>
              <button onClick={() => openTable(t)} className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none w-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[15px]" style={{ background: ord ? '#F59E0B' : 'var(--aw-primary)', fontWeight: 800 }}>{t.label}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-chair text-[8px] ml-0.5" />{toFa(t.seats)} نفره{t.zone ? ' — ' + t.zone : ''}</div>
                <div className="text-[9px]" style={{ color: ord ? '#F59E0B' : '#10B981', fontWeight: 700 }}>{ord ? 'دارای سفارش' : 'آزاد'}</div>
                {ord && <div className="text-[10px] text-[#F59E0B]" style={{ fontWeight: 700 }}>{faNum(orderTotals(ord.lines, venue).total)} ت</div>}
              </button>
              <div className="flex gap-1 mt-0.5">
                <button onClick={() => openQr(t)} title="QR" className="w-6 h-6 rounded-lg border cursor-pointer text-[var(--aw-text-secondary)]" style={{ borderColor: 'var(--aw-border)', background: 'transparent' }}><i className="fa-solid fa-qrcode text-[9px]" /></button>
                <button onClick={() => openModal('ویرایشِ میز', <TableForm initial={t} onSave={saveTable} onDelete={() => { closeModal(); delTable(t); }} />)} className="w-6 h-6 rounded-lg border cursor-pointer text-[var(--aw-text-secondary)]" style={{ borderColor: 'var(--aw-border)', background: 'transparent' }}><i className="fa-solid fa-pen text-[9px]" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {tables.length === 0 && <div className="text-center py-10 text-[var(--aw-text-muted)] text-[12px]"><i className="fa-solid fa-chair text-[28px] opacity-30 block mb-3" />هنوز میزی تعریف نشده — یک میز بسازید و QRش را روی میز بگذارید</div>}
      <div className="h-4" />
    </div>
  );
}
function TableForm({ initial, onSave, onDelete }: { initial?: any; onSave: (v: any) => void; onDelete?: () => void }) {
  const [f, setF] = useState<any>(() => ({ label: '', zone: 'سالن', seats: 4, ...(initial || {}) }));
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="شماره/نامِ میز"><input style={INPUT} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="۱ / VIP" /></Field>
        <Field label="تعدادِ نفرات"><input style={INPUT} value={toFa(f.seats)} onChange={(e) => setF({ ...f, seats: num(e.target.value) })} dir="ltr" /></Field>
      </div>
      <Field label="بخش"><input style={INPUT} value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })} placeholder="سالن / تراس / طبقهٔ دوم" /></Field>
      <div className="flex gap-2">
        <button type="button" style={{ ...BTN, flex: 1 }} onClick={() => { if (!String(f.label).trim()) return; onSave(f); }}>ذخیره</button>
        {onDelete && <button type="button" onClick={onDelete} className="px-4 rounded-[10px] border cursor-pointer" style={{ borderColor: 'var(--aw-danger)', color: 'var(--aw-danger)', background: 'transparent', fontWeight: 700 }}><i className="fa-solid fa-trash" /></button>}
      </div>
    </div>
  );
}

// ── آشپزخانه (KDS) ──────────────────────────────────────────────────────────────────────────
export function DineKdsScreen() {
  const { showToast } = useApp() as any;
  const [orders, setOrders] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  const load = async () => { try { const o: any = await api.myList('dine_orders'); setOrders(Array.isArray(o) ? o : []); } catch (_e) {} };
  useEffect(() => { load(); const iv = setInterval(() => { load(); setTick((x) => x + 1); }, 8000); const t2 = setInterval(() => setTick((x) => x + 1), 30000); return () => { clearInterval(iv); clearInterval(t2); }; }, []);
  const bump = async (o: any) => {
    const nx = ORDER_STATUS[o.status] && ORDER_STATUS[o.status].next; if (!nx) return;
    const ts = { ...(o.timestamps || {}), [nx]: new Date().toISOString() };
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: nx, timestamps: ts } : x));
    try { await api.myUpdate('dine_orders', String(o.id), { status: nx, timestamps: ts }); } catch (_e) {}
    showToast('سفارش → ' + (ORDER_STATUS[nx] ? ORDER_STATUS[nx].label : nx));
  };
  const cols: { key: string; label: string }[] = [{ key: 'received', label: 'دریافت‌شده' }, { key: 'cooking', label: 'در حالِ آماده‌سازی' }, { key: 'ready', label: 'آماده' }];
  const byCol = (k: string) => orders.filter((o) => o.status === k).sort((a, b) => new Date(a.timestamps && a.timestamps.received || a.createdAt || 0).getTime() - new Date(b.timestamps && b.timestamps.received || b.createdAt || 0).getTime());
  return (
    <div className="flex-1 overflow-hidden flex flex-col p-3">
      <div className="text-[14px] mb-2 flex items-center gap-2" style={{ fontWeight: 800 }}><i className="fa-solid fa-fire text-[#F59E0B]" />نمایشگرِ آشپزخانه (KDS)<span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 400 }}>زنده</span></div>
      <div className="flex-1 grid grid-cols-3 gap-2 overflow-hidden">
        {cols.map((c) => (
          <div key={c.key} className="flex flex-col overflow-hidden rounded-xl" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="px-2 py-1.5 text-[11px] text-center" style={{ fontWeight: 800, background: (ORDER_STATUS[c.key].color) + '22', color: ORDER_STATUS[c.key].color }}>{c.label} ({toFa(byCol(c.key).length)})</div>
            <div className="flex-1 overflow-y-auto aw-scroll p-1.5 flex flex-col gap-1.5">
              {byCol(c.key).map((o) => {
                const mins = elapsedMin(o.timestamps && o.timestamps.received || o.createdAt);
                const late = (c.key === 'cooking' && mins > 15) || (c.key === 'received' && mins > 5);
                return (
                  <div key={o.id} className="p-2 rounded-lg" style={{ background: 'var(--aw-bg-input)', border: late ? '1px solid #EF4444' : '1px solid var(--aw-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ fontWeight: 800 }}>{o.type === 'dinein' ? ('میز ' + (o.tableLabel || '')) : o.type === 'takeout' ? 'بیرون‌بر' : 'ارسال'}</span>
                      <span className="text-[9px]" style={{ color: late ? '#EF4444' : 'var(--aw-text-muted)', fontWeight: 700 }}><i className="fa-regular fa-clock ml-0.5" />{toFa(mins)}′</span>
                    </div>
                    {(o.lines || []).map((l: any, i: number) => (
                      <div key={i} className="text-[10px] text-[var(--aw-text-primary)] flex items-center gap-1"><span style={{ fontWeight: 800 }}>{toFa(l.qty)}×</span><span className="truncate">{l.name}</span>{l.notes ? <span className="text-[8px] text-[#F59E0B]">({l.notes})</span> : null}</div>
                    ))}
                    <button onClick={() => bump(o)} className="w-full mt-1.5 py-1 rounded-md border-none text-white text-[9px] cursor-pointer" style={{ background: ORDER_STATUS[o.status].color, fontWeight: 700 }}>{c.key === 'ready' ? 'سرو شد ✓' : 'بعدی ←'}</button>
                  </div>
                );
              })}
              {byCol(c.key).length === 0 && <div className="text-center py-6 text-[var(--aw-text-muted)] text-[10px]">—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── صندوق (POS) ─────────────────────────────────────────────────────────────────────────────
// ── مُدالِ پرداخت: روشِ پرداخت + انعام + تقسیمِ صورتحساب ─────────────────────────────
function PayModal({ total, presets, onConfirm }: { total: number; presets: number[]; onConfirm: (p: { payMethod: string; tip: number; splitCount: number }) => void }) {
  const [method, setMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [tipPct, setTipPct] = useState<number>(0);
  const [tipCustom, setTipCustom] = useState<string>('');
  const [splitN, setSplitN] = useState<number>(1);
  const tip = tipCustom !== '' ? Math.max(0, Math.floor(num(tipCustom))) : Math.round(total * tipPct / 100);
  const grand = total + tip;
  const per = splitN > 1 ? Math.ceil(grand / splitN) : grand;
  const METHODS: [string, string, string][] = [['cash', 'نقد', 'fa-money-bill'], ['card', 'کارت', 'fa-credit-card'], ['wallet', 'کیفِ‌پول', 'fa-wallet']];
  const chip = (on: boolean): React.CSSProperties => on ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' };
  return (
    <div className="flex flex-col gap-3" style={{ minWidth: 260 }}>
      <div>
        <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1" style={{ fontWeight: 600 }}>روشِ پرداخت</div>
        <div className="flex gap-1.5">
          {METHODS.map(([k, lbl, ic]) => (
            <button key={k} onClick={() => setMethod(k as any)} className="flex-1 py-2 rounded-lg text-[11px] cursor-pointer border" style={chip(method === k)}><i className={'fa-solid ' + ic + ' ml-1'} />{lbl}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1" style={{ fontWeight: 600 }}>انعام (به پرسنل)</div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => { setTipPct(0); setTipCustom(''); }} className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border" style={chip(tipPct === 0 && tipCustom === '')}>بدون</button>
          {(presets || []).map((p) => (
            <button key={p} onClick={() => { setTipPct(p); setTipCustom(''); }} className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border" style={chip(tipPct === p && tipCustom === '')}>{toFa(p)}٪</button>
          ))}
        </div>
        <input style={{ ...INPUT, marginTop: 6 }} placeholder="مبلغِ دلخواهِ انعام (تومان)" value={tipCustom} onChange={(e) => setTipCustom(e.target.value)} inputMode="numeric" />
      </div>
      <div>
        <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1" style={{ fontWeight: 600 }}>تقسیمِ صورتحساب</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSplitN((n) => Math.max(1, n - 1))} className="w-8 h-8 rounded-lg border-none text-white cursor-pointer" style={{ background: 'var(--aw-danger)' }}><i className="fa-solid fa-minus text-[10px]" /></button>
          <span className="text-[13px]" style={{ fontWeight: 800 }}>{toFa(splitN)} نفر</span>
          <button onClick={() => setSplitN((n) => Math.min(20, n + 1))} className="w-8 h-8 rounded-lg border-none text-white cursor-pointer" style={{ background: 'var(--aw-primary)' }}><i className="fa-solid fa-plus text-[10px]" /></button>
          {splitN > 1 && <span className="text-[11px] text-[var(--aw-text-muted)]">هر نفر: <b style={{ color: '#F59E0B' }}>{faNum(per)} ت</b></span>}
        </div>
      </div>
      <div className="border-t border-[var(--aw-border)] pt-2 flex flex-col gap-1">
        <div className="flex justify-between text-[11px] text-[var(--aw-text-secondary)]"><span>مبلغِ سفارش</span><span>{faNum(total)} ت</span></div>
        {tip > 0 && <div className="flex justify-between text-[11px] text-[var(--aw-text-secondary)]"><span>انعام</span><span>{faNum(tip)} ت</span></div>}
        <div className="flex justify-between text-[14px]" style={{ fontWeight: 800 }}><span>مجموع</span><span>{faNum(grand)} ت</span></div>
      </div>
      <button onClick={() => onConfirm({ payMethod: method, tip, splitCount: splitN })} className="py-2.5 rounded-lg border-none text-white text-[13px] cursor-pointer" style={{ background: '#10B981', fontWeight: 700 }}><i className="fa-solid fa-check ml-1" />ثبتِ پرداخت</button>
    </div>
  );
}

export function DinePosScreen() {
  const { showToast, setAdminScreen, openModal, closeModal } = useApp() as any;
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [venue, setVenue] = useState<any>({});
  const [activeCat, setActiveCat] = useState<string>('all');
  const [lines, setLines] = useState<any[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [otype, setOtype] = useState<'dinein' | 'takeout' | 'delivery'>('dinein');
  const [tableId, setTableId] = useState<string>('');

  useEffect(() => {
    (async () => {
      try { const c: any = await api.myList('menu_categories'); setCats(Array.isArray(c) ? c : []); } catch (_e) {}
      try { const it: any = await api.myList('menu_items'); setItems(Array.isArray(it) ? it : []); } catch (_e) {}
      try { const t: any = await api.myList('dine_tables'); setTables(Array.isArray(t) ? t : []); } catch (_e) {}
      try { const v: any = await api.myList('dine_settings'); setVenue((Array.isArray(v) && v[0]) || {}); } catch (_e) {}
      // اگر از صفحهٔ میز آمده‌ایم، همان میز/سفارش را باز کن
      let pre = ''; let preOrd = '';
      try { pre = sessionStorage.getItem('dine_pos_table') || ''; preOrd = sessionStorage.getItem('dine_pos_order') || ''; sessionStorage.removeItem('dine_pos_table'); sessionStorage.removeItem('dine_pos_order'); } catch (_e) {}
      if (pre) { setTableId(pre); setOtype('dinein'); }
      if (preOrd) { try { const o: any = await api.myList('dine_orders'); const ord = (Array.isArray(o) ? o : []).find((x: any) => String(x.id) === String(preOrd)); if (ord) { setLines(ord.lines || []); setOrderId(String(ord.id)); setOtype(ord.type || 'dinein'); setTableId(String(ord.tableId || '')); } } catch (_e) {} }
    })();
  }, []);

  const addItem = (it: any) => setLines((prev) => { const e = prev.find((l) => String(l.menuItemId) === String(it.id)); return e ? prev.map((l) => String(l.menuItemId) === String(it.id) ? { ...l, qty: l.qty + 1 } : l) : [...prev, { menuItemId: it.id, name: it.name, priceNum: Number(it.priceNum) || 0, qty: 1, notes: '', station: 'آشپزخانه', lineStatus: 'pending' }]; });
  const decItem = (id: any) => setLines((prev) => prev.flatMap((l) => String(l.menuItemId) === String(id) ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]));
  const t = orderTotals(lines, venue);
  const shown = items.filter((i) => i.available !== false && (activeCat === 'all' || String(i.categoryId) === String(activeCat)));
  const tableLabel = (tables.find((x) => String(x.id) === String(tableId)) || {}).label || '';

  const persist = async (status: string, pay?: { payMethod?: string; tip?: number; splitCount?: number }) => {
    if (!lines.length) { showToast('سفارش خالی است'); return; }
    const id = orderId || 'do_' + Date.now();
    const now = new Date().toISOString();
    const existing = orderId;
    const tip = Math.max(0, Math.floor(Number(pay && pay.tip) || 0));
    const payMethod = (pay && pay.payMethod) || null;
    // تقسیمِ صورتحساب یک کمکِ زندهٔ لحظهٔ پرداخت است (در PayModal مبلغِ هر نفر نمایش داده می‌شود)؛
    // عددِ N ذخیرهٔ پایدار ندارد چون مصرف‌کننده‌ای ندارد. tip ذخیره می‌شود (در بینشِ مدیر مصرف می‌شود).
    const paidFields: any = status === 'paid' ? { payMethod, tip, paidTotal: t.total + tip } : { payMethod };
    const rec: any = { id, type: otype, tableId: otype === 'dinein' ? tableId : '', tableLabel: otype === 'dinein' ? tableLabel : '', lines, subtotal: t.subtotal, service: t.service, tax: t.tax, total: t.total, status, paid: status === 'paid', createdAt: now, ...paidFields };
    rec.timestamps = { received: now, ...(status === 'paid' ? { paid: now } : {}) };
    try {
      if (existing) await api.myUpdate('dine_orders', id, { lines, subtotal: t.subtotal, service: t.service, tax: t.tax, total: t.total, status, paid: status === 'paid', ...paidFields });
      else await api.myCreate('dine_orders', rec);
      if (otype === 'dinein' && tableId) { try { await api.myUpdate('dine_tables', String(tableId), { currentOrderId: status === 'paid' ? '' : id }); } catch (_e) {} }
      showToast(status === 'paid' ? 'پرداخت ثبت شد و میز آزاد شد ✅' : 'سفارش به آشپزخانه ارسال شد ✅', 'success');
      setLines([]); setOrderId(null); if (status === 'paid') setAdminScreen('dineTablesScreen');
      else setOrderId(id);
    } catch (_e) { showToast('خطا در ثبت'); }
  };
  const openPay = () => {
    if (!lines.length) { showToast('سفارش خالی است'); return; }
    openModal('پرداخت', <PayModal total={t.total} presets={(venue && venue.tipPresets) || [5, 10, 15]} onConfirm={(p: any) => { closeModal(); persist('paid', p); }} />);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
      {/* منو */}
      <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-l border-[var(--aw-border)]">
        <div className="flex gap-1.5 p-2 overflow-x-auto aw-scroll">
          <button onClick={() => setActiveCat('all')} className="px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border cursor-pointer" style={activeCat === 'all' ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>همه</button>
          {cats.map((c) => <button key={c.id} onClick={() => setActiveCat(String(c.id))} className="px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border cursor-pointer" style={activeCat === String(c.id) ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>{c.name}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto aw-scroll p-2 grid grid-cols-2 md:grid-cols-3 gap-2 content-start">
          {shown.map((it) => (
            <button key={it.id} onClick={() => addItem(it)} className="p-2 rounded-xl text-right cursor-pointer" style={CARD}>
              <div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{it.name}</div>
              <div className="text-[11px] text-[#F59E0B]" style={{ fontWeight: 700 }}>{faNum(it.priceNum)} ت</div>
            </button>
          ))}
          {shown.length === 0 && <div className="col-span-3 text-center py-8 text-[var(--aw-text-muted)] text-[11px]">آیتمِ موجودی نیست — از «منو» اضافه کنید</div>}
        </div>
      </div>
      {/* رسید */}
      <div className="w-full md:w-[300px] flex flex-col min-h-0" style={{ background: 'var(--aw-bg-card)' }}>
        <div className="p-2 flex gap-1 border-b border-[var(--aw-border)]">
          {[['dinein', 'سرِ میز'], ['takeout', 'بیرون‌بر'], ['delivery', 'ارسال']].map(([k, lbl]) => (
            <button key={k} onClick={() => setOtype(k as any)} className="flex-1 py-1.5 rounded-lg text-[11px] cursor-pointer border" style={otype === k ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>{lbl}</button>
          ))}
        </div>
        {otype === 'dinein' && (
          <div className="p-2 border-b border-[var(--aw-border)]">
            <select style={INPUT} value={tableId} onChange={(e) => setTableId(e.target.value)}><option value="">— انتخابِ میز —</option>{tables.map((x) => <option key={x.id} value={x.id}>میز {x.label}</option>)}</select>
          </div>
        )}
        <div className="flex-1 overflow-y-auto aw-scroll p-2 flex flex-col gap-1.5">
          {lines.map((l) => (
            <div key={l.menuItemId} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: 'var(--aw-bg-input)' }}>
              <div className="flex-1 min-w-0"><div className="text-[11px] truncate" style={{ fontWeight: 600 }}>{l.name}</div><div className="text-[10px] text-[#F59E0B]">{faNum(l.priceNum * l.qty)} ت</div></div>
              <button onClick={() => decItem(l.menuItemId)} className="w-6 h-6 rounded-md border-none text-white cursor-pointer" style={{ background: 'var(--aw-danger)' }}><i className={'fa-solid ' + (l.qty === 1 ? 'fa-trash' : 'fa-minus') + ' text-[9px]'} /></button>
              <span className="w-5 text-center text-[12px]" style={{ fontWeight: 700 }}>{toFa(l.qty)}</span>
              <button onClick={() => addItem({ id: l.menuItemId, name: l.name, priceNum: l.priceNum })} className="w-6 h-6 rounded-md border-none text-white cursor-pointer" style={{ background: 'var(--aw-primary)' }}><i className="fa-solid fa-plus text-[9px]" /></button>
            </div>
          ))}
          {lines.length === 0 && <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11px]">آیتمی انتخاب نشده</div>}
        </div>
        <div className="p-2.5 border-t border-[var(--aw-border)] flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-[var(--aw-text-secondary)]"><span>جمع</span><span>{faNum(t.subtotal)} ت</span></div>
          {t.service > 0 && <div className="flex justify-between text-[11px] text-[var(--aw-text-secondary)]"><span>حقِ سرویس</span><span>{faNum(t.service)} ت</span></div>}
          {t.tax > 0 && <div className="flex justify-between text-[11px] text-[var(--aw-text-secondary)]"><span>مالیات</span><span>{faNum(t.tax)} ت</span></div>}
          <div className="flex justify-between text-[13px]" style={{ fontWeight: 800 }}><span>قابلِ پرداخت</span><span>{faNum(t.total)} ت</span></div>
          <div className="flex gap-1.5 mt-1">
            <button onClick={() => persist('received')} className="flex-1 py-2.5 rounded-lg border-none text-white text-[12px] cursor-pointer" style={{ background: '#F59E0B', fontWeight: 700 }}><i className="fa-solid fa-fire ml-1" />به آشپزخانه</button>
            <button onClick={openPay} className="flex-1 py-2.5 rounded-lg border-none text-white text-[12px] cursor-pointer" style={{ background: '#10B981', fontWeight: 700 }}><i className="fa-solid fa-money-bill ml-1" />پرداخت</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// فاز ۳ — رسپی (BOM) + بهای تمام‌شدهٔ غذا. هر آیتمِ منو به مواد اولیهٔ انبار (proc_inventory) وصل می‌شود؛
// بهای تمام‌شده، حاشیهٔ سود و درصدِ فودکاست «واقعی» از قیمتِ خریدِ مواد + ضرایبِ تبدیلِ واحد (تنظیماتِ
// سوپرادمین) محاسبه می‌شود. هیچ عددِ فیکی نیست.
// ============================================================================
const DEFAULT_CONV: Record<string, number> = { 'گرم': 1, 'کیلوگرم': 1000, 'تن': 1000000, 'میلی‌لیتر': 1, 'لیتر': 1000, 'عدد': 1, 'بسته': 1, 'کارتن': 1, 'متر': 1, 'متر مکعب': 1 };
function ingCostPerBase(ing: any, conv: Record<string, number>) {
  const price = num(ing && (ing.purchasePrice || ing.salePrice) || 0);
  const iu = (conv && conv[ing && ing.unit]) || 1;
  return iu ? price / iu : price; // هزینه به‌ازای واحدِ پایه (گرم/میلی‌لیتر/عدد)
}
function recipeFoodCost(recipe: any, ingById: Record<string, any>, conv: Record<string, number>) {
  const lines = (recipe && recipe.lines) || [];
  let batch = 0;
  for (const l of lines) {
    const ing = ingById[String(l && l.ingredientId)]; if (!ing) continue;
    const cpb = ingCostPerBase(ing, conv);
    const lineBase = num(l.qty) * ((conv && conv[l.unit]) || 1);
    batch += lineBase * cpb;
  }
  const waste = num(recipe && recipe.wastePct) / 100;
  const y = Math.max(1, num(recipe && recipe.yield) || 1);
  return Math.round((batch * (1 + waste)) / y);
}

export function DineRecipesScreen() {
  const { showToast, openModal, closeModal } = useApp() as any;
  const [items, setItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ings, setIngs] = useState<any[]>([]);
  const [conv, setConv] = useState<Record<string, number>>(DEFAULT_CONV);
  const load = async () => {
    try { const it: any = await api.myList('menu_items'); setItems(Array.isArray(it) ? it : []); } catch (_e) {}
    try { const r: any = await api.myList('recipes'); setRecipes(Array.isArray(r) ? r : []); } catch (_e) {}
    try { const g: any = await api.myList('proc_inventory'); setIngs(Array.isArray(g) ? g : []); } catch (_e) {}
    try { const s: any = await api.getSettings(); if (s && s.unitConversion && Object.keys(s.unitConversion).length) setConv({ ...DEFAULT_CONV, ...s.unitConversion }); } catch (_e) {}
  };
  useEffect(() => { load(); }, []);
  const ingById: Record<string, any> = {}; ings.forEach((g) => { ingById[String(g.id)] = g; });
  const recByItem: Record<string, any> = {}; recipes.forEach((r) => { recByItem[String(r.menuItemId)] = r; });

  const save = async (rec: any) => {
    const r = { ...rec, id: rec.id || 'rcp_' + Date.now() };
    try { if (rec.id) await api.myUpdate('recipes', String(rec.id), r); else await api.myCreate('recipes', r); showToast('رسپی ذخیره شد ✅', 'success'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); }
  };

  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-4 flex flex-col gap-2.5">
      <div className="text-[14px] mb-1" style={{ fontWeight: 800 }}>رسپی و بهای تمام‌شده</div>
      {ings.length === 0 && <div className="p-3 rounded-xl text-[11px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)' }}><i className="fa-solid fa-circle-info ml-1" />اول موادِ اولیه را در تبِ «انبار» وارد کنید تا بتوانید رسپی و بهای تمام‌شده بسازید.</div>}
      {items.map((it) => {
        const rec = recByItem[String(it.id)];
        const cost = rec ? recipeFoodCost(rec, ingById, conv) : null;
        const price = num(it.priceNum);
        const margin = cost != null ? price - cost : null;
        const fcPct = cost != null && price > 0 ? Math.round((cost / price) * 100) : null;
        const pctColor = fcPct == null ? 'var(--aw-text-muted)' : fcPct <= 30 ? '#10B981' : fcPct <= 40 ? '#F59E0B' : '#EF4444';
        return (
          <button key={it.id} onClick={() => openModal('رسپیِ ' + it.name, <RecipeForm item={it} recipe={rec} ings={ings} conv={conv} onSave={save} />)}
            className="p-3 flex items-center gap-3 text-right cursor-pointer" style={CARD}>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] truncate" style={{ fontWeight: 700 }}>{it.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">قیمت فروش: {faNum(price)} ت</div>
            </div>
            {rec ? (
              <div className="flex flex-col items-end gap-0.5">
                <div className="text-[11px]"><span className="text-[var(--aw-text-muted)]">تمام‌شده: </span><span style={{ fontWeight: 800 }}>{faNum(cost!)} ت</span></div>
                <div className="text-[11px]"><span className="text-[var(--aw-text-muted)]">سود: </span><span style={{ fontWeight: 800, color: (margin || 0) >= 0 ? '#10B981' : '#EF4444' }}>{faNum(margin!)} ت</span></div>
                <div className="text-[9px] px-2 py-0.5 rounded-md text-white" style={{ background: pctColor, fontWeight: 700 }}>فودکاست {toFa(fcPct!)}٪</div>
              </div>
            ) : <span className="text-[10px] px-2.5 py-1 rounded-lg border" style={{ borderColor: 'var(--aw-primary)', color: 'var(--aw-primary)' }}>تنظیمِ رسپی</span>}
          </button>
        );
      })}
      {items.length === 0 && <div className="text-center py-10 text-[var(--aw-text-muted)] text-[12px]">اول از تبِ «منو» آیتم اضافه کنید</div>}
      <div className="h-4" />
    </div>
  );
}

function RecipeForm({ item, recipe, ings, conv, onSave }: { item: any; recipe?: any; ings: any[]; conv: Record<string, number>; onSave: (v: any) => void }) {
  const [f, setF] = useState<any>(() => ({ menuItemId: item.id, yield: 1, wastePct: 5, lines: [], ...(recipe || {}) }));
  const [pick, setPick] = useState('');
  const ingById: Record<string, any> = {}; ings.forEach((g) => { ingById[String(g.id)] = g; });
  const addLine = (g: any) => setF((p: any) => ({ ...p, lines: [...(p.lines || []), { ingredientId: g.id, qty: 0, unit: g.unit || 'گرم' }] }));
  const setLine = (i: number, patch: any) => setF((p: any) => ({ ...p, lines: p.lines.map((l: any, j: number) => j === i ? { ...l, ...patch } : l) }));
  const delLine = (i: number) => setF((p: any) => ({ ...p, lines: p.lines.filter((_l: any, j: number) => j !== i) }));
  const cost = recipeFoodCost(f, ingById, conv);
  const price = num(item.priceNum);
  const fcPct = price > 0 ? Math.round((cost / price) * 100) : 0;
  const units = Array.from(new Set(['گرم', 'کیلوگرم', 'میلی‌لیتر', 'لیتر', 'عدد', 'بسته', ...Object.keys(conv)]));
  const matches = pick.trim() ? ings.filter((g) => String(g.name || '').includes(pick.trim())) : ings.slice(0, 8);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="تعدادِ پرس (yield)"><input style={INPUT} value={toFa(f.yield)} onChange={(e) => setF({ ...f, yield: num(e.target.value) })} dir="ltr" /></Field>
        <Field label="ضایعات (٪)"><input style={INPUT} value={toFa(f.wastePct)} onChange={(e) => setF({ ...f, wastePct: num(e.target.value) })} dir="ltr" /></Field>
      </div>
      <div>
        <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1" style={{ fontWeight: 600 }}>مواد اولیه (از انبار)</div>
        <div className="flex flex-col gap-1.5">
          {(f.lines || []).map((l: any, i: number) => {
            const g = ingById[String(l.ingredientId)];
            return (
              <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ background: 'var(--aw-bg-input)' }}>
                <span className="flex-1 text-[11px] truncate">{g ? g.name : 'حذف‌شده'}</span>
                <input style={{ ...INPUT, width: 64, padding: '6px 8px' }} value={toFa(l.qty)} onChange={(e) => setLine(i, { qty: num(e.target.value) })} dir="ltr" />
                <select style={{ ...INPUT, width: 90, padding: '6px 8px' }} value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })}>{units.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                <button onClick={() => delLine(i)} className="w-7 h-7 rounded-md border-none text-white cursor-pointer flex-shrink-0" style={{ background: 'var(--aw-danger)' }}><i className="fa-solid fa-trash text-[9px]" /></button>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 relative">
          <input style={INPUT} value={pick} onChange={(e) => setPick(e.target.value)} placeholder="افزودنِ ماده — نامِ ماده را بنویس…" />
          {pick.trim() && (
            <div className="rounded-xl overflow-hidden mt-1" style={{ border: '1px solid var(--aw-border)' }}>
              {matches.slice(0, 6).map((g) => (
                <button key={g.id} onClick={() => { addLine(g); setPick(''); }} className="w-full text-right px-3 py-2 bg-transparent border-none cursor-pointer text-[12px]" style={{ borderTop: '1px solid var(--aw-border)' }}>{g.name} <span className="text-[10px] text-[var(--aw-text-muted)]">({faNum(num(g.purchasePrice || g.salePrice))} ت/{g.unit})</span></button>
              ))}
              {matches.length === 0 && <div className="px-3 py-2 text-[11px] text-[var(--aw-text-muted)]">ماده‌ای پیدا نشد — از تبِ انبار اضافه کنید</div>}
            </div>
          )}
        </div>
      </div>
      <div className="p-2.5 rounded-xl flex items-center justify-between" style={{ background: 'var(--aw-primary-bg)' }}>
        <div className="text-[11px]"><span className="text-[var(--aw-text-secondary)]">بهای تمام‌شده هر پرس: </span><span style={{ fontWeight: 800 }}>{faNum(cost)} ت</span></div>
        <div className="text-[11px]"><span className="text-[var(--aw-text-secondary)]">فودکاست: </span><span style={{ fontWeight: 800, color: fcPct <= 30 ? '#10B981' : fcPct <= 40 ? '#F59E0B' : '#EF4444' }}>{toFa(fcPct)}٪</span></div>
      </div>
      <button type="button" style={{ ...BTN, padding: '11px' }} onClick={() => onSave(f)}>ذخیرهٔ رسپی</button>
    </div>
  );
}

// ============================================================================
// فاز ۶ — پرسنل و شیفت‌ها + هزینهٔ نیرویِ کار. همه per-user (dine_staff/dine_shifts).
// کلاک‌این/کلاک‌اوت → ساعتِ کارکرد × دستمزدِ ساعتی = هزینهٔ واقعیِ نیرو. هیچ عددِ فیکی نیست.
// ============================================================================
const STAFF_ROLES = ['مدیر', 'سرآشپز', 'آشپز', 'کمک‌آشپز', 'گارسون', 'صندوق‌دار', 'باریستا', 'پیک', 'نظافت', 'انباردار'];

function StaffForm({ staff, onSave }: { staff?: any; onSave: (v: any) => void }) {
  const [f, setF] = useState<any>(() => ({ name: '', role: 'گارسون', hourlyWage: 0, phone: '', active: true, ...(staff || {}) }));
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <div className="flex flex-col gap-2.5" style={{ minWidth: 260 }}>
      <Field label="نام و نام‌خانوادگی"><input style={INPUT} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <Field label="سمت"><select style={INPUT} value={f.role} onChange={(e) => set('role', e.target.value)}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
      <Field label="دستمزدِ ساعتی (تومان)" hint="مبنای محاسبهٔ هزینهٔ نیرویِ کار در شیفت"><input style={INPUT} value={f.hourlyWage} onChange={(e) => set('hourlyWage', num(e.target.value))} inputMode="numeric" /></Field>
      <Field label="موبایل"><input style={INPUT} value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></Field>
      <label className="flex items-center gap-2 text-[12px] cursor-pointer"><input type="checkbox" checked={f.active !== false} onChange={(e) => set('active', e.target.checked)} />فعال</label>
      <button onClick={() => { if (!String(f.name).trim()) { return; } onSave(f); }} style={BTN}>ذخیره</button>
    </div>
  );
}

// آموزش و ارزیابیِ پرسنل — چک‌لیستِ آموزشی + ارزیابیِ دوره‌ای، ذخیره در همان رکوردِ dine_staff.
const STAFF_TRAINING = ['بهداشت و ایمنیِ غذا', 'کار با صندوق (POS)', 'آشنایی با منو و رسپی', 'سرویس‌دهی و برخورد با مشتری', 'مدیریتِ شکایات'];
const EVAL_CRITERIA: [string, string][] = [['speed', 'سرعت'], ['manner', 'برخورد'], ['accuracy', 'دقت'], ['order', 'نظم']];

function StaffDetail({ staff, onSave }: { staff: any; onSave: (v: any) => void }) {
  const [tab, setTab] = useState<'training' | 'eval'>('training');
  const [training, setTraining] = useState<Record<string, boolean>>(() => (staff.training && typeof staff.training === 'object') ? { ...staff.training } : {});
  const [evals, setEvals] = useState<any[]>(() => Array.isArray(staff.evaluations) ? staff.evaluations : []);
  const [ev, setEv] = useState<any>({ speed: 3, manner: 3, accuracy: 3, order: 3, note: '' });
  const doneCount = STAFF_TRAINING.filter((m) => training[m]).length;
  const addEval = () => {
    const avg = Math.round((num(ev.speed) + num(ev.manner) + num(ev.accuracy) + num(ev.order)) / 4 * 10) / 10;
    setEvals((prev) => [{ date: new Date().toLocaleDateString('fa-IR'), ratings: { speed: num(ev.speed), manner: num(ev.manner), accuracy: num(ev.accuracy), order: num(ev.order) }, avg, note: ev.note }, ...prev]);
    setEv({ speed: 3, manner: 3, accuracy: 3, order: 3, note: '' });
  };
  const chip = (on: boolean): React.CSSProperties => on ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' };
  return (
    <div className="flex flex-col gap-3" style={{ minWidth: 280 }}>
      <div className="flex gap-1.5">
        {([['training', 'آموزش (' + toFa(doneCount) + '/' + toFa(STAFF_TRAINING.length) + ')'], ['eval', 'ارزیابی']] as [string, string][]).map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k as any)} className="px-3 py-1.5 rounded-full text-[11px] cursor-pointer border" style={chip(tab === k)}>{lbl}</button>
        ))}
      </div>
      {tab === 'training' && (
        <div className="flex flex-col gap-1.5">
          {STAFF_TRAINING.map((m) => (
            <label key={m} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ background: 'var(--aw-bg-input)' }}>
              <input type="checkbox" checked={!!training[m]} onChange={() => setTraining((p) => ({ ...p, [m]: !p[m] }))} />
              <span className="text-[12px]" style={{ fontWeight: training[m] ? 700 : 500 }}>{m}</span>
            </label>
          ))}
        </div>
      )}
      {tab === 'eval' && (
        <div className="flex flex-col gap-2">
          <div className="p-2.5 flex flex-col gap-2" style={CARD}>
            {EVAL_CRITERIA.map(([k, lbl]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-[11px] w-12">{lbl}</span>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setEv((p: any) => ({ ...p, [k]: n }))} className="w-6 h-6 rounded-md border-none cursor-pointer text-[10px]" style={{ background: n <= num(ev[k]) ? '#F59E0B' : 'var(--aw-bg-input)', color: n <= num(ev[k]) ? '#fff' : 'var(--aw-text-muted)', fontWeight: 700 }}>{toFa(n)}</button>)}</div>
              </div>
            ))}
            <input style={INPUT} value={ev.note} onChange={(e) => setEv((p: any) => ({ ...p, note: e.target.value }))} placeholder="یادداشت (اختیاری)" />
            <button onClick={addEval} style={BTN}><i className="fa-solid fa-plus ml-1" />ثبتِ ارزیابی</button>
          </div>
          {evals.map((e, i) => (
            <div key={i} className="p-2 flex items-center justify-between" style={CARD}>
              <div><div className="text-[11px]" style={{ fontWeight: 700 }}>میانگین: <span style={{ color: '#F59E0B' }}>{toFa(e.avg)}</span> / ۵</div>{e.note ? <div className="text-[9px] text-[var(--aw-text-muted)]">{e.note}</div> : null}</div>
              <span className="text-[9px] text-[var(--aw-text-muted)]">{e.date}</span>
            </div>
          ))}
          {evals.length === 0 && <div className="text-center py-3 text-[var(--aw-text-muted)] text-[11px]">هنوز ارزیابی‌ای ثبت نشده</div>}
        </div>
      )}
      <button onClick={() => onSave({ ...staff, training, evaluations: evals })} style={{ ...BTN, background: '#10B981' }}><i className="fa-solid fa-check ml-1" />ذخیره</button>
    </div>
  );
}

export function DineStaffScreen() {
  const { showToast, openModal, closeModal } = useApp() as any;
  const [tab, setTab] = useState<'staff' | 'shifts'>('staff');
  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const load = async () => {
    try { const s: any = await api.myList('dine_staff'); setStaff(Array.isArray(s) ? s : []); } catch (_e) {}
    try { const sh: any = await api.myList('dine_shifts'); setShifts(Array.isArray(sh) ? sh : []); } catch (_e) {}
  };
  useEffect(() => { load(); }, []);

  const saveStaff = async (v: any) => {
    try { if (v.id) await api.myUpdate('dine_staff', String(v.id), v); else await api.myCreate('dine_staff', { ...v, id: 'stf_' + Date.now() }); showToast('ذخیره شد ✅', 'success'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); }
  };
  const removeStaff = async (id: any) => { try { await api.myRemove('dine_staff', String(id)); load(); } catch (_e) {} };

  const openShiftFor = (sid: any) => shifts.find((x) => String(x.staffId) === String(sid) && !x.end);
  const liveCost = (sh: any) => sh.end ? (Number(sh.laborCost) || 0) : Math.round(((Date.now() - new Date(sh.start).getTime()) / 3600000) * (Number(sh.wage) || 0));
  const liveHours = (sh: any) => Math.round((sh.end ? (Number(sh.hours) || 0) : (Date.now() - new Date(sh.start).getTime()) / 3600000) * 10) / 10;
  const clockIn = async (st: any) => {
    if (openShiftFor(st.id)) { showToast('این پرسنل شیفتِ باز دارد'); return; }
    const rec = { id: 'shf_' + Date.now(), staffId: st.id, staffName: st.name, role: st.role || '', wage: Number(st.hourlyWage) || 0, start: new Date().toISOString(), end: '', hours: 0, laborCost: 0 };
    try { await api.myCreate('dine_shifts', rec); showToast('شیفت شروع شد ⏱', 'success'); load(); } catch (_e) { showToast('خطا'); }
  };
  const clockOut = async (sh: any) => {
    const end = new Date().toISOString();
    const hours = Math.max(0, (new Date(end).getTime() - new Date(sh.start).getTime()) / 3600000);
    const laborCost = Math.round(hours * (Number(sh.wage) || 0));
    try { await api.myUpdate('dine_shifts', String(sh.id), { end, hours: Math.round(hours * 100) / 100, laborCost }); showToast('شیفت پایان یافت — هزینه: ' + faNum(laborCost) + ' ت', 'success'); load(); } catch (_e) { showToast('خطا'); }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayShifts = shifts.filter((s) => String(s.start || '').slice(0, 10) === todayStr);
  const todayLabor = todayShifts.reduce((a, s) => a + liveCost(s), 0);
  const openCount = shifts.filter((s) => !s.end).length;
  const chip = (on: boolean): React.CSSProperties => on ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' };

  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-3 flex flex-col gap-3">
      <div className="flex gap-1.5">
        {([['staff', 'پرسنل'], ['shifts', 'شیفت‌ها و هزینهٔ نیرو']] as [string, string][]).map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k as any)} className="px-3 py-1.5 rounded-full text-[11px] cursor-pointer border" style={chip(tab === k)}>{lbl}</button>
        ))}
      </div>

      {tab === 'staff' && (
        <>
          <button onClick={() => openModal('پرسنلِ جدید', <StaffForm onSave={saveStaff} />)} style={BTN}><i className="fa-solid fa-user-plus ml-1" />افزودنِ پرسنل</button>
          <div className="flex flex-col gap-2">
            {staff.map((st) => {
              const sh = openShiftFor(st.id);
              return (
                <div key={st.id} className="p-2.5 flex items-center gap-2" style={CARD}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px]" style={{ background: 'var(--aw-primary)', fontWeight: 800 }}>{String(st.name || '?').slice(0, 1)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{st.name} {st.active === false && <span className="text-[9px] text-[var(--aw-text-muted)]">(غیرفعال)</span>}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{st.role} · {faNum(st.hourlyWage)} ت/ساعت{sh ? ' · شیفتِ باز ⏱' : ''}</div>
                  </div>
                  {sh ? <button onClick={() => clockOut(sh)} className="px-2.5 py-1.5 rounded-lg border-none text-white text-[10px] cursor-pointer" style={{ background: '#EF4444', fontWeight: 700 }}>پایانِ شیفت</button>
                      : <button onClick={() => clockIn(st)} className="px-2.5 py-1.5 rounded-lg border-none text-white text-[10px] cursor-pointer" style={{ background: '#10B981', fontWeight: 700 }}>شروعِ شیفت</button>}
                  <button onClick={() => openModal('آموزش و ارزیابیِ ' + st.name, <StaffDetail staff={st} onSave={saveStaff} />)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }} title="آموزش و ارزیابی"><i className="fa-solid fa-graduation-cap text-[10px]" /></button>
                  <button onClick={() => openModal('ویرایشِ ' + st.name, <StaffForm staff={st} onSave={saveStaff} />)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}><i className="fa-solid fa-pen text-[10px]" /></button>
                  <button onClick={() => removeStaff(st.id)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-danger)' }}><i className="fa-solid fa-trash text-[10px]" /></button>
                </div>
              );
            })}
            {staff.length === 0 && <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11px]">هنوز پرسنلی ثبت نشده — «افزودنِ پرسنل»</div>}
          </div>
        </>
      )}

      {tab === 'shifts' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3" style={CARD}><div className="text-[10px] text-[var(--aw-text-muted)]">هزینهٔ نیرویِ امروز</div><div className="text-[16px] text-[#F59E0B]" style={{ fontWeight: 800 }}>{faNum(todayLabor)} ت</div></div>
            <div className="p-3" style={CARD}><div className="text-[10px] text-[var(--aw-text-muted)]">شیفت‌های باز</div><div className="text-[16px]" style={{ fontWeight: 800 }}>{toFa(openCount)}</div></div>
          </div>
          <div className="flex flex-col gap-2">
            {[...shifts].sort((a, b) => String(b.start).localeCompare(String(a.start))).slice(0, 60).map((sh) => (
              <div key={sh.id} className="p-2.5 flex items-center gap-2" style={CARD}>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{sh.staffName} <span className="text-[10px] text-[var(--aw-text-muted)]">{sh.role}</span></div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{new Date(sh.start).toLocaleString('fa-IR')} {sh.end ? '→ ' + new Date(sh.end).toLocaleTimeString('fa-IR') : '· در حالِ کار'}</div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-[11px]" style={{ fontWeight: 700 }}>{toFa(liveHours(sh))} ساعت</div>
                  <div className="text-[11px] text-[#F59E0B]" style={{ fontWeight: 700 }}>{faNum(liveCost(sh))} ت</div>
                </div>
                {!sh.end && <button onClick={() => clockOut(sh)} className="px-2 py-1.5 rounded-lg border-none text-white text-[10px] cursor-pointer" style={{ background: '#EF4444', fontWeight: 700 }}>پایان</button>}
              </div>
            ))}
            {shifts.length === 0 && <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11px]">هنوز شیفتی ثبت نشده</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// فاز ۸ — مغزِ داین (بینشِ مدیر). تحلیلِ «واقعیِ» رستوران از دادهٔ خودِ صاحب:
// فروشِ امروز، مهندسیِ منو (ستاره/پرفروشِ کم‌سود/کم‌فروشِ پرسود/ضعیف)، فودکاست، کمبودِ انبار،
// هزینهٔ نیرو + کارهای پیشنهادیِ امروز. همه از api.dineInsights (بدونِ هیچ عددِ فیک).
// همین ارقام، چتِ ایجنتِ داین را هم غنی می‌کند تا مشاورهٔ گراندد بدهد.
// ============================================================================
const ME_CLASS: Record<string, { label: string; color: string; icon: string; tip: string }> = {
  star: { label: 'ستاره', color: '#10B981', icon: 'fa-solid fa-star', tip: 'پرفروش و پرسود — برجسته و تبلیغ کن' },
  plowhorse: { label: 'پرفروشِ کم‌سود', color: '#F59E0B', icon: 'fa-solid fa-horse', tip: 'محبوب ولی کم‌سود — بهای تمام‌شده را کم یا کمی گران‌تر کن' },
  puzzle: { label: 'کم‌فروشِ پرسود', color: '#3B82F6', icon: 'fa-solid fa-puzzle-piece', tip: 'پرسود ولی کم‌فروش — فعالانه پیشنهاد بده (آپ‌سل)' },
  dog: { label: 'ضعیف', color: '#EF4444', icon: 'fa-solid fa-triangle-exclamation', tip: 'کم‌فروش و کم‌سود — بازطراحی یا حذف' },
  unknown: { label: 'بدونِ رسپی', color: '#6B7280', icon: 'fa-solid fa-circle-question', tip: 'رسپی تعریف کن تا بهای تمام‌شده معلوم شود' },
};

export function DineInsightsScreen() {
  const [ins, setIns] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { (async () => { try { const r: any = await api.dineInsights(); setIns(r || {}); } catch (_e) { setErr(true); } })(); }, []);
  useEffect(() => { (async () => { try { const r: any = await api.dineForecast(); setFc(r); } catch (_e) {} })(); }, []);
  const [pr, setPr] = useState<any>(null);
  useEffect(() => { (async () => { try { const r: any = await api.dinePricing(); setPr(r); } catch (_e) {} })(); }, []);
  const [rv, setRv] = useState<any>(null);
  useEffect(() => { (async () => { try { const r: any = await api.dineReviews(); setRv(r); } catch (_e) {} })(); }, []);
  if (err) return <div className="flex-1 flex items-center justify-center text-[var(--aw-text-muted)] text-[13px]">خطا در دریافتِ بینش</div>;
  if (!ins) return <div className="flex-1 flex items-center justify-center text-[var(--aw-text-muted)] text-[13px]">در حال تحلیل…</div>;
  const t = ins.today || {};
  const me = ins.menuEngineering || {};
  // کارهای پیشنهادیِ امروز (از ارقامِ واقعی)
  const actions: string[] = [];
  (ins.lowStock || []).slice(0, 3).forEach((x: any) => actions.push('سفارشِ خرید برای «' + x.name + '» (موجودی رو به اتمام)'));
  (ins.highFoodCost || []).slice(0, 2).forEach((x: any) => actions.push('«' + x.name + '» فودکاستِ ' + toFa(x.fcPct) + '٪ دارد — قیمت/پرس را بازبینی کن'));
  (me.puzzle || []).slice(0, 2).forEach((x: string) => actions.push('«' + x + '» پرسود ولی کم‌فروش است — پیشنهادش بده'));
  (me.dog || []).slice(0, 2).forEach((x: string) => actions.push('«' + x + '» ضعیف است — بازطراحی یا حذف کن'));
  if (ins.noRecipeCount) actions.push(toFa(ins.noRecipeCount) + ' آیتم بدونِ رسپی — برای محاسبهٔ سود رسپی تعریف کن');

  const Stat = ({ label, value, sub, color }: any) => (
    <div className="p-3 flex flex-col gap-0.5" style={CARD}>
      <div className="text-[10px] text-[var(--aw-text-muted)]">{label}</div>
      <div className="text-[16px]" style={{ fontWeight: 800, color: color || 'var(--aw-text-primary)' }}>{value}</div>
      {sub ? <div className="text-[9px] text-[var(--aw-text-muted)]">{sub}</div> : null}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-brain" style={{ color: 'var(--aw-primary)' }} />
        <span className="text-[14px]" style={{ fontWeight: 800 }}>مغزِ داین — بینشِ مدیر</span>
      </div>

      {/* فروشِ امروز */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="فروشِ امروز" value={faNum(t.revenue || 0) + ' ت'} sub={toFa(t.orders || 0) + ' سفارش'} color="#10B981" />
        <Stat label="میانگینِ فاکتور" value={faNum(t.avgTicket || 0) + ' ت'} />
        <Stat label="انعام" value={faNum(t.tips || 0) + ' ت'} />
        <Stat label="هزینهٔ نیرو" value={faNum(t.laborCost || 0) + ' ت'} sub={toFa(t.laborPct || 0) + '٪ فروش'} color="#F59E0B" />
      </div>

      {/* کارهای پیشنهادیِ امروز */}
      <div className="p-3 flex flex-col gap-2" style={CARD}>
        <div className="text-[12px]" style={{ fontWeight: 800 }}><i className="fa-solid fa-list-check ml-1" style={{ color: 'var(--aw-primary)' }} />کارهای پیشنهادیِ امروز</div>
        {actions.length ? actions.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]"><i className="fa-solid fa-circle text-[5px] mt-1.5" style={{ color: 'var(--aw-primary)' }} /><span style={{ lineHeight: 1.7 }}>{a}</span></div>
        )) : <div className="text-[11px] text-[var(--aw-text-muted)]">فعلاً همه‌چیز مرتب است ✅</div>}
      </div>

      {/* مهندسیِ منو */}
      <div className="p-3 flex flex-col gap-2" style={CARD}>
        <div className="text-[12px]" style={{ fontWeight: 800 }}><i className="fa-solid fa-utensils ml-1" style={{ color: 'var(--aw-primary)' }} />مهندسیِ منو</div>
        <div className="grid grid-cols-2 gap-2">
          {(['star', 'plowhorse', 'puzzle', 'dog'] as const).map((k) => {
            const c = ME_CLASS[k]; const list = (me as any)[k] || [];
            return (
              <div key={k} className="p-2 rounded-lg" style={{ background: c.color + '14', border: '1px solid ' + c.color + '33' }}>
                <div className="flex items-center gap-1.5 text-[11px]" style={{ fontWeight: 700, color: c.color }}><i className={c.icon} />{c.label} ({toFa(list.length)})</div>
                {list.length ? <div className="text-[10px] text-[var(--aw-text-secondary)] mt-1" style={{ lineHeight: 1.6 }}>{list.join('، ')}</div> : <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">—</div>}
              </div>
            );
          })}
        </div>
        <div className="text-[9px] text-[var(--aw-text-muted)]">دسته‌بندی بر پایهٔ «تعدادِ فروش × حاشیهٔ سود» (میانهٔ منو).</div>
      </div>

      {/* پرفروش‌ها + بهای تمام‌شده */}
      <div className="p-3 flex flex-col gap-2" style={CARD}>
        <div className="text-[12px]" style={{ fontWeight: 800 }}><i className="fa-solid fa-ranking-star ml-1" style={{ color: 'var(--aw-primary)' }} />پرفروش‌ها و بهای تمام‌شده</div>
        {(ins.menu || []).filter((m: any) => m.sold > 0).sort((a: any, b: any) => b.sold - a.sold).slice(0, 8).map((m: any) => (
          <div key={m.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-[var(--aw-border)]">
            <span className="flex-1 truncate" style={{ fontWeight: 600 }}>{m.name}</span>
            <span className="text-[var(--aw-text-muted)]">{toFa(m.sold)}× </span>
            {m.fcPct != null
              ? <span style={{ color: m.fcPct > 35 ? '#EF4444' : '#10B981', fontWeight: 700 }}>فودکاست {toFa(m.fcPct)}٪</span>
              : <span className="text-[var(--aw-text-muted)]">بدونِ رسپی</span>}
          </div>
        ))}
        {!(ins.menu || []).some((m: any) => m.sold > 0) && <div className="text-[11px] text-[var(--aw-text-muted)]">هنوز فروشی ثبت نشده</div>}
      </div>

      {/* پیش‌بینیِ فروشِ ۷ روزِ آینده */}
      {fc && fc.hasData && (
        <div className="p-3 flex flex-col gap-2" style={CARD}>
          <div className="text-[12px]" style={{ fontWeight: 800 }}><i className="fa-solid fa-chart-line ml-1" style={{ color: 'var(--aw-primary)' }} />پیش‌بینیِ فروشِ ۷ روزِ آینده</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">مجموعِ تخمینی: <b style={{ color: '#10B981' }}>{faNum(fc.next7Total || 0)} ت</b>{fc.peakHours && fc.peakHours.length ? ' · ساعتِ اوج: ' + fc.peakHours.map((h: number) => toFa(h) + ':۰۰').join('، ') : ''}</div>
          <div className="flex flex-col gap-1">
            {(fc.forecast || []).map((f: any, i: number) => {
              const mx = Math.max(1, ...((fc.forecast || []).map((x: any) => Number(x.predicted) || 0)));
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-14 text-[var(--aw-text-secondary)]">{f.day}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--aw-bg-input)' }}><div className="h-full rounded-full" style={{ width: ((Number(f.predicted) || 0) / mx * 100) + '%', background: 'var(--aw-primary)' }} /></div>
                  <span className="text-[10px] w-16 text-left" style={{ fontWeight: 700 }}>{faNum(f.predicted || 0)}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">بر پایهٔ میانگینِ فروشِ همان روزِ هفته در تاریخچهٔ شما.</div>
        </div>
      )}

      {/* پیشنهادِ داینامیکِ قیمت */}
      {pr && pr.count > 0 && (
        <div className="p-3 flex flex-col gap-2" style={CARD}>
          <div className="text-[12px]" style={{ fontWeight: 800 }}><i className="fa-solid fa-tags ml-1" style={{ color: 'var(--aw-primary)' }} />پیشنهادِ قیمت‌گذاری <span className="text-[9px] text-[var(--aw-text-muted)]">(هدفِ فودکاست {toFa(pr.targetPct)}٪)</span></div>
          {(pr.suggestions || []).slice(0, 8).map((s: any) => {
            const col = s.action === 'raise' ? '#10B981' : s.action === 'lower' ? '#3B82F6' : '#EF4444';
            return (
              <div key={s.id} className="flex items-start gap-2 py-1 border-b border-[var(--aw-border)]">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate" style={{ fontWeight: 600 }}>{s.name}</div>
                  <div className="text-[9px] text-[var(--aw-text-muted)]" style={{ lineHeight: 1.6 }}>{s.reason}</div>
                </div>
                <div className="text-left flex-shrink-0">
                  {s.action !== 'review'
                    ? <><div className="text-[11px]" style={{ fontWeight: 700, color: col }}>{faNum(s.price)} → {faNum(s.suggested)}</div><div className="text-[9px]" style={{ color: col }}>{s.deltaPct > 0 ? '+' : ''}{toFa(s.deltaPct)}٪</div></>
                    : <div className="text-[11px]" style={{ fontWeight: 700, color: col }}>بازبینی</div>}
                </div>
              </div>
            );
          })}
          <div className="text-[9px] text-[var(--aw-text-muted)]">پیشنهادها راهنمایند؛ قیمتِ نهایی را در تبِ «منو» ست کن.</div>
        </div>
      )}

      {/* نظرات و رضایتِ مشتری (احساسات) */}
      {rv && rv.count > 0 && (
        <div className="p-3 flex flex-col gap-2" style={CARD}>
          <div className="text-[12px]" style={{ fontWeight: 800 }}><i className="fa-solid fa-face-smile ml-1" style={{ color: 'var(--aw-primary)' }} />نظرات و رضایتِ مشتری</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><div className="text-[16px] text-[#F59E0B]" style={{ fontWeight: 800 }}>{toFa(rv.avg)}</div><div className="text-[9px] text-[var(--aw-text-muted)]">میانگین</div></div>
            <div><div className="text-[16px] text-[#10B981]" style={{ fontWeight: 800 }}>{toFa(rv.positive)}</div><div className="text-[9px] text-[var(--aw-text-muted)]">مثبت</div></div>
            <div><div className="text-[16px]" style={{ fontWeight: 800 }}>{toFa(rv.neutral)}</div><div className="text-[9px] text-[var(--aw-text-muted)]">خنثی</div></div>
            <div><div className="text-[16px] text-[#EF4444]" style={{ fontWeight: 800 }}>{toFa(rv.negative)}</div><div className="text-[9px] text-[var(--aw-text-muted)]">منفی</div></div>
          </div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">رضایتِ کلی: <b style={{ color: '#10B981' }}>{toFa(rv.satisfactionPct)}٪</b> از {toFa(rv.count)} نظر</div>
          {(rv.recent || []).slice(0, 4).map((r: any, i: number) => {
            const col = r.sentiment === 'positive' ? '#10B981' : r.sentiment === 'negative' ? '#EF4444' : '#6B7280';
            return (
              <div key={i} className="p-2 rounded-lg" style={{ background: 'var(--aw-bg-input)' }}>
                <div className="flex items-center justify-between"><span className="text-[10px]" style={{ fontWeight: 700 }}>{r.user} · <span style={{ color: '#F59E0B' }}>{toFa(r.rating)}★</span></span><span className="w-2 h-2 rounded-full" style={{ background: col }} /></div>
                {r.text ? <div className="text-[10px] text-[var(--aw-text-secondary)]" style={{ lineHeight: 1.6 }}>{r.text}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// رزرو (پذیرش/Host) — رزروِ میز per-user (collection: reservations). CRUD + وضعیت.
// ============================================================================
const RES_STATUS: Record<string, { label: string; color: string }> = {
  booked: { label: 'رزرو', color: '#3B82F6' }, seated: { label: 'نشست', color: '#10B981' },
  done: { label: 'تمام‌شده', color: '#6B7280' }, cancelled: { label: 'لغو', color: '#EF4444' }, noshow: { label: 'نیامد', color: '#F59E0B' },
};

function ResForm({ res, tables, onSave }: { res?: any; tables: any[]; onSave: (v: any) => void }) {
  const [f, setF] = useState<any>(() => ({ name: '', phone: '', date: '', time: '', guests: 2, tableId: '', status: 'booked', notes: '', ...(res || {}) }));
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <div className="flex flex-col gap-2.5" style={{ minWidth: 260 }}>
      <Field label="نامِ مهمان"><input style={INPUT} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="تاریخ"><input style={INPUT} value={f.date} onChange={(e) => set('date', e.target.value)} placeholder="۱۴۰۴/۰۵/۱۲" dir="ltr" /></Field>
        <Field label="ساعت"><input style={INPUT} value={f.time} onChange={(e) => set('time', e.target.value)} placeholder="۲۰:۳۰" dir="ltr" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="تعدادِ نفرات"><input style={INPUT} value={f.guests} onChange={(e) => set('guests', num(e.target.value))} inputMode="numeric" /></Field>
        <Field label="میز"><select style={INPUT} value={f.tableId} onChange={(e) => set('tableId', e.target.value)}><option value="">—</option>{tables.map((x) => <option key={x.id} value={x.id}>میز {x.label}</option>)}</select></Field>
      </div>
      <Field label="موبایل"><input style={INPUT} value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" dir="ltr" /></Field>
      <Field label="یادداشت"><input style={INPUT} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <button onClick={() => { if (!String(f.name).trim()) { return; } onSave(f); }} style={BTN}>ذخیره</button>
    </div>
  );
}

export function DineReservationsScreen() {
  const { showToast, openModal, closeModal } = useApp() as any;
  const [rows, setRows] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const load = async () => {
    try { const r: any = await api.myList('reservations'); setRows(Array.isArray(r) ? r : []); } catch (_e) {}
    try { const t: any = await api.myList('dine_tables'); setTables(Array.isArray(t) ? t : []); } catch (_e) {}
  };
  useEffect(() => { load(); }, []);
  const save = async (v: any) => {
    try { if (v.id) await api.myUpdate('reservations', String(v.id), v); else await api.myCreate('reservations', { ...v, id: 'rsv_' + Date.now(), status: v.status || 'booked', createdAt: new Date().toISOString() }); showToast('رزرو ذخیره شد ✅', 'success'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); }
  };
  const setStatus = async (r: any, status: string) => { try { await api.myUpdate('reservations', String(r.id), { status }); load(); } catch (_e) {} };
  const remove = async (id: any) => { try { await api.myRemove('reservations', String(id)); load(); } catch (_e) {} };
  const sorted = [...rows].sort((a, b) => String((a.date || '') + (a.time || '')).localeCompare(String((b.date || '') + (b.time || ''))));
  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-3 flex flex-col gap-3">
      <button onClick={() => openModal('رزروِ جدید', <ResForm tables={tables} onSave={save} />)} style={BTN}><i className="fa-solid fa-calendar-plus ml-1" />رزروِ جدید</button>
      <div className="flex flex-col gap-2">
        {sorted.map((r) => {
          const st = RES_STATUS[r.status] || RES_STATUS.booked;
          const tbl = tables.find((x) => String(x.id) === String(r.tableId));
          return (
            <div key={r.id} className="p-2.5 flex items-center gap-2" style={CARD}>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{r.name} <span className="text-[10px]" style={{ color: st.color, fontWeight: 700 }}>· {st.label}</span></div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{r.date} {r.time} · {toFa(r.guests || 0)} نفر{tbl ? ' · میز ' + tbl.label : ''}{r.phone ? ' · ' + r.phone : ''}</div>
              </div>
              {r.status === 'booked' && <button onClick={() => setStatus(r, 'seated')} className="px-2 py-1.5 rounded-lg border-none text-white text-[10px] cursor-pointer" style={{ background: '#10B981', fontWeight: 700 }}>نشاندن</button>}
              <button onClick={() => openModal('ویرایشِ رزرو', <ResForm res={r} tables={tables} onSave={save} />)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}><i className="fa-solid fa-pen text-[10px]" /></button>
              <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-danger)' }}><i className="fa-solid fa-trash text-[10px]" /></button>
            </div>
          );
        })}
        {rows.length === 0 && <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11px]">هنوز رزروی ثبت نشده</div>}
      </div>
    </div>
  );
}

// ============================================================================
// باشگاهِ مشتریان + برگرداندنِ مشتری (win-back) — از سفارش‌های واقعیِ شناسه‌دار (api.dineCustomers).
// تیر (طلایی/نقره‌ای/برنزی) بر پایهٔ خرید، امتیاز = خرید÷۱۰٬۰۰۰، ریزش = >۲۱ روز غیبت.
// ============================================================================
const TIER_INFO: Record<string, { label: string; color: string; icon: string }> = {
  gold: { label: 'طلایی', color: '#F59E0B', icon: 'fa-solid fa-crown' },
  silver: { label: 'نقره‌ای', color: '#94A3B8', icon: 'fa-solid fa-medal' },
  bronze: { label: 'برنزی', color: '#B45309', icon: 'fa-solid fa-award' },
};

export function DineLoyaltyScreen() {
  const { showToast } = useApp() as any;
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'all' | 'risk'>('all');
  const [sent, setSent] = useState<Record<string, boolean>>({});
  useEffect(() => { (async () => { try { const r: any = await api.dineCustomers(); setData(r || { customers: [], summary: {} }); } catch (_e) { setData({ customers: [], summary: {} }); } })(); }, []);
  const winback = async (c: any) => {
    try { await api.dineWinback(c.customerId); setSent((p) => ({ ...p, [c.customerId]: true })); showToast('دعوتِ بازگشت برای ' + c.name + ' ارسال شد ✅', 'success'); }
    catch (_e) { showToast('خطا در ارسالِ دعوت'); }
  };
  if (!data) return <div className="flex-1 flex items-center justify-center text-[var(--aw-text-muted)] text-[13px]">در حال بارگذاری…</div>;
  const sm = data.summary || {};
  const list = (data.customers || []).filter((c: any) => (tab === 'all' ? true : c.atRisk));
  const Stat = ({ label, value, color }: any) => (
    <div className="p-3 flex flex-col gap-0.5" style={CARD}><div className="text-[10px] text-[var(--aw-text-muted)]">{label}</div><div className="text-[15px]" style={{ fontWeight: 800, color: color || 'var(--aw-text-primary)' }}>{value}</div></div>
  );
  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2"><i className="fa-solid fa-users-line" style={{ color: 'var(--aw-primary)' }} /><span className="text-[14px]" style={{ fontWeight: 800 }}>باشگاهِ مشتریان</span></div>
      <div className="grid grid-cols-4 gap-2">
        <Stat label="کلِ مشتری" value={toFa(sm.total || 0)} />
        <Stat label="فعال" value={toFa(sm.active || 0)} color="#10B981" />
        <Stat label="در معرضِ ریزش" value={toFa(sm.atRisk || 0)} color="#EF4444" />
        <Stat label="طلایی" value={toFa(sm.gold || 0)} color="#F59E0B" />
      </div>
      <div className="flex gap-1.5">
        {([['all', 'همه'], ['risk', 'در معرضِ ریزش']] as [string, string][]).map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k as any)} className="px-3 py-1.5 rounded-full text-[11px] cursor-pointer border" style={tab === k ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}>{lbl}</button>
        ))}
      </div>
      {tab === 'risk' && list.length > 0 && <div className="text-[10px] text-[var(--aw-text-muted)]" style={{ lineHeight: 1.6 }}>این مشتری‌ها بیش از ۲۱ روز سفارش نداده‌اند — با یک پیشنهادِ ویژه دعوتِ بازگشتشان کن.</div>}
      <div className="flex flex-col gap-2">
        {list.map((c: any) => {
          const ti = TIER_INFO[c.tier] || TIER_INFO.bronze;
          return (
            <div key={c.customerId} className="p-2.5 flex items-center gap-2" style={CARD}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px]" style={{ background: ti.color, fontWeight: 800 }}>{String(c.name || '?').slice(0, 1)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{c.name} <span className="text-[9px]" style={{ color: ti.color, fontWeight: 700 }}><i className={ti.icon} /> {ti.label}</span></div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(c.orders)} سفارش · {faNum(c.totalSpent)} ت · {toFa(c.points)} امتیاز{c.daysSinceLast != null ? ' · ' + toFa(c.daysSinceLast) + ' روز پیش' : ''}</div>
              </div>
              {c.atRisk && (sent[c.customerId]
                ? <span className="px-2 py-1 rounded-lg text-[9px]" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700 }}>دعوت شد ✓</span>
                : <button onClick={() => winback(c)} className="px-2 py-1.5 rounded-lg border-none text-white text-[9px] cursor-pointer" style={{ background: '#EF4444', fontWeight: 700 }} title="دعوتِ بازگشت"><i className="fa-solid fa-paper-plane ml-1" />دعوت</button>)}
            </div>
          );
        })}
        {list.length === 0 && <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11px]">{tab === 'risk' ? 'مشتریِ در معرضِ ریزشی نیست ✅' : 'هنوز مشتریِ شناسه‌داری ثبت نشده'}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// بازاریابیِ هوشمند — تولیدِ محتوای شبکه‌های اجتماعی/پیشنهاد/پیامک/آگهی با LLM از دادهٔ واقعیِ رستوران.
// (سرور: POST /api/ai/dine-content — اگر LLM نبود، قالبِ واقعی از منو برمی‌گردد.)
// ============================================================================
export function DineMarketingScreen() {
  const { showToast } = useApp() as any;
  const [kind, setKind] = useState('social');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');
  const KINDS: [string, string, string][] = [
    ['social', 'پستِ شبکه اجتماعی', 'fa-brands fa-instagram'], ['promo', 'پیشنهادِ ویژه', 'fa-solid fa-tags'],
    ['sms', 'پیامکِ تبلیغاتی', 'fa-solid fa-comment-sms'], ['ad', 'آگهیِ تبلیغاتی', 'fa-solid fa-rectangle-ad'],
  ];
  const gen = async () => {
    setBusy(true); setOut('');
    try { const r: any = await api.dineContent(kind, topic); setOut((r && r.text) || ''); }
    catch (_e) { showToast('خطا در تولیدِ محتوا'); }
    finally { setBusy(false); }
  };
  const copy = () => { try { navigator.clipboard.writeText(out); showToast('کپی شد ✅', 'success'); } catch (_e) {} };
  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2"><i className="fa-solid fa-bullhorn" style={{ color: 'var(--aw-primary)' }} /><span className="text-[14px]" style={{ fontWeight: 800 }}>بازاریابیِ هوشمند</span></div>
      <div className="text-[11px] text-[var(--aw-text-muted)]" style={{ lineHeight: 1.7 }}>محتوا از اسمِ رستوران و پرفروش‌های واقعیِ منوی شما ساخته می‌شود.</div>
      <div className="grid grid-cols-2 gap-2">
        {KINDS.map(([k, lbl, ic]) => (
          <button key={k} onClick={() => setKind(k)} className="p-2.5 rounded-xl text-[12px] cursor-pointer border flex items-center gap-2" style={kind === k ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'transparent', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)' }}><i className={ic} />{lbl}</button>
        ))}
      </div>
      <input style={INPUT} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="موضوع/مناسبت (اختیاری) — مثلاً تخفیفِ آخرِ هفته" />
      <button onClick={() => !busy && gen()} disabled={busy} style={{ ...BTN, opacity: busy ? 0.6 : 1 }}><i className="fa-solid fa-wand-magic-sparkles ml-1" />{busy ? 'در حال تولید…' : 'تولیدِ محتوا'}</button>
      {out && (
        <div className="p-3 flex flex-col gap-2" style={CARD}>
          <div className="text-[12px]" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{out}</div>
          <button onClick={copy} className="self-start px-3 py-1.5 rounded-lg border cursor-pointer text-[11px]" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-primary)', fontWeight: 700 }}><i className="fa-solid fa-copy ml-1" />کپی</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// تحلیلِ رقبا — رقبا (نام + قیمتِ غذاهاشان) را صاحب وارد می‌کند؛ سرور با منوی خودش مقایسه می‌کند.
// collection: dine_competitors (per-user). موقعیتِ قیمتی از api.dineCompetitorsAnalysis.
// ============================================================================
const POS_INFO: Record<string, { label: string; color: string }> = {
  cheaper: { label: 'ارزان‌تر از بازار', color: '#10B981' },
  pricier: { label: 'گران‌تر از بازار', color: '#EF4444' },
  competitive: { label: 'رقابتی', color: '#3B82F6' },
};

function CompetitorForm({ comp, onSave }: { comp?: any; onSave: (v: any) => void }) {
  const [f, setF] = useState<any>(() => ({ name: '', note: '', items: [], ...(comp || {}) }));
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setItem = (i: number, k: string, v: any) => setF((p: any) => ({ ...p, items: (p.items || []).map((it: any, idx: number) => (idx === i ? { ...it, [k]: v } : it)) }));
  const addItem = () => setF((p: any) => ({ ...p, items: [...(p.items || []), { name: '', price: 0 }] }));
  const delItem = (i: number) => setF((p: any) => ({ ...p, items: (p.items || []).filter((_: any, idx: number) => idx !== i) }));
  return (
    <div className="flex flex-col gap-2.5" style={{ minWidth: 280 }}>
      <Field label="نامِ رقیب"><input style={INPUT} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <div className="text-[11px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>غذاهای رقیب (نامِ آن را دقیقاً مثلِ منوی خودت بنویس تا مقایسه شود)</div>
      {(f.items || []).map((it: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <input style={{ ...INPUT, flex: 2 }} value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} placeholder="نامِ غذا" />
          <input style={{ ...INPUT, flex: 1 }} value={it.price} onChange={(e) => setItem(i, 'price', num(e.target.value))} placeholder="قیمت" inputMode="numeric" />
          <button onClick={() => delItem(i)} className="w-8 h-8 rounded-lg border-none text-white cursor-pointer flex-shrink-0" style={{ background: 'var(--aw-danger)' }}><i className="fa-solid fa-trash text-[9px]" /></button>
        </div>
      ))}
      <button onClick={addItem} className="py-2 rounded-lg border cursor-pointer text-[11px]" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-primary)', fontWeight: 700 }}><i className="fa-solid fa-plus ml-1" />افزودنِ غذا</button>
      <button onClick={() => { if (!String(f.name).trim()) { return; } onSave(f); }} style={BTN}>ذخیره</button>
    </div>
  );
}

export function DineCompetitorsScreen() {
  const { showToast, openModal, closeModal } = useApp() as any;
  const [comps, setComps] = useState<any[]>([]);
  const [an, setAn] = useState<any>(null);
  const load = async () => {
    try { const c: any = await api.myList('dine_competitors'); setComps(Array.isArray(c) ? c : []); } catch (_e) {}
    try { const a: any = await api.dineCompetitorsAnalysis(); setAn(a); } catch (_e) {}
  };
  useEffect(() => { load(); }, []);
  const save = async (v: any) => { try { if (v.id) await api.myUpdate('dine_competitors', String(v.id), v); else await api.myCreate('dine_competitors', { ...v, id: 'cmp_' + Date.now() }); showToast('ذخیره شد ✅', 'success'); closeModal(); load(); } catch (_e) { showToast('خطا در ذخیره'); } };
  const remove = async (id: any) => { try { await api.myRemove('dine_competitors', String(id)); load(); } catch (_e) {} };
  const sm = (an && an.summary) || {};
  const cmp = (an && an.comparison) || [];
  return (
    <div className="flex-1 overflow-y-auto aw-scroll p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2"><i className="fa-solid fa-chart-simple" style={{ color: 'var(--aw-primary)' }} /><span className="text-[14px]" style={{ fontWeight: 800 }}>تحلیلِ رقبا</span></div>

      {cmp.length > 0 && (
        <div className="p-3 flex flex-col gap-2" style={CARD}>
          <div className="text-[12px]" style={{ fontWeight: 800 }}>مقایسهٔ قیمت با بازار</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(sm.matched || 0)} آیتمِ منطبق · {toFa(sm.cheaper || 0)} ارزان‌تر · {toFa(sm.competitive || 0)} رقابتی · {toFa(sm.pricier || 0)} گران‌تر</div>
          {cmp.slice(0, 10).map((c: any, i: number) => {
            const p = POS_INFO[c.position] || POS_INFO.competitive;
            return (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-[var(--aw-border)]">
                <span className="flex-1 truncate text-[11px]" style={{ fontWeight: 600 }}>{c.name}</span>
                <span className="text-[10px] text-[var(--aw-text-muted)]">شما {faNum(c.myPrice)} · بازار {faNum(c.avgRival)}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-lg text-white flex-shrink-0" style={{ background: p.color, fontWeight: 700 }}>{c.diffPct > 0 ? '+' : ''}{toFa(c.diffPct)}٪</span>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => openModal('رقیبِ جدید', <CompetitorForm onSave={save} />)} style={BTN}><i className="fa-solid fa-plus ml-1" />افزودنِ رقیب</button>
      <div className="flex flex-col gap-2">
        {comps.map((c) => (
          <div key={c.id} className="p-2.5 flex items-center gap-2" style={CARD}>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] truncate" style={{ fontWeight: 700 }}>{c.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa((c.items || []).length)} غذا ثبت‌شده</div>
            </div>
            <button onClick={() => openModal('ویرایشِ ' + c.name, <CompetitorForm comp={c} onSave={save} />)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)' }}><i className="fa-solid fa-pen text-[10px]" /></button>
            <button onClick={() => remove(c.id)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-danger)' }}><i className="fa-solid fa-trash text-[10px]" /></button>
          </div>
        ))}
        {comps.length === 0 && <div className="text-center py-8 text-[var(--aw-text-muted)] text-[11px]">رقیبی اضافه کن تا قیمت‌هایت با بازار مقایسه شود</div>}
      </div>
    </div>
  );
}

// فازهای بعد: یکپارچه‌سازیِ پیک/درگاه، تحلیلِ نظرات (sentiment)، برنامهٔ وفاداریِ خودکار.
