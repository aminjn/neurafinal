// TOTP واقعی (RFC 6238) و کدهای بازیابی — بدونِ وابستگیِ خارجی، فقط با node:crypto.
// برای احرازِ هویتِ دومرحله‌ایِ اختیاریِ کاربر استفاده می‌شود.
import crypto from 'crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// تولیدِ رازِ base32 (پیش‌فرض ۲۰ بایت = ۱۶۰ بیت)
export function generateSecret(bytes = 20) {
  const buf = crypto.randomBytes(bytes);
  let out = '';
  for (const b of buf) out += B32[b & 31] + B32[(b >> 3) & 31];
  return out.slice(0, 32);
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bits -= 8; out.push((value >> bits) & 0xff); }
  }
  return Buffer.from(out);
}

// کدِ TOTP برای یک بازهٔ زمانی (counter). الگوریتم HMAC-SHA1، ۶ رقم، پنجرهٔ ۳۰ ثانیه.
function hotp(secretBuf, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

// بررسیِ کدِ کاربر با پنجرهٔ ±۱ (تحملِ اختلافِ ساعت). now بر حسبِ میلی‌ثانیه.
export function verifyTotp(secret, token, now = Date.now(), window = 1) {
  const t = String(token || '').replace(/\D/g, '');
  if (t.length !== 6) return false;
  const secretBuf = base32Decode(secret);
  if (!secretBuf.length) return false;
  const counter = Math.floor(now / 1000 / 30);
  for (let w = -window; w <= window; w++) {
    // مقایسهٔ ثابت‌زمان برای جلوگیری از timing attack
    const cand = hotp(secretBuf, counter + w);
    if (cand.length === t.length && crypto.timingSafeEqual(Buffer.from(cand), Buffer.from(t))) return true;
  }
  return false;
}

// تولیدِ کدِ فعلی برای یک راز (برای تست/اپِ سمتِ خودِ سرور)
export function generateToken(secret, now = Date.now()) {
  const counter = Math.floor(now / 1000 / 30);
  return hotp(base32Decode(secret), counter);
}

// otpauth URI برای QR/اپِ Authenticator
export function otpauthUri(secret, label, issuer = 'Neura') {
  const l = encodeURIComponent(`${issuer}:${label}`);
  return `otpauth://totp/${l}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// کدهای بازیابیِ یک‌بارمصرف (در صورت گم‌شدنِ اپِ Authenticator)
export function generateRecoveryCodes(n = 8) {
  const codes = [];
  for (let i = 0; i < n; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // ۱۰ کاراکتر
    codes.push(raw.slice(0, 5) + '-' + raw.slice(5));
  }
  return codes;
}
