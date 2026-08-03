// پراکسیِ داخلی: درخواست‌های /api/socket.io که به workerهای اپ (پورت 4000) می‌رسند را به پروسهٔ
// تک‌نمونهٔ تماس (mediasoup + socket.io روی 127.0.0.1:RTC_PORT) هدایت می‌کند. این‌طوری پیکربندیِ
// nginx دست‌نخورده می‌مانَد (همان /api کافی است) و سیگنالینگ حتی با long-polling هم کار می‌کند
// (اگر ISP وب‌سوکت را ببندد، socket.io خودش به polling برمی‌گردد و تماس باز هم برقرار می‌شود).
import http from 'node:http';

const RTC_PORT = Number(process.env.RTC_PORT || 4001);
const RTC_HOST = '127.0.0.1';

// درخواست‌های HTTP (long-polling و handshake) — باید پیش از body-parser سوار شود تا استریمِ بدنه مصرف نشود.
export function attachRtcHttpProxy(app) {
  app.use('/api/socket.io', (req, res) => {
    const opts = { host: RTC_HOST, port: RTC_PORT, method: req.method, path: req.originalUrl, headers: { ...req.headers, host: RTC_HOST + ':' + RTC_PORT } };
    const pr = http.request(opts, (pres) => { res.writeHead(pres.statusCode || 502, pres.headers); pres.pipe(res); });
    pr.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('rtc unavailable'); });
    req.pipe(pr);
  });
}

// ارتقای وب‌سوکت (transport=websocket) — روی httpServerِ اپ hook می‌شود.
export function attachRtcUpgradeProxy(server) {
  server.on('upgrade', (req, socket, head) => {
    if (!req.url || !req.url.startsWith('/api/socket.io')) return; // سایرِ ارتقاها را دست نزن
    const opts = { host: RTC_HOST, port: RTC_PORT, method: req.method || 'GET', path: req.url, headers: { ...req.headers, host: RTC_HOST + ':' + RTC_PORT } };
    const proxyReq = http.request(opts);
    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      const head2 = 'HTTP/1.1 101 ' + (proxyRes.statusMessage || 'Switching Protocols') + '\r\n' +
        Object.keys(proxyRes.headers).map((k) => {
          const v = proxyRes.headers[k];
          return Array.isArray(v) ? v.map((x) => k + ': ' + x).join('\r\n') : k + ': ' + v;
        }).join('\r\n') + '\r\n\r\n';
      try { socket.write(head2); } catch (_) {}
      if (proxyHead && proxyHead.length) { try { proxySocket.unshift(proxyHead); } catch (_) {} }
      proxySocket.pipe(socket); socket.pipe(proxySocket);
      proxySocket.on('error', () => { try { socket.destroy(); } catch (_) {} });
      socket.on('error', () => { try { proxySocket.destroy(); } catch (_) {} });
    });
    proxyReq.on('error', () => { try { socket.destroy(); } catch (_) {} });
    if (head && head.length) proxyReq.write(head);
    proxyReq.end();
  });
}
