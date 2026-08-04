// تماسِ صوتی/تصویریِ کاربر-به-کاربر از طریقِ اینترنت (mediasoup SFU) — مدیا از سرورِ خودمان رله می‌شود،
// پس در ایران پایدار است و بینِ چند کاربر هم کار می‌کند. سیگنالینگ با socket.io روی مسیرِ /api/socket.io.
// این لایه یک‌بار در ریشهٔ اپ mount می‌شود؛ تماسِ ورودی را همه‌جا نشان می‌دهد و دکمهٔ تماس در گفتگو
// رویدادِ 'neura:peer-call' را dispatch می‌کند. به ایجنت‌ها هیچ کاری ندارد (تماسِ بینِ کاربران است).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { getToken, api } from '../services/api';

function uidFromToken(): string {
  try {
    const t = localStorage.getItem('aw-token') || '';
    const p = t.split('.')[1]; if (!p) return '';
    const j = JSON.parse(decodeURIComponent(escape(atob(p.replace(/-/g, '+').replace(/_/g, '/')))));
    return String(j.sub || j.id || '');
  } catch (_) { return ''; }
}

type Kind = 'audio' | 'video';
type Phase = 'idle' | 'outgoing' | 'incoming' | 'connected';
type RemoteTile = { producerId: string; kind: 'audio' | 'video'; ownerSub: string; ownerName: string; stream: MediaStream };

// پیامِ خطای خوانا برای کاربر (به‌جای ماندن روی «در حال تماس…»).
function callErrMsg(e: any): string {
  const m = String(e?.message || e || '');
  if (m.startsWith('no-signal')) return 'اتصال به سرورِ تماس برقرار نشد';
  if (m.startsWith('no-media')) {
    if (/NotAllowed|Permission/i.test(m)) return 'دسترسی به میکروفون/دوربین رد شد';
    if (/NotFound|Devices/i.test(m)) return 'میکروفون/دوربین یافت نشد';
    return 'دسترسی به میکروفون/دوربین ممکن نشد';
  }
  return 'خطا در برقراری تماس';
}

// نوتیفیکیشنِ سیستمیِ تماسِ ورودی (صدا + لرزش) — مخصوصِ وقتی اپ در پس‌زمینه است تا گوشی خبر بدهد.
const CALL_NOTIF_TAG = 'neura-incoming-call';
function notifyIncomingCall(name: string, kind: Kind) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts: any = { body: kind === 'video' ? 'تماس تصویری ورودی…' : 'تماس صوتی ورودی…', tag: CALL_NOTIF_TAG, renotify: true, requireInteraction: true, vibrate: [400, 200, 400, 200, 400], icon: '/pwa-192.png', badge: '/pwa-192.png', dir: 'rtl', lang: 'fa', data: { url: '/' } };
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then((reg) => { if (reg) reg.showNotification(name, opts); else try { new Notification(name, opts); } catch (_) {} }).catch(() => { try { new Notification(name, opts); } catch (_) {} });
    else try { new Notification(name, opts); } catch (_) {}
  } catch (_) {}
}
function clearIncomingCallNotif() {
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then((reg) => { reg && reg.getNotifications({ tag: CALL_NOTIF_TAG }).then((ns) => ns.forEach((n) => n.close())).catch(() => {}); }).catch(() => {}); } catch (_) {}
}

// رویدادِ شروعِ تماس که از دکمهٔ گفتگو dispatch می‌شود.
export function startPeerCall(opts: { toSubs: string[]; peerName: string; kind: Kind }) {
  try { window.dispatchEvent(new CustomEvent('neura:peer-call', { detail: opts })); } catch (_) {}
}

export function NeuraCallLayer() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [kind, setKind] = useState<Kind>('audio');
  const [peerName, setPeerName] = useState('');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [remotes, setRemotes] = useState<RemoteTile[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [secs, setSecs] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addList, setAddList] = useState<{ sub: string; name: string }[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const producersRef = useRef<any[]>([]);
  const consumedRef = useRef<Set<string>>(new Set());
  const roomRef = useRef<string>('');
  const toSubsRef = useRef<string[]>([]);
  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const ringTimeoutRef = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const incomingRef = useRef<{ roomName: string; kind: Kind; fromSub: string; callerName: string } | null>(null);

  // ── سوکتِ سیگنالینگ: تا زمانِ ورود به سیستم متصل می‌ماند تا تماسِ ورودی همه‌جا دریافت شود ──
  const ensureSocket = useCallback((): Socket | null => {
    if (socketRef.current && socketRef.current.connected) return socketRef.current;
    const token = getToken();
    if (!token) return null;
    if (socketRef.current) { try { socketRef.current.disconnect(); } catch (_) {} }
    // polling اول → اگر ISP وب‌سوکت را ببندد، سیگنالینگ باز هم کار می‌کند و بعد در صورتِ امکان به ws ارتقا می‌یابد.
    const s = io(window.location.origin, { path: '/api/socket.io', transports: ['polling', 'websocket'], auth: { token }, reconnection: true });
    socketRef.current = s;

    s.on('incomingCall', (d: any) => {
      if (phaseRef.current !== 'idle') { // مشغول: رد کن
        try { s.emit('rejectCall', { toSub: d.fromSub, roomName: d.roomName }); } catch (_) {}
        return;
      }
      incomingRef.current = { roomName: String(d.roomName), kind: (d.kind === 'video' ? 'video' : 'audio'), fromSub: String(d.fromSub), callerName: String(d.callerName || 'کاربر') };
      setKind(incomingRef.current.kind); setPeerName(incomingRef.current.callerName);
      setPhase('incoming'); startRing();
      // اگر اپ در پس‌زمینه است، نوتیفیکیشنِ سیستمی با صدا/لرزش هم بزن تا گوشی خبر بدهد.
      try { if (document.visibilityState !== 'visible') notifyIncomingCall(incomingRef.current.callerName, incomingRef.current.kind); } catch (_) {}
    });
    s.on('callCancelled', () => { if (phaseRef.current === 'incoming') { stopRing(); resetAll(); } });
    s.on('callRejected', () => { if (phaseRef.current === 'outgoing') { setStatusMsg('تماس رد شد'); setTimeout(() => resetAll(), 1200); } });
    s.on('producerChange', () => { refreshConsumers(); });
    s.on('peerLeft', () => { refreshConsumers(); });
    s.on('disconnect', () => {});
    return s;
  }, []);

  const phaseRef = useRef<Phase>('idle');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // اتصالِ سوکت هنگامِ لاگین (برای دریافتِ تماسِ ورودی)
  useEffect(() => {
    if (getToken()) ensureSocket();
    const onStorage = () => { if (getToken()) ensureSocket(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // زنگِ کلاسیکِ تلفن: دو تنِ ۴۴۰+۴۸۰ هرتز، ۱٫۵ ثانیه روشن / ~۲٫۵ ثانیه خاموش، بلند و ممتد تا پاسخ/رد.
  function startRing() {
    stopRing();
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const ringOnce = () => {
        const t0 = ctx.currentTime;
        for (const f of [440, 480]) {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.04);
          g.gain.setValueAtTime(0.3, t0 + 1.4);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
          o.start(t0); o.stop(t0 + 1.55);
        }
      };
      ringOnce(); ringRef.current = setInterval(ringOnce, 4000);
      (ringRef as any)._ctx = ctx;
    } catch (_) {}
  }
  function stopRing() { if (ringRef.current) { clearInterval(ringRef.current); ringRef.current = null; } try { (ringRef as any)._ctx?.close(); } catch (_) {} clearIncomingCallNotif(); }

  const resetAll = useCallback(() => {
    stopRing();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    try { socketRef.current?.emit('leaveRoom'); } catch (_) {}
    for (const p of producersRef.current) { try { p.close(); } catch (_) {} }
    producersRef.current = [];
    try { sendTransportRef.current?.close(); } catch (_) {}
    try { recvTransportRef.current?.close(); } catch (_) {}
    sendTransportRef.current = null; recvTransportRef.current = null;
    if (localStreamRef.current) { for (const t of localStreamRef.current.getTracks()) { try { t.stop(); } catch (_) {} } localStreamRef.current = null; }
    deviceRef.current = null; consumedRef.current = new Set(); roomRef.current = '';
    incomingRef.current = null;
    setRemotes([]); setMuted(false); setCamOff(false); setStatusMsg(''); setSecs(0);
    setPhase('idle');
  }, []);

  // وصل‌شدنِ واقعی: زنگ را قطع کن، تایمر را از صفر شروع کن، وضعیت را پاک کن.
  const promoteConnected = useCallback(() => {
    stopRing();
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    setStatusMsg('');
    setPhase('connected');
    if (timerRef.current) clearInterval(timerRef.current);
    setSecs(0); timerRef.current = setInterval(() => setSecs((x) => x + 1), 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── راه‌اندازیِ جلسهٔ مدیا پس از join ──
  async function setupMedia(roomName: string, callKind: Kind, asCaller: boolean) {
    const s = ensureSocket();
    if (!s) throw new Error('no socket');
    // اطمینان از اتصالِ سوکت
    if (!s.connected) await new Promise<void>((res) => { s.once('connect', () => res()); setTimeout(res, 4000); });

    // اگر سوکت وصل نشد، خطای روشن بده (نه ماندن روی «در حال تماس…»).
    if (!s.connected) throw new Error('no-signal');

    const joinRes: any = await s.emitWithAck('joinRoom', { roomName }).catch(() => null);
    if (!joinRes || joinRes.state !== 'Success') throw new Error('no-signal');
    roomRef.current = roomName;

    const device = new Device();
    await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
    deviceRef.current = device;

    // مدیای محلی (دسترسیِ میکروفون/دوربین) — روی HTTP کار نمی‌کند و بدونِ اجازه رد می‌شود.
    const constraints: MediaStreamConstraints = callKind === 'video' ? { audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 } } } : { audio: true, video: false };
    let local: MediaStream;
    try { local = await navigator.mediaDevices.getUserMedia(constraints); }
    catch (e: any) { throw new Error('no-media:' + (e?.name || '')); }
    localStreamRef.current = local;
    if (localVideoRef.current && callKind === 'video') { localVideoRef.current.srcObject = local; }

    // ترانسپورتِ ارسال + تولیدِ track‌ها
    const sendParams: any = await s.emitWithAck('requestTransport', { kind: 'Produce' });
    const sendTransport = device.createSendTransport(sendParams);
    sendTransportRef.current = sendTransport;
    sendTransport.on('connect', async ({ dtlsParameters }: any, cb: any, eb: any) => {
      const r = await s.emitWithAck('connectTransport', { dtlsParameters, id: sendTransport.id, kind: 'Produce' });
      r === 'Success' ? cb() : eb(new Error('connect produce failed'));
    });
    sendTransport.on('produce', async ({ kind: pkind, rtpParameters }: any, cb: any, eb: any) => {
      const id = await s.emitWithAck('startProducing', { kind: pkind, rtpParameters, transportId: sendTransport.id });
      id === 'Error' ? eb(new Error('produce failed')) : cb({ id });
    });
    const audioTrack = local.getAudioTracks()[0];
    if (audioTrack) producersRef.current.push(await sendTransport.produce({ track: audioTrack }));
    if (callKind === 'video') { const vt = local.getVideoTracks()[0]; if (vt) producersRef.current.push(await sendTransport.produce({ track: vt })); }

    // ترانسپورتِ دریافت (یک‌بار، برای همهٔ producerها)
    const recvParams: any = await s.emitWithAck('requestTransport', { kind: 'Consume' });
    const recvTransport = device.createRecvTransport(recvParams);
    recvTransportRef.current = recvTransport;
    recvTransport.on('connect', async ({ dtlsParameters }: any, cb: any, eb: any) => {
      const r = await s.emitWithAck('connectTransport', { dtlsParameters, id: recvTransport.id, kind: 'Consume' });
      r === 'Success' ? cb() : eb(new Error('connect consume failed'));
    });

    // فقط «تماس‌گیرنده» باید در حالِ زنگ بماند تا طرفِ مقابل واقعاً بپیوندد؛ «گیرنده»‌ای که پاسخ داده فوراً وصل است.
    // (باگِ قبلی: تماس‌گیرنده بی‌درنگ «وصل» و ثانیه‌شمار روشن می‌شد حتی اگر طرف آفلاین بود.)
    if (asCaller) {
      setStatusMsg('در حال زنگ‌زدن'); startRing();
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        if (phaseRef.current === 'outgoing') { try { socketRef.current?.emit('cancelCall', { toSubs: toSubsRef.current, roomName: roomRef.current }); } catch (_) {} setStatusMsg('پاسخی داده نشد'); setTimeout(resetAll, 1600); }
      }, 45000);
    } else {
      promoteConnected();
    }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { refreshConsumers().catch(() => {}); }, 2500);
    await refreshConsumers();
  }

  const refreshConsumers = useCallback(async () => {
    const s = socketRef.current; const device = deviceRef.current; const recvTransport = recvTransportRef.current;
    if (!s || !device || !recvTransport) return;
    let list: any[] = [];
    try { list = await s.emitWithAck('getAvailableProducers'); } catch (_) { return; }
    if (!Array.isArray(list)) return;
    // حذفِ tileهایی که producerشان رفته
    const liveIds = new Set(list.map((p) => p.producerId));
    setRemotes((prev) => prev.filter((t) => liveIds.has(t.producerId)));
    for (const p of list) {
      if (consumedRef.current.has(p.producerId)) continue;
      consumedRef.current.add(p.producerId);
      try {
        const res: any = await s.emitWithAck('initConsume', { producerId: p.producerId, rtpCapabilities: device.rtpCapabilities, transportId: recvTransport.id });
        if (!res || res === 'Error' || res === 'Cant') { consumedRef.current.delete(p.producerId); continue; }
        const consumer = await recvTransport.consume({ id: res.id, producerId: p.producerId, kind: res.kind, rtpParameters: res.rtpParameters });
        const stream = new MediaStream([consumer.track]);
        await s.emitWithAck('resumeConsume', { consumerId: consumer.id });
        setRemotes((prev) => [...prev.filter((t) => t.producerId !== p.producerId), { producerId: p.producerId, kind: consumer.kind as any, ownerSub: String(p.ownerSub), ownerName: String(p.ownerName || 'کاربر'), stream }]);
      } catch (_) { consumedRef.current.delete(p.producerId); }
    }
    // تماس‌گیرنده: تا وقتی طرفِ مقابل واقعاً نپیوسته «در حال زنگ» بماند؛ با اولین producerِ طرف → وصل + تایمر.
    if (phaseRef.current === 'outgoing' && list.some((p) => String(p.ownerSub) !== uidFromToken())) promoteConnected();
  }, [promoteConnected]);

  // ── شروعِ تماسِ خروجی (از دکمهٔ گفتگو) ──
  useEffect(() => {
    const onStart = async (e: any) => {
      const d = e?.detail || {}; const toSubs: string[] = (d.toSubs || []).map(String).filter((x: string) => x && x !== uidFromToken());
      if (!toSubs.length) return;
      if (phaseRef.current !== 'idle') return;
      const callKind: Kind = d.kind === 'video' ? 'video' : 'audio';
      const roomName = 'call_' + [uidFromToken(), ...toSubs].sort().join('_') + '_' + Date.now().toString(36);
      roomRef.current = roomName; toSubsRef.current = toSubs;
      const _nm = (d.peerName && d.peerName !== 'undefined' && d.peerName !== 'null') ? String(d.peerName) : 'کاربر';
      setKind(callKind); setPeerName(_nm); setStatusMsg('در حال زنگ‌زدن'); setPhase('outgoing');
      const s = ensureSocket();
      if (!s) { setStatusMsg('اتصال برقرار نشد'); setTimeout(resetAll, 1500); return; }
      if (!s.connected) await new Promise<void>((res) => { s.once('connect', () => res()); setTimeout(res, 4000); });
      try {
        await s.emitWithAck('callUser', { toSubs, roomName, kind: callKind, callerName: '' });
        await setupMedia(roomName, callKind, true);
      } catch (err: any) { setStatusMsg(callErrMsg(err)); setTimeout(resetAll, 2600); }
    };
    window.addEventListener('neura:peer-call', onStart as any);
    return () => window.removeEventListener('neura:peer-call', onStart as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptIncoming = useCallback(async () => {
    const inc = incomingRef.current; if (!inc) return;
    stopRing();
    toSubsRef.current = [inc.fromSub];
    setStatusMsg('در حال اتصال...');
    try { await setupMedia(inc.roomName, inc.kind, false); } catch (e: any) { setStatusMsg(callErrMsg(e)); setTimeout(resetAll, 2600); }
  }, [resetAll]);

  const rejectIncoming = useCallback(() => {
    const inc = incomingRef.current; stopRing();
    if (inc) { try { socketRef.current?.emit('rejectCall', { toSub: inc.fromSub, roomName: inc.roomName }); } catch (_) {} }
    resetAll();
  }, [resetAll]);

  const hangup = useCallback(() => {
    if (phaseRef.current === 'outgoing') { try { socketRef.current?.emit('cancelCall', { toSubs: toSubsRef.current, roomName: roomRef.current }); } catch (_) {} }
    resetAll();
  }, [resetAll]);

  const toggleMute = useCallback(() => {
    const s = localStreamRef.current; if (!s) return;
    const on = !muted; setMuted(on);
    for (const t of s.getAudioTracks()) t.enabled = !on;
  }, [muted]);
  const toggleCam = useCallback(() => {
    const s = localStreamRef.current; if (!s) return;
    const off = !camOff; setCamOff(off);
    for (const t of s.getVideoTracks()) t.enabled = !off;
  }, [camOff]);
  const toggleSpeaker = useCallback(() => setSpeakerOn((v) => !v), []);

  // ── افزودنِ فرد در حینِ تماس (واقعی): مخاطبینِ نورا را نشان بده و به همان اتاق دعوت کن ──
  const loadAddList = useCallback(async () => {
    try {
      const r: any = await (api as any).contacts(); const list = (r?.contacts) || [];
      const phones = list.map((c: any) => c.phone).filter(Boolean);
      if (!phones.length) { setAddList([]); return; }
      const rr: any = await (api as any).peerResolve(phones);
      const nameByPhone: any = {}; list.forEach((c: any) => { if (c.phone) nameByPhone[String(c.phone).replace(/\D/g, '').slice(-10)] = c.name; });
      const inRoom = new Set([uidFromToken(), ...toSubsRef.current.map(String), ...remotes.map((x) => x.ownerSub)]);
      setAddList((rr?.users || []).map((u: any) => ({ sub: String(u.sub), name: nameByPhone[String(u.phone).replace(/\D/g, '').slice(-10)] || u.name || u.phone })).filter((u: any) => !inRoom.has(u.sub)));
    } catch (_) { setAddList([]); }
  }, [remotes]);
  const addToCall = useCallback((sub: string, _name: string) => {
    try { socketRef.current?.emit('callUser', { toSubs: [sub], roomName: roomRef.current, kind, callerName: '' }); } catch (_) {}
    toSubsRef.current = [...new Set([...toSubsRef.current, sub])];
    setAddOpen(false);
  }, [kind]);

  // بلندگو + پخشِ مطمئنِ صدای دریافتی: هر بار که استریمِ جدید می‌آید یا بلندگو عوض می‌شود،
  // صدا را پخش کن (autoplay گاهی بلاک می‌شود) و بلندی/خروجی را تنظیم کن. روی موبایل، مرورگر
  // مسیرِ بلندگو/گوشی را کنترل می‌کند؛ این‌جا بلندی و در صورتِ پشتیبانی setSinkId اعمال می‌شود.
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const els = root.querySelectorAll('audio,video') as any;
    for (const el of els) {
      if (el.muted) continue; // ویدیوی «خودم» muted است، دست نزن
      el.volume = speakerOn ? 1 : 0.32;
      try { el.play?.().catch(() => {}); } catch (_) {}
      if (typeof el.setSinkId === 'function') { el.setSinkId('').catch(() => {}); }
    }
  }, [speakerOn, remotes, phase]);

  useEffect(() => () => { try { socketRef.current?.disconnect(); } catch (_) {} if (timerRef.current) clearInterval(timerRef.current); stopRing(); }, []);

  if (phase === 'idle') return null;

  const fmt = (n: number) => { const m = Math.floor(n / 60), s = n % 60; const fa = (x: number) => String(x).padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]); return fa(m) + ':' + fa(s); };
  const videoRemotes = remotes.filter((r) => r.kind === 'video');
  const audioRemotes = remotes.filter((r) => r.kind === 'audio');

  const fullBleed = kind === 'video' && phase === 'connected' && videoRemotes.length === 1;
  const ringing = phase === 'outgoing' || (phase === 'connected' && !!statusMsg);
  const statusText = phase === 'outgoing' ? (statusMsg || 'در حال زنگ‌زدن') : phase === 'incoming' ? (kind === 'video' ? 'تماسِ تصویریِ ورودی' : 'تماسِ صوتیِ ورودی') : (statusMsg || fmt(secs));
  const partCount = Math.max(toSubsRef.current.length, remotes.length);
  const isGroupCall = partCount > 1;
  const partNames = Array.from(new Set(remotes.map((r) => r.ownerName).filter((n) => n && n !== 'کاربر')));
  const displayName = (peerName && peerName !== 'undefined' && peerName !== 'null') ? peerName : 'کاربر';
  const ctrlBtn = (onClick: () => void, icon: string, label: string, active?: boolean, danger?: boolean, size = 56) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
      <span className="rounded-full flex items-center justify-center transition-all" style={{ width: size, height: size, background: danger ? '#ef4444' : active ? '#fff' : 'rgba(255,255,255,0.16)', color: danger ? '#fff' : active ? '#1a1530' : '#fff', backdropFilter: 'blur(8px)' }}><i className={`fa-solid ${icon} text-[18px]`} /></span>
      <span className="text-[11px] opacity-80">{label}</span>
    </button>
  );
  return (
    <div ref={rootRef} className="fixed inset-0 z-[200] flex flex-col overflow-hidden" style={{ background: 'radial-gradient(120% 90% at 50% -10%, #3a2a66 0%, #1a1530 45%, #0d0a1c 100%)', color: '#fff', fontFamily: "'Kamand', sans-serif" }} dir="rtl">
      <style>{`@keyframes nrdot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}`}</style>

      {/* بک‌گراندِ ویدیوی تمام‌صفحه وقتی فقط یک نفر تصویر دارد (مثلِ لیدرها) */}
      {fullBleed && (
        <video autoPlay playsInline ref={(el) => { if (el && el.srcObject !== videoRemotes[0].stream) el.srcObject = videoRemotes[0].stream; }} className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover' }} />
      )}
      {fullBleed && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 22%, transparent 62%, rgba(0,0,0,0.55) 100%)' }} />}

      {/* هدر */}
      <div className="flex-shrink-0 pt-10 pb-3 text-center relative z-[2]">
        <div className="text-[21px]" style={{ fontWeight: 800, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{displayName}{isGroupCall ? ' — تماسِ گروهی' : ''}</div>
        <div className="text-[13px] mt-1 opacity-90 flex items-center justify-center gap-1.5">
          {phase === 'connected' && !statusMsg && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />}
          <span dir="ltr">{statusText}</span>
          {ringing && <span className="inline-flex gap-0.5">{[0, 1, 2].map((i) => <span key={i} className="w-1 h-1 rounded-full bg-white" style={{ animation: 'nrdot 1.2s infinite', animationDelay: i * 0.18 + 's' }} />)}</span>}
        </div>
        {isGroupCall && <div className="text-[11px] opacity-70 mt-0.5 px-6 truncate">{String(partCount + 1).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])} نفر{partNames.length ? ' · ' + partNames.join('، ') : ''}</div>}
      </div>

      {/* بدنه */}
      <div className="flex-1 min-h-0 relative overflow-hidden px-3 z-[1]">
        {kind === 'video' && phase === 'connected' && !fullBleed ? (
          <div className="w-full h-full grid gap-2 content-center" style={{ gridTemplateColumns: videoRemotes.length <= 1 ? '1fr' : videoRemotes.length <= 4 ? '1fr 1fr' : '1fr 1fr 1fr' }}>
            {videoRemotes.length === 0 && <div className="flex flex-col items-center justify-center h-full gap-3 opacity-70"><i className="fa-solid fa-video text-[34px]" /><span className="text-[13px]">در انتظارِ تصویرِ طرفِ مقابل…</span></div>}
            {videoRemotes.map((r) => (
              <div key={r.producerId} className="relative rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: 150, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <video autoPlay playsInline ref={(el) => { if (el && el.srcObject !== r.stream) el.srcObject = r.stream; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="absolute bottom-1.5 right-2 text-[11px] px-2 py-0.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>{r.ownerName}</div>
              </div>
            ))}
          </div>
        ) : !fullBleed && (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div className="relative flex items-center justify-center">
              {ringing && <><span className="absolute rounded-full animate-ping" style={{ width: 150, height: 150, background: 'rgba(123,98,252,0.25)' }} /><span className="absolute rounded-full" style={{ width: 172, height: 172, border: '1px solid rgba(255,255,255,0.12)' }} /></>}
              <div className="rounded-full flex items-center justify-center relative" style={{ width: 128, height: 128, background: 'linear-gradient(145deg,#7b62fc,#5c4abd)', fontSize: 48, fontWeight: 800, boxShadow: '0 12px 40px rgba(123,98,252,0.45)' }}>
                {(peerName || '?').charAt(0)}
              </div>
            </div>
            {phase === 'connected' && <div className="flex items-center gap-2 opacity-90 text-[13px] px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}><i className="fa-solid fa-phone-volume" style={{ color: '#22c55e' }} /> تماسِ صوتی برقرار است</div>}
          </div>
        )}

        {/* پیش‌نمایشِ محلی */}
        {kind === 'video' && (phase === 'connected' || phase === 'outgoing') && (
          <div className="absolute bottom-3 left-3 rounded-2xl overflow-hidden shadow-2xl" style={{ width: 100, height: 138, background: '#000', border: '2px solid rgba(255,255,255,0.25)' }}>
            <video autoPlay muted playsInline ref={(el) => { localVideoRef.current = el; if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) el.srcObject = localStreamRef.current; }} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {camOff && <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-[11px]"><i className="fa-solid fa-video-slash" /></div>}
          </div>
        )}

        {audioRemotes.map((r) => (
          <audio key={r.producerId} autoPlay playsInline ref={(el) => { if (el && el.srcObject !== r.stream) { el.srcObject = r.stream; el.volume = speakerOn ? 1 : 0.32; el.play?.().catch(() => {}); } }} />
        ))}
      </div>

      {/* کنترل‌ها — نوارِ شیشه‌ای */}
      <div className="flex-shrink-0 pb-9 pt-4 relative z-[2]">
        {phase === 'incoming' ? (
          <div className="flex items-center justify-center gap-16">
            <button onClick={rejectIncoming} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
              <span className="rounded-full flex items-center justify-center animate-pulse" style={{ width: 68, height: 68, background: '#ef4444' }}><i className="fa-solid fa-phone-slash text-[24px]" /></span>
              <span className="text-[12px]">رد</span>
            </button>
            <button onClick={acceptIncoming} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
              <span className="rounded-full flex items-center justify-center animate-pulse" style={{ width: 68, height: 68, background: '#22c55e' }}><i className={`fa-solid ${kind === 'video' ? 'fa-video' : 'fa-phone'} text-[24px]`} /></span>
              <span className="text-[12px]">پاسخ</span>
            </button>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center gap-5 px-5 py-3 rounded-[28px] w-fit" style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid rgba(255,255,255,0.14)' }}>
            {ctrlBtn(toggleMute, muted ? 'fa-microphone-slash' : 'fa-microphone', muted ? 'بی‌صدا' : 'صدا', muted)}
            {kind === 'video' && ctrlBtn(toggleCam, camOff ? 'fa-video-slash' : 'fa-video', camOff ? 'خاموش' : 'دوربین', camOff)}
            {ctrlBtn(toggleSpeaker, speakerOn ? 'fa-volume-high' : 'fa-volume-low', speakerOn ? 'بلندگو' : 'آرام', !speakerOn)}
            {phase === 'connected' && ctrlBtn(() => { setAddOpen(true); loadAddList(); }, 'fa-user-plus', 'افزودن')}
            {ctrlBtn(hangup, 'fa-phone-slash', 'پایان', false, true, 62)}
          </div>
        )}
      </div>

      {/* افزودنِ فرد در حینِ تماس */}
      {addOpen && (
        <div className="absolute inset-0 z-[210] flex items-end" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setAddOpen(false)}>
          <div className="w-full rounded-t-[22px] p-4 max-h-[62%] overflow-y-auto" style={{ background: '#1a1530', border: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div className="text-[14px] mb-2" style={{ fontWeight: 700 }}>افزودن به تماس</div>
            {addList.length === 0 ? <div className="text-[12px] opacity-70 py-6 text-center">مخاطبِ نورایی برای افزودن نیست</div> :
              addList.map((u) => (
                <div key={u.sub} onClick={() => addToCall(u.sub, u.name)} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/5">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg,#7b62fc,#5c4abd)', fontWeight: 700 }}>{(u.name || '?').charAt(0)}</span>
                  <span className="flex-1 text-[13px]">{u.name}</span>
                  <i className="fa-solid fa-phone-flip text-[#22c55e]" />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
