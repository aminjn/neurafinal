// فعال‌سازیِ Web Push: ثبتِ service worker، گرفتنِ اجازه، و subscribe نزدِ سرور.
// برای اینکه «هر کس اپ را نصب کرده همهٔ نوتیفیکیشن‌ها برایش برود»، بعد از ورود صدا زده می‌شود.
// نکته: اجازهٔ نوتیفیکیشن روی iOS فقط با تعاملِ کاربر داده می‌شود؛ پس اگر لازم شد، با اولین کلیک می‌گیریم.
import { api, getToken } from './api';
import { askNotificationOnce, permAsked, markPermAsked } from './permissions';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

let __subscribing = false;

async function subscribeNow(): Promise<boolean> {
  if (__subscribing) return false;
  __subscribing = true;
  try {
    const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
    await navigator.serviceWorker.ready;
    const { publicKey, enabled } = await api.pushVapid();
    if (!enabled || !publicKey) return false;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    }
    await api.pushSubscribe(sub.toJSON());
    return true;
  } catch (_) { return false; }
  finally { __subscribing = false; }
}

// اگر اجازه هنوز داده نشده، با اولین تعاملِ کاربر بگیر (الزامِ iOS/مرورگرها) و بعد subscribe کن.
function onFirstGesture(fn: () => void) {
  const h = () => { cleanup(); fn(); };
  const cleanup = () => { ['click', 'touchend', 'keydown'].forEach((e) => window.removeEventListener(e, h)); };
  ['click', 'touchend', 'keydown'].forEach((e) => window.addEventListener(e, h, { once: true } as any));
}

export async function initPush(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (!getToken()) return;
    if (Notification.permission === 'granted') { await subscribeNow(); return; }
    if (Notification.permission === 'denied') return;
    if (permAsked('notifications')) return; // یک‌بار پرسیده‌ایم، دیگر هر نشست نپرس
    // permission = default → با تعاملِ کاربر فقط یک‌بار بپرس (روی iOS اجباری است).
    onFirstGesture(async () => {
      markPermAsked('notifications');
      try {
        const p = await Notification.requestPermission();
        if (p === 'granted') await subscribeNow();
      } catch (_) {}
    });
  } catch (_) {}
}
