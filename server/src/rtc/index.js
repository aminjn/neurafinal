// تماسِ صوتی/تصویریِ چندنفرهٔ کاربر-به-کاربر با mediasoup (SFU) — مدیا از طریقِ سرورِ خودمان رله می‌شود
// (پایدار در ایران، بدونِ نیاز به STUN/TURN عمومی). سیگنالینگ با socket.io روی همان سرورِ HTTP.
// اگر mediasoup نصب/بیلد نشده باشد، initRtc بی‌صدا خطا می‌دهد و بقیهٔ اپ سالم می‌ماند (تماس غیرفعال).
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';
const ANNOUNCED_IP = process.env.MEDIASOUP_ANNOUNCED_IP || '';       // IP عمومیِ سرور (آروان) — الزامی برای تماسِ واقعی
const RTC_MIN = Number(process.env.MEDIASOUP_MIN_PORT || 40000);
const RTC_MAX = Number(process.env.MEDIASOUP_MAX_PORT || 40200);

const mediaCodecs = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000, parameters: { 'x-google-start-bitrate': 1000 } },
];

const webRtcTransportOptions = {
  listenInfos: [
    { protocol: 'udp', ip: '0.0.0.0', announcedAddress: ANNOUNCED_IP || '127.0.0.1' },
    { protocol: 'tcp', ip: '0.0.0.0', announcedAddress: ANNOUNCED_IP || '127.0.0.1' },
  ],
  enableUdp: true, enableTcp: true, preferUdp: true,
};

class Client {
  constructor(sub, name, socketId) { this.sub = sub; this.name = name; this.socketId = socketId; this.produceTransports = []; this.consumeTransports = []; this.producers = []; this.consumers = []; }
  close() { for (const t of [...this.produceTransports, ...this.consumeTransports]) { try { t.close(); } catch (_) {} } }
}

class Room {
  constructor(roomName, router) { this.roomName = roomName; this.router = router; this.clients = []; }
  addClient(c) { if (!this.clients.includes(c)) this.clients.push(c); }
  removeClient(socketId) { const c = this.clients.find((x) => x.socketId === socketId); if (c) { c.close(); this.clients = this.clients.filter((x) => x !== c); } return c; }
}

export async function initRtc(server) {
  const worker = await mediasoup.createWorker({ logLevel: 'warn', rtcMinPort: RTC_MIN, rtcMaxPort: RTC_MAX });
  worker.on('died', () => { console.error('[rtc] mediasoup worker died — restart needed'); });
  console.log('[rtc] mediasoup worker up (pid', worker.pid, ') announced=', ANNOUNCED_IP || '(local)', 'ports', RTC_MIN + '-' + RTC_MAX);

  const rooms = new Map();          // roomName -> Room
  const online = new Map();         // sub -> Set(socketId)  (برای دعوتِ تماس/حضور)
  const socketMeta = new Map();     // socketId -> { sub, name }

  const io = new Server(server, { path: '/api/socket.io', cors: { origin: true, credentials: true }, maxHttpBufferSize: 1e6 });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || '';
      const p = jwt.verify(token, SECRET);
      socket.data.sub = String(p.sub);
      socket.data.name = String(p.name || p.username || '');
      next();
    } catch (_) { next(new Error('unauthorized')); }
  });

  const getRoom = async (roomName) => {
    let room = rooms.get(roomName);
    if (!room) { const router = await worker.createRouter({ mediaCodecs }); room = new Room(roomName, router); rooms.set(roomName, room); }
    return room;
  };

  io.on('connection', (socket) => {
    const sub = socket.data.sub;
    if (!online.has(sub)) online.set(sub, new Set());
    online.get(sub).add(socket.id);
    socketMeta.set(socket.id, { sub, name: socket.data.name });

    // ── دعوتِ تماس (به یک یا چند کاربر) ──
    // callUser: به هر subِ مقصد که آنلاین است، «تماسِ ورودی» با roomName + نوع (audio/video) اطلاع بده.
    socket.on('callUser', ({ toSubs, roomName, kind, callerName }, ack) => {
      const targets = Array.isArray(toSubs) ? toSubs.map(String) : [];
      let delivered = 0;
      for (const t of targets) {
        const set = online.get(t);
        if (set) for (const sid of set) { io.to(sid).emit('incomingCall', { roomName, kind: kind || 'audio', fromSub: sub, callerName: callerName || socket.data.name || 'کاربر' }); delivered++; }
      }
      if (ack) ack({ ok: true, delivered });
    });
    socket.on('cancelCall', ({ toSubs, roomName }) => {
      for (const t of (Array.isArray(toSubs) ? toSubs.map(String) : [])) { const set = online.get(t); if (set) for (const sid of set) io.to(sid).emit('callCancelled', { roomName, fromSub: sub }); }
    });
    socket.on('rejectCall', ({ toSub, roomName }) => { const set = online.get(String(toSub)); if (set) for (const sid of set) io.to(sid).emit('callRejected', { roomName, fromSub: sub }); });

    // ── پیوستن به اتاق (شروعِ جلسهٔ مدیا) ──
    let joinedRoom = null;
    let client = null;
    socket.on('joinRoom', async ({ roomName }, cb) => {
      try {
        const room = await getRoom(String(roomName));
        client = new Client(sub, socket.data.name, socket.id);
        room.addClient(client);
        socket.join(room.roomName);
        joinedRoom = room;
        cb && cb({ state: 'Success', roomName: room.roomName, rtpCapabilities: room.router.rtpCapabilities });
      } catch (e) { cb && cb({ state: 'Error', message: String(e?.message || e) }); }
    });

    socket.on('getRtpCap', (cb) => { if (!joinedRoom) return cb && cb('Error'); cb && cb(joinedRoom.router.rtpCapabilities); });

    socket.on('requestTransport', async ({ kind }, ack) => {
      try {
        if (!joinedRoom) return ack('Error');
        const transport = await joinedRoom.router.createWebRtcTransport(webRtcTransportOptions);
        if (kind === 'Produce') client.produceTransports.push(transport); else client.consumeTransports.push(transport);
        ack({ id: transport.id, dtlsParameters: transport.dtlsParameters, iceCandidates: transport.iceCandidates, iceParameters: transport.iceParameters });
      } catch (e) { console.error('[rtc] requestTransport', e?.message); ack('Error'); }
    });

    socket.on('connectTransport', async ({ dtlsParameters, id, kind }, ack) => {
      const list = kind === 'Produce' ? client.produceTransports : client.consumeTransports;
      const transport = list.find((t) => t.id === id);
      if (!transport) return ack('Error');
      try { await transport.connect({ dtlsParameters }); ack('Success'); } catch (e) { console.error('[rtc] connectTransport', e?.message); ack('Error'); }
    });

    socket.on('startProducing', async ({ kind, rtpParameters, transportId }, ack) => {
      try {
        const transport = client.produceTransports.find((t) => t.id === transportId);
        if (!transport) return ack('Error');
        const producer = await transport.produce({ kind, rtpParameters });
        client.producers.push(producer);
        io.to(joinedRoom.roomName).emit('producerChange');
        ack(producer.id);
      } catch (e) { console.error('[rtc] startProducing', e?.message); ack('Error'); }
    });

    socket.on('getAvailableProducers', (ack) => {
      if (!joinedRoom) return ack([]);
      const producers = joinedRoom.clients.filter((c) => c !== client).reduce((acc, c) => [...acc, ...c.producers.map((p) => ({ producerId: p.id, kind: p.kind, ownerSub: c.sub, ownerName: c.name }))], []);
      ack(producers);
    });

    socket.on('initConsume', async ({ rtpCapabilities, producerId, transportId }, ack) => {
      try {
        const transport = client.consumeTransports.find((t) => t.id === transportId);
        if (!transport || !joinedRoom) return ack('Error');
        if (!joinedRoom.router.canConsume({ producerId, rtpCapabilities })) return ack('Cant');
        const consumer = await transport.consume({ producerId, paused: true, rtpCapabilities });
        client.consumers.push(consumer);
        ack({ id: consumer.id, kind: consumer.kind, rtpParameters: consumer.rtpParameters, producerId });
      } catch (e) { console.error('[rtc] initConsume', e?.message); ack('Error'); }
    });

    socket.on('resumeConsume', async ({ consumerId }, ack) => {
      const consumer = client && client.consumers.find((c) => c.id === consumerId);
      if (!consumer) return ack('Error');
      try { await consumer.resume(); ack('Success'); } catch (e) { ack('Error'); }
    });

    socket.on('leaveRoom', () => { cleanupRoom(); });

    const cleanupRoom = () => {
      if (joinedRoom) {
        joinedRoom.removeClient(socket.id);
        io.to(joinedRoom.roomName).emit('producerChange');
        io.to(joinedRoom.roomName).emit('peerLeft', { sub });
        if (joinedRoom.clients.length === 0) { try { joinedRoom.router.close(); } catch (_) {} rooms.delete(joinedRoom.roomName); }
        joinedRoom = null; client = null;
      }
    };

    socket.on('disconnect', () => {
      cleanupRoom();
      const set = online.get(sub); if (set) { set.delete(socket.id); if (set.size === 0) online.delete(sub); }
      socketMeta.delete(socket.id);
    });
  });

  // فهرستِ کاربرانِ واقعاً متصل (برای تشخیص + نشانگرِ آنلاینِ واقعی).
  const presence = () => Array.from(online, ([s, set]) => ({ sub: s, sockets: set.size }));
  return { io, presence, isOnline: (s) => online.has(String(s)) };
}
