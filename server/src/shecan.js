// ارسالِ HTTPS با resolve از طریق DNS شکن (برای سرویس‌های داخلیِ ایران مثل ippanel که
// روی این سرور به IP اشتباهِ CDN آروان resolve می‌شوند). وابستگیِ صفر — فقط ماژول‌های Node.
import https from 'node:https';
import dns from 'node:dns';
import { Resolver } from 'node:dns';

const SHECAN = ['178.22.122.100', '185.51.200.2'];
const resolver = new Resolver();
try { resolver.setServers(SHECAN); } catch { /* ignore */ }

const cache = new Map();
const TTL = 5 * 60 * 1000;

function resolveIp(hostname) {
  const c = cache.get(hostname);
  if (c && c.exp > Date.now()) return Promise.resolve(c.ip);
  return new Promise((resolve, reject) => {
    resolver.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs[0]) {
        cache.set(hostname, { ip: addrs[0], exp: Date.now() + TTL });
        return resolve(addrs[0]);
      }
      dns.lookup(hostname, { family: 4 }, (e, address) => {
        if (!e && address) { cache.set(hostname, { ip: address, exp: Date.now() + TTL }); resolve(address); }
        else reject(e || err || new Error('dns resolve failed: ' + hostname));
      });
    });
  });
}

// init: { method, headers, body(string|Buffer), timeout }  →  { status, headers, body(utf8), buffer(Buffer) }
// پاسخ به‌صورت Buffer جمع می‌شود (نه utf8) تا داده‌های باینری (مثلِ صوتِ TTS) سالم بمانند.
export async function shecanRequest(url, init = {}) {
  const u = new URL(url);
  const timeout = init.timeout ?? 20000;
  const ip = await resolveIp(u.hostname);
  // بدنه را به Buffer تبدیل کن و Content-Length بده (به‌جای chunked) تا آپلودِ بزرگ (مثلِ صوتِ STT) گیر نکند.
  const bodyBuf = init.body == null ? null : (Buffer.isBuffer(init.body) ? init.body : Buffer.from(String(init.body)));
  const headers = { ...(init.headers || {}), Host: u.hostname };
  if (bodyBuf) headers['Content-Length'] = bodyBuf.length;
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: ip,
      port: 443,
      path: u.pathname + u.search,
      method: init.method || 'GET',
      headers,
      servername: u.hostname,
      timeout,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => { chunks.push(c); });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ status: res.statusCode || 0, headers: res.headers, buffer, body: buffer.toString('utf8') });
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('request timeout')));
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}
