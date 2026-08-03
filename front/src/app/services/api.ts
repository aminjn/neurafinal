// کلاینت API برای بک‌اند Neura
// در پروduction، Nginx مسیر /api را به سرور Node پراکسی می‌کند، پس BASE نسبی است.

const BASE = (import.meta as any).env?.VITE_API_BASE || '/api';
const TOKEN_KEY = 'aw-token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as any) };
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText);
  // livesync: پس از هر تغییرِ داده (POST/PUT/DELETE — به‌جز احراز/سلامت)، یک رویدادِ سراسری بفرست تا
  // کلِ اپ داده‌های مرکزی را همان لحظه از سرور تازه کند (بدون بستن/باز کردنِ اپ).
  try {
    const __m = String((opts.method || 'GET')).toUpperCase();
    if (__m !== 'GET' && typeof window !== 'undefined' && path.indexOf('/auth/') !== 0 && path.indexOf('/health') !== 0) {
      window.dispatchEvent(new Event('neura:data-changed'));
    }
  } catch (_e) { /* noop */ }
  return data as T;
}

export interface AuthUser {
  id: string | number;
  username: string;
  name?: string;
  email?: string;
  role: 'user' | 'admin' | 'superadmin';
  company?: string;
}

export const api = {
  health: () => req('/health'),

  // Auth
  login: (username: string, password: string, otp?: string) =>
    req<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, ...(otp ? { otp } : {}) }),
    }),
  register: (username: string, password: string, name?: string, email?: string) =>
    req<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email }),
    }),
  me: () => req<{ user: AuthUser }>('/auth/me'),

  // امنیت — تغییرِ رمز، گزارشِ امنیتی، و احرازِ دومرحله‌ای (TOTP) — همه واقعی و سمتِ سرور
  changePassword: (oldPassword: string, newPassword: string) =>
    req<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
  securityLog: <T = any>() => {
    if (!getToken()) return Promise.resolve([] as T[]);
    return req<T[]>('/auth/security-log');
  },
  twofaSetup: () => req<{ secret: string; otpauth: string }>('/auth/2fa/setup', { method: 'POST' }),
  twofaEnable: (code: string, method?: string) =>
    req<{ ok: boolean; enabled: boolean; method: string; recoveryCodes: string[] }>('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code, method }) }),
  twofaDisable: (password: string) =>
    req<{ ok: boolean; enabled: boolean }>('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),

  // فروشگاه (غذا/مارکت) — کاتالوگِ سمتِ سرور + ثبتِ سفارشِ اتمیک با کسرِ کیف‌پول
  shopCatalog: <T = any>(name: string) => {
    if (!getToken()) return Promise.resolve([] as T[]);
    return req<T[]>(`/shop/catalog/${encodeURIComponent(name)}`);
  },
  myOrders: <T = any>() => {
    if (!getToken()) return Promise.resolve([] as T[]);
    return req<T[]>('/shop/orders');
  },
  placeOrder: (kind: 'dine' | 'market', items: any[], total: number, meta?: Record<string, any>) =>
    req<{ ok: boolean; order: any; balance: number }>('/shop/order', { method: 'POST', body: JSON.stringify({ kind, items, total, meta }) }),

  // کیفِ‌پول و خریدها — سمتِ سرور و اتمیک (موجودی/مالکیت جعل‌ناپذیر)
  getWallet: () => req<{ balance: number; tx: any[]; cashback: number; subscription: any; ownedAgents: string[]; ownedAvatars: string[]; ownedThemes: string[] }>('/wallet'),
  analytics: (company?: string) => {
    if (!getToken()) return Promise.resolve(null as any);
    return req<{ monthlyRevenue: any[]; weeklyActivity: any[] }>(`/analytics/summary${company ? `?company=${encodeURIComponent(company)}` : ''}`);
  },
  walletDeposit: (amount: number) => req<any>('/wallet/deposit', { method: 'POST', body: JSON.stringify({ amount }) }),
  walletWithdraw: (amount: number) => req<any>('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
  walletPurchase: (kind: 'agent' | 'avatar' | 'theme', id: string, price: number, title?: string) =>
    req<any>('/wallet/purchase', { method: 'POST', body: JSON.stringify({ kind, id, price, title }) }),
  // اشتراک/پلن — خریدِ واقعی با کسرِ کیف‌پول و تاریخِ انقضا
  walletSubscribe: (plan: string, price: number, opts?: { planId?: string; months?: number }) =>
    req<any>('/wallet/subscribe', { method: 'POST', body: JSON.stringify({ plan, price, ...(opts || {}) }) }),
  walletCancelSub: () => req<any>('/wallet/subscribe/cancel', { method: 'POST' }),
  updateMe: (patch: { name?: string; email?: string; phone?: string; address?: string; prefs?: Record<string, any> }) =>
    req<{ ok: boolean }>('/auth/me', { method: 'PUT', body: JSON.stringify(patch) }),

  // احرازِ هویتِ رسمی با شاهکار (تطبیقِ موبایل↔کدملی + استعلامِ ثبت‌احوال) — قبل از OTPِ ثبت‌نام.
  // ناهمگام: POST فوراً jobId می‌دهد (تماس‌های پاد چند ثانیه‌اند و CDN اتصالِ طولانی را می‌بندد)،
  // بعد با pollِ سبک نتیجه گرفته می‌شود. خطاهای اعتبارسنجی همان لحظه از POST پرتاب می‌شوند.
  shahkarVerify: async (phone: string, nationalCode: string, jBirthDate: string) => {
    const start: any = await req('/auth/shahkar/verify', { method: 'POST', body: JSON.stringify({ phone, nationalCode, jBirthDate }) });
    if (!start || !start.jobId) return start as { ok: boolean; name?: string; otpSent?: boolean };
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, i < 10 ? 500 : 1000));
      let p: any = null;
      try { p = await req(`/auth/shahkar/poll?id=${encodeURIComponent(start.jobId)}&_=${Date.now()}`); } catch { /* pollِ بعدی */ }
      if (p && p.done) {
        const r = p.result || {};
        if (r.ok) return r as { ok: boolean; name?: string; otpSent?: boolean };
        throw new ApiError(400, r.error || 'shahkar_failed');
      }
    }
    throw new ApiError(408, 'timeout');
  },

  // ورود با OTP پیامکی
  otpRequest: (phone: string) =>
    req<{ ok: boolean }>('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) }),
  otpVerify: (phone: string, code: string) =>
    req<{ token: string; user: AuthUser }>('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  googleLogin: (credential: string) =>
    req<{ token: string; user: AuthUser }>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),

  // Settings
  getSettings: <T = any>() => req<T>('/settings'),
  putSettings: <T = any>(patch: Partial<T>) =>
    req<T>('/settings', { method: 'PUT', body: JSON.stringify(patch) }),

  // فهرست عمومی ایجنت‌ها (بدون نیاز به ورود) — برای نمایش در فرانت
  // cache-bust: /ai/agents وگرنه مرورگر 304 (نسخهٔ کش‌شدهٔ قدیمی بدونِ prefsِ تازه) برمی‌گرداند و
  // تغییراتِ ذخیره‌شدهٔ دستیار «اعمال نمی‌شود». هر بار URL یکتا = پاسخِ تازه با overlayِ به‌روز.
  agents: <T = any>() => req<T[]>('/ai/agents?_=' + Date.now()),

  // خرید/فعال‌سازی ایجنت برای کاربرِ واردشده
  buyAgent: (id: string) => req<{ ok: boolean; ownedAgents: string[] }>(`/auth/owned-agents/${encodeURIComponent(id)}`, { method: 'POST' }),
  removeOwnedAgent: (id: string) => req<{ ok: boolean; ownedAgents: string[] }>(`/auth/owned-agents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // جستجوی کاربرِ ثبت‌نام‌شده و تأییدشده با شاهکار برای افزودنِ پرسنل (نامِ واقعی برمی‌گردد)
  lookupUserByPhone: (phone: string) => req<{ found: boolean; name?: string; phone?: string; verified?: boolean }>(`/users/lookup?phone=${encodeURIComponent(phone)}`),
  // بازارِ چندفروشگاهی: فروشگاه‌های فعال (با ≥۱ محصولِ موجود) + محصولاتِ یک فروشگاه
  marketShops: () => req<any[]>(`/shop/market?_=${Date.now()}`),
  marketShopProducts: (userId: string | number) => req<any[]>(`/shop/market/${encodeURIComponent(String(userId))}/products?_=${Date.now()}`),
  marketAllProducts: () => req<any[]>(`/shop/market/products?_=${Date.now()}`),
  sellerSales: () => req<any[]>(`/shop/sales?_=${Date.now()}`),
  // داین: رستوران‌های منتشرشده + منوی هر رستوران + رمزگشاییِ QRِ میز
  dineVenues: () => req<any[]>(`/shop/dine/venues?_=${Date.now()}`),
  dineVenueMenu: (userId: string | number) => req<any>(`/shop/dine/venues/${encodeURIComponent(String(userId))}/menu?_=${Date.now()}`),
  dineTable: (token: string) => req<any>(`/shop/dine/table/${encodeURIComponent(token)}`),
  dineOrderStatus: (venueId: string | number, ticketId: string) =>
    req<any>(`/shop/dine/order/${encodeURIComponent(String(venueId))}/${encodeURIComponent(String(ticketId))}/status?_=${Date.now()}`),
  // درآمدزاییِ داین: اشتراکِ ماهانه (خرید/وضعیت) + درآمدِ پلتفرم (ادمین)
  dineSubscribe: (months: number) =>
    req<{ ok: boolean; balance: number; expiresAt: string; months: number; price: number }>('/shop/dine/subscribe', { method: 'POST', body: JSON.stringify({ months }) }),
  dineSubscription: () => req<any>(`/shop/dine/subscription?_=${Date.now()}`),
  dineRevenue: () => req<any>(`/shop/dine/revenue?_=${Date.now()}`),
  dineInsights: () => req<any>(`/shop/dine/insights?_=${Date.now()}`),
  dineCustomers: () => req<any>(`/shop/dine/customers?_=${Date.now()}`),
  dineForecast: () => req<any>(`/shop/dine/forecast?_=${Date.now()}`),
  dinePricing: () => req<any>(`/shop/dine/pricing?_=${Date.now()}`),
  dineCompetitorsAnalysis: () => req<any>(`/shop/dine/competitors?_=${Date.now()}`),
  dineReviews: () => req<any>(`/shop/dine/reviews?_=${Date.now()}`),
  dineVenueReviews: (userId: string | number) => req<any[]>(`/shop/dine/venues/${encodeURIComponent(String(userId))}/reviews?_=${Date.now()}`),
  dineSubmitReview: (venueId: string | number, rating: number, text: string) =>
    req<{ ok: boolean }>('/shop/dine/review', { method: 'POST', body: JSON.stringify({ venueId, rating, text }) }),
  dineWinback: (customerId: string | number, message?: string) =>
    req<{ ok: boolean; notified: boolean }>('/shop/dine/winback', { method: 'POST', body: JSON.stringify({ customerId, message }) }),
  dineContent: (kind: string, topic?: string, tone?: string) =>
    req<{ ok: boolean; text: string; fallback?: boolean }>('/ai/dine-content', { method: 'POST', body: JSON.stringify({ kind, topic, tone }) }),
  // نقشه/ژئوکدینگ (کلید سمتِ سرور است؛ کلاینت فقط پروکسی را صدا می‌زند)
  mapStatus: () => req<{ configured: boolean; hasKey: boolean; tiles?: boolean }>(`/map/status`),
  mapAutocomplete: (q: string, lat?: number, lng?: number) =>
    req<any>(`/map/autocomplete?q=${encodeURIComponent(q)}${lat != null ? `&lat=${lat}` : ''}${lng != null ? `&lng=${lng}` : ''}`),
  mapGeocode: (address: string) => req<any>(`/map/geocode?address=${encodeURIComponent(address)}`),
  mapReverse: (lat: number, lng: number) => req<any>(`/map/reverse?lat=${lat}&lng=${lng}`),

  // Document collections (agents, customers, ...)
  // قبل از ورود توکنی نیست؛ برای اینکه صفحهٔ landing ۴۰۱ نزند، خالی برگردان تا بعد از لاگین.
  list: <T = any>(collection: string, company?: string) => {
    if (!getToken()) return Promise.resolve([] as T[]);
    return req<T[]>(`/data/${collection}${company ? `?company=${encodeURIComponent(company)}` : ''}`);
  },
  create: <T = any>(collection: string, data: Partial<T>) =>
    req<T>(`/data/${collection}`, { method: 'POST', body: JSON.stringify(data) }),
  update: <T = any>(collection: string, id: string, patch: Partial<T>) =>
    req<T>(`/data/${collection}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (collection: string, id: string) =>
    req(`/data/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // جایگزینیِ کاملِ یک مجموعه برای یک شرکت — برای صفحه‌هایی که کلِ آرایه را همگام می‌کنند
  bulkSave: <T = any>(collection: string, items: T[], company?: string) =>
    req<{ ok: boolean; count: number }>(`/data/${collection}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ items, company }),
    }),

  // انبارِ داده‌ی per-user (وظایف/تقویم/... خودِ کاربر — بدونِ نیاز به نقشِ admin)
  myList: <T = any>(collection: string) => {
    if (!getToken()) return Promise.resolve([] as T[]);
    return req<T[]>(`/me/data/${collection}`);
  },
  myCreate: <T = any>(collection: string, data: Partial<T>) =>
    req<T>(`/me/data/${collection}`, { method: 'POST', body: JSON.stringify(data) }),
  myUpdate: <T = any>(collection: string, id: string, patch: Partial<T>) =>
    req<T>(`/me/data/${collection}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(patch) }),
  myRemove: (collection: string, id: string) =>
    req(`/me/data/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  myBulkSave: <T = any>(collection: string, items: T[]) => {
    if (!getToken()) return Promise.resolve({ ok: false, count: 0 });
    return req<{ ok: boolean; count: number }>(`/me/data/${collection}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  // Users (admin/superadmin)
  listUsers: (params: { q?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const s = qs.toString();
    return req<{ items: AuthUser[]; total: number; limit: number; offset: number }>(`/users${s ? `?${s}` : ''}`);
  },
  createUser: (u: Partial<AuthUser> & { password: string }) =>
    req<AuthUser>('/users', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (id: string | number, patch: Partial<AuthUser> & { password?: string }) =>
    req<AuthUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteUser: (id: string | number) => req(`/users/${id}`, { method: 'DELETE' }),
  // یادآورهای زمان‌بندی‌شده (پیامکِ سرور سرِ موعد — حتی با اپِ بسته)
  reminderCreate: (title: string, dueAt: number, phone?: string) =>
    req<{ ok: boolean; reminder: any }>(`/reminders`, { method: 'POST', body: JSON.stringify({ title, dueAt, phone }) }),
  reminderList: () => req<{ reminders: any[] }>(`/reminders?_=${Date.now()}`),
  reminderRemove: (id: string) => req(`/reminders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // ایجنت‌های یک کاربر (سوپرادمین): فهرست/ویرایشِ شخصی‌سازی/حذف
  userAgents: (id: string | number) => req<{ agents: any[] }>(`/users/${id}/agents`),
  updateUserAgent: (id: string | number, agentId: string, patch: Record<string, any>) =>
    req(`/users/${id}/agents/${encodeURIComponent(agentId)}`, { method: 'PUT', body: JSON.stringify(patch) }),
  removeUserAgent: (id: string | number, agentId: string) =>
    req(`/users/${id}/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' }),
  setUserAgent: (id: string | number, agentId: string, patch: { active?: boolean; expiresAt?: string | null }) =>
    req(`/users/${id}/agents/${encodeURIComponent(agentId)}/set`, { method: 'POST', body: JSON.stringify(patch) }),

  // AI chat — ناهمگام: POST فوراً jobId می‌دهد، بعد با pollِ آنی نتیجه گرفته می‌شود.
  // (مسیرِ CDNِ ایران↔فرانسه اتصالی که چند ثانیه باز بماند را throttle می‌کند → ۵۰۴.)
  chat: async (agentId: string | null, messages: { role: string; content: string }[], opts?: { welcome?: boolean }) => {
    // مسیرِ تازه (send/poll) برای دور زدنِ کشِ مسمومِ احتمالیِ CDN روی /chat
    const start: any = await req(`/ai/send`, { method: 'POST', body: JSON.stringify({ agentId, messages, ...(opts || {}) }) });
    // سازگاریِ عقب‌رو: اگر بک‌اند قدیمی مستقیم پاسخ داد
    if (!start || !start.jobId) return start as { ok: boolean; text?: string; fallback?: boolean };
    for (let i = 0; i < 80; i++) {
      // pollِ سریع (۴۰۰ms) برای کاهشِ تأخیرِ پاسخ، بعد کمی کندتر
      await new Promise((r) => setTimeout(r, i < 12 ? 400 : 900));
      try {
        const p: any = await req(`/ai/poll?id=${encodeURIComponent(start.jobId)}&_=${Date.now()}`);
        if (p && p.done) return p.result as { ok: boolean; text?: string; fallback?: boolean };
      } catch { /* poll بعدی */ }
    }
    return { ok: false, fallback: true } as { ok: boolean; text?: string; fallback?: boolean };
  },

  // گزارش‌های تماس که آماده‌اند در چت نشان داده شوند (poll)
  callReports: () => req<{ reports: { id: string; text: string; agentId: string; ts: number }[] }>(`/ai/call-reports?_=${Date.now()}`),

  // ردیاب: ثبتِ بازدیدِ کاربر از ایجنت/صفحه → ممکن است آفرِ درجا برگرداند
  track: (target: string, kind: 'agent' | 'screen' = 'agent') =>
    req<{ ok: boolean; offers: { id: string; message: string; discount: number | null; agentId: string | null; cta: string }[] }>(`/ai/track`, { method: 'POST', body: JSON.stringify({ target, kind }) }),
  // مصرفِ توکنِ کاربر (شمارشِ همهٔ چت‌ها)
  usage: () => req<{ used: number; balance: number; byAgent: Record<string, number> }>(`/ai/usage?_=${Date.now()}`),

  // پرونده‌های گفتگو (واقعی) + گفتگوی جاری
  chatSessions: (agentId: string) =>
    req<{ draft: { count: number }; sessions: { id: number; title: string; date: string; count: number }[] }>(`/ai/sessions?agentId=${encodeURIComponent(agentId)}&_=${Date.now()}`),
  chatSession: (agentId: string, id: number | string) =>
    req<{ messages: { role: string; content: string }[] }>(`/ai/session?agentId=${encodeURIComponent(agentId)}&id=${encodeURIComponent(String(id))}&_=${Date.now()}`),
  saveSession: (agentId: string, title?: string) =>
    req<{ ok: boolean }>(`/ai/session/save`, { method: 'POST', body: JSON.stringify({ agentId, title }) }),
  newSession: (agentId: string) =>
    req<{ ok: boolean }>(`/ai/session/new`, { method: 'POST', body: JSON.stringify({ agentId }) }),
  renameSession: (agentId: string, id: number | string, title: string) =>
    req<{ ok: boolean }>(`/ai/session/rename`, { method: 'POST', body: JSON.stringify({ agentId, id, title }) }),
  // مخاطبین (وارد شده از گوشی) — برای تماس‌گرفتن با نام
  contacts: () => req<{ contacts: { name: string; phone: string }[] }>(`/ai/contacts?_=${Date.now()}`),
  saveContacts: (contacts: { name: string; phone: string }[]) =>
    req<{ ok: boolean; total: number; added: number }>(`/ai/contacts`, { method: 'POST', body: JSON.stringify({ contacts }) }),
  deleteContact: (phone: string) =>
    req<{ ok: boolean }>(`/ai/contacts/delete`, { method: 'POST', body: JSON.stringify({ phone }) }),
  // پیام‌رسانیِ کاربر-به-کاربرِ نورا
  peerResolve: (phones: string[]) =>
    req<{ users: { sub: string; name: string; phone: string }[] }>(`/peer/resolve`, { method: 'POST', body: JSON.stringify({ phones }) }),
  peerSend: (to: string, text: string) =>
    req<{ ok: boolean; message: any }>(`/peer/send`, { method: 'POST', body: JSON.stringify({ to, text }) }),
  peerWith: (sub: string) =>
    req<{ messages: { from: string; to: string; text: string; ts: number }[] }>(`/peer/with?sub=${encodeURIComponent(sub)}&_=${Date.now()}`),
  discardDraft: (agentId: string) =>
    req<{ ok: boolean }>(`/ai/session/discard`, { method: 'POST', body: JSON.stringify({ agentId }) }),

  // شخصی‌سازی ایجنت توسط کاربر — روی سند ایجنت ذخیره می‌شود و چت از آن استفاده می‌کند
  updateAgent: (id: string, patch: Record<string, any>) =>
    req<{ ok: boolean; agent?: any }>(`/ai/agent/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
  // تنظیماتِ شخصیِ کاربر برای یک ایجنت (per-user؛ نام/لحن/صدا/… — نه مدل/دستورالعمل)
  agentPrefs: (agentId: string) =>
    req<{ prefs: Record<string, any> }>(`/ai/agent-prefs?agentId=${encodeURIComponent(agentId)}&_=${Date.now()}`),
  saveAgentPrefs: (agentId: string, patch: Record<string, any>) =>
    req<{ ok: boolean }>(`/ai/agent-prefs`, { method: 'PUT', body: JSON.stringify({ agentId, ...patch }) }),

  // گفتار به متن
  stt: (agentId: string | null, audioBase64: string, mime?: string) =>
    req<{ ok: boolean; text?: string }>(`/ai/stt`, { method: 'POST', body: JSON.stringify({ agentId, audioBase64, mime }) }),
  // متن به گفتار — فرمتِ mp3 (سبک‌تر و سریع‌تر از wav روی مسیرِ ایران)؛ voice اختیاری برای پیش‌نمایش
  tts: (agentId: string | null, text: string, voice?: string) =>
    req<{ ok: boolean; audioBase64?: string; mime?: string }>(`/ai/tts`, { method: 'POST', body: JSON.stringify({ agentId, text, format: 'mp3', ...(voice ? { voice } : {}) }) }),
  // تولید تصویر (با مدل تصویرِ خود ایجنت)
  image: (agentId: string | null, prompt: string) =>
    req<{ ok: boolean; url?: string | null }>(`/ai/agent-image`, { method: 'POST', body: JSON.stringify({ agentId, prompt }) }),
};
