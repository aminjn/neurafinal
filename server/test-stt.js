// تست STT: یک فایل WAV کوتاه می‌سازد و به endpoint محلی /api/ai/stt می‌فرستد
// تا پاسخ واقعی whisper (از مسیر بک‌اند + پروکسی) دیده شود.
// اجرا روی سرور:  node /opt/neura-ui/server/test-stt.js
function makeWav(seconds = 0.5, rate = 16000) {
  const n = Math.floor(seconds * rate);
  const dataLen = n * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40);
  // یک تُن ملایم تا whisper «خیلی کوتاه/خالی» ردش نکند
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(3000 * Math.sin(i / 8)), 44 + i * 2);
  return buf;
}

const PORT = process.env.PORT || 4000;
const b64 = makeWav().toString('base64');

const r = await fetch(`http://127.0.0.1:${PORT}/api/ai/stt`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentId: 'secretary', audioBase64: b64, mime: 'audio/wav' }),
});
console.log('HTTP', r.status);
console.log(await r.text());
