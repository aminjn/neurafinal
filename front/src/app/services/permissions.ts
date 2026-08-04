// دسترسی‌ها فقط «یک‌بار» از کاربر پرسیده شوند (روی همان دستگاه به‌خاطر سپرده می‌شود).
// خودِ مرورگر granted/denied را نگه می‌دارد؛ ما حالتِ «default/prompt» را هم با فلگِ لوکال قفل می‌کنیم
// تا اگر کاربر یک‌بار بستن/نادیده گرفت، هر بار دوباره نپرسیم. (محدودیت: سافاریِ iOS دسترسیِ دوربین/میکروفونِ
// وبِ نصب‌نشده را بینِ نشست‌ها نگه نمی‌دارد — این محدودیتِ اپل است، نه اپ.)
const LS = (k: string) => 'neura_perm_' + k;

export function permAsked(k: string): boolean { try { return localStorage.getItem(LS(k)) === '1'; } catch (_) { return false; } }
export function markPermAsked(k: string): void { try { localStorage.setItem(LS(k), '1'); } catch (_) {} }

async function queryState(name: any): Promise<string> {
  try { const s = await (navigator as any).permissions?.query({ name }); return (s && s.state) || 'prompt'; } catch (_) { return 'prompt'; }
}

// نوتیفیکیشن را فقط یک‌بار در کلِ عمرِ دستگاه بپرس.
export async function askNotificationOnce(): Promise<string> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (Notification.permission !== 'default') return Notification.permission; // مرورگر خودش یادش هست
    if (permAsked('notifications')) return 'default';                          // یک‌بار پرسیده‌ایم، دیگر نه
    markPermAsked('notifications');
    return await Notification.requestPermission();
  } catch (_) { return 'default'; }
}

// لوکیشن را فقط یک‌بار بپرس؛ اگر قبلاً رد/نادیده شد، به‌جای پرسیدنِ دوباره fallback بده.
export async function geolocateOnce(
  onOk: (pos: GeolocationPosition) => void,
  onErr?: () => void,
  opts?: PositionOptions,
): Promise<void> {
  try {
    if (!('geolocation' in navigator)) { onErr && onErr(); return; }
    const st = await queryState('geolocation');
    if (st === 'denied') { onErr && onErr(); return; }
    if (st !== 'granted' && permAsked('geolocation')) { onErr && onErr(); return; } // یک‌بار پرسیدیم
    markPermAsked('geolocation');
    navigator.geolocation.getCurrentPosition(onOk, () => onErr && onErr(), opts);
  } catch (_) { onErr && onErr(); }
}
