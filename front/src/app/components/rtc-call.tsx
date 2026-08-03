// تماسِ صوتی/تصویریِ کاربر-به-کاربر از طریقِ اینترنت (mediasoup SFU) — مدیا از سرورِ خودمان رله می‌شود،
// پس در ایران پایدار است و بینِ چند کاربر هم کار می‌کند. سیگنالینگ با socket.io روی مسیرِ /api/socket.io.
// این لایه یک‌بار در ریشهٔ اپ mount می‌شود؛ تماسِ ورودی را همه‌جا نشان می‌دهد و دکمهٔ تماس در گفتگو
// رویدادِ 'neura:peer-call' را dispatch می‌کند. به ایجنت‌ها هیچ کاری ندارد (تماسِ بینِ کاربران است).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { getToken } from '../services/api';

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
  const [remotes, setRemotes] = useState<RemoteTile[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [secs, setSecs] = useState(0);

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

  function startRing() {
    stopRing();
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beep = () => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 480; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.start(); o.stop(ctx.currentTime + 0.65);
      };
      beep(); ringRef.current = setInterval(beep, 2000);
      (ringRef as any)._ctx = ctx;
    } catch (_) {}
  }
  function stopRing() { if (ringRef.current) { clearInterval(ringRef.current); ringRef.current = null; } try { (ringRef as any)._ctx?.close(); } catch (_) {} }

  const resetAll = useCallback(() => {
    stopRing();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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

  // ── راه‌اندازیِ جلسهٔ مدیا پس از join ──
  async function setupMedia(roomName: string, callKind: Kind) {
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

    setPhase('connected');
    if (timerRef.current) clearInterval(timerRef.current);
    setSecs(0); timerRef.current = setInterval(() => setSecs((x) => x + 1), 1000);
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
  }, []);

  // ── شروعِ تماسِ خروجی (از دکمهٔ گفتگو) ──
  useEffect(() => {
    const onStart = async (e: any) => {
      const d = e?.detail || {}; const toSubs: string[] = (d.toSubs || []).map(String).filter((x: string) => x && x !== uidFromToken());
      if (!toSubs.length) return;
      if (phaseRef.current !== 'idle') return;
      const callKind: Kind = d.kind === 'video' ? 'video' : 'audio';
      const roomName = 'call_' + [uidFromToken(), ...toSubs].sort().join('_') + '_' + Date.now().toString(36);
      roomRef.current = roomName; toSubsRef.current = toSubs;
      setKind(callKind); setPeerName(d.peerName || 'کاربر'); setStatusMsg('در حال تماس...'); setPhase('outgoing');
      const s = ensureSocket();
      if (!s) { setStatusMsg('اتصال برقرار نشد'); setTimeout(resetAll, 1500); return; }
      if (!s.connected) await new Promise<void>((res) => { s.once('connect', () => res()); setTimeout(res, 4000); });
      try {
        await s.emitWithAck('callUser', { toSubs, roomName, kind: callKind, callerName: '' });
        await setupMedia(roomName, callKind);
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
    try { await setupMedia(inc.roomName, inc.kind); } catch (e: any) { setStatusMsg(callErrMsg(e)); setTimeout(resetAll, 2600); }
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

  useEffect(() => () => { try { socketRef.current?.disconnect(); } catch (_) {} if (timerRef.current) clearInterval(timerRef.current); stopRing(); }, []);

  if (phase === 'idle') return null;

  const fmt = (n: number) => { const m = Math.floor(n / 60), s = n % 60; const fa = (x: number) => String(x).padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]); return fa(m) + ':' + fa(s); };
  const videoRemotes = remotes.filter((r) => r.kind === 'video');
  const audioRemotes = remotes.filter((r) => r.kind === 'audio');

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'linear-gradient(160deg,#1a1530,#2a1f4d 60%,#0f0b1f)', color: '#fff', fontFamily: "'Kamand', sans-serif" }} dir="rtl">
      {/* هدر */}
      <div className="flex-shrink-0 pt-10 pb-4 text-center">
        <div className="text-[20px]" style={{ fontWeight: 700 }}>{peerName}</div>
        <div className="text-[13px] mt-1 opacity-80">
          {phase === 'outgoing' ? (statusMsg || 'در حال تماس...') : phase === 'incoming' ? (kind === 'video' ? 'تماس تصویری ورودی' : 'تماس صوتی ورودی') : (statusMsg || fmt(secs))}
        </div>
      </div>

      {/* بدنه: تصاویر یا آواتار */}
      <div className="flex-1 min-h-0 relative overflow-hidden px-3">
        {kind === 'video' && phase === 'connected' ? (
          <div className="w-full h-full grid gap-2" style={{ gridTemplateColumns: videoRemotes.length <= 1 ? '1fr' : '1fr 1fr', alignContent: 'center' }}>
            {videoRemotes.length === 0 && <div className="flex items-center justify-center h-full opacity-70 text-[14px]">در انتظارِ تصویرِ طرفِ مقابل…</div>}
            {videoRemotes.map((r) => (
              <div key={r.producerId} className="relative rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center" style={{ minHeight: 160 }}>
                <video autoPlay playsInline ref={(el) => { if (el && el.srcObject !== r.stream) el.srcObject = r.stream; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="absolute bottom-1 right-2 text-[11px] px-2 py-0.5 rounded-lg bg-black/40">{r.ownerName}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="rounded-full flex items-center justify-center" style={{ width: 120, height: 120, background: 'rgba(255,255,255,0.12)', fontSize: 46, fontWeight: 700 }}>
              {(peerName || '?').charAt(0)}
            </div>
            {phase === 'connected' && <div className="flex items-center gap-2 opacity-80 text-[13px]"><i className="fa-solid fa-phone-volume" /> تماسِ صوتی برقرار است</div>}
          </div>
        )}

        {/* پیش‌نمایشِ محلی (تصویری) */}
        {kind === 'video' && (phase === 'connected' || phase === 'outgoing') && (
          <div className="absolute bottom-3 left-3 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg" style={{ width: 96, height: 128, background: '#000' }}>
            <video autoPlay muted playsInline ref={localVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>
        )}

        {/* صداهای دریافتی (پنهان) */}
        {audioRemotes.map((r) => (
          <audio key={r.producerId} autoPlay ref={(el) => { if (el && el.srcObject !== r.stream) el.srcObject = r.stream; }} />
        ))}
      </div>

      {/* کنترل‌ها */}
      <div className="flex-shrink-0 pb-10 pt-4">
        {phase === 'incoming' ? (
          <div className="flex items-center justify-center gap-16">
            <button onClick={rejectIncoming} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
              <span className="rounded-full flex items-center justify-center" style={{ width: 66, height: 66, background: '#ef4444' }}><i className="fa-solid fa-phone-slash text-[22px]" /></span>
              <span className="text-[12px]">رد</span>
            </button>
            <button onClick={acceptIncoming} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
              <span className="rounded-full flex items-center justify-center" style={{ width: 66, height: 66, background: '#22c55e' }}><i className={`fa-solid ${kind === 'video' ? 'fa-video' : 'fa-phone'} text-[22px]`} /></span>
              <span className="text-[12px]">پاسخ</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-8">
            <button onClick={toggleMute} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
              <span className="rounded-full flex items-center justify-center" style={{ width: 56, height: 56, background: muted ? '#fff' : 'rgba(255,255,255,0.16)', color: muted ? '#1a1530' : '#fff' }}><i className={`fa-solid ${muted ? 'fa-microphone-slash' : 'fa-microphone'} text-[18px]`} /></span>
              <span className="text-[11px] opacity-80">{muted ? 'صدا خاموش' : 'صدا'}</span>
            </button>
            {kind === 'video' && (
              <button onClick={toggleCam} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
                <span className="rounded-full flex items-center justify-center" style={{ width: 56, height: 56, background: camOff ? '#fff' : 'rgba(255,255,255,0.16)', color: camOff ? '#1a1530' : '#fff' }}><i className={`fa-solid ${camOff ? 'fa-video-slash' : 'fa-video'} text-[18px]`} /></span>
                <span className="text-[11px] opacity-80">{camOff ? 'دوربین خاموش' : 'دوربین'}</span>
              </button>
            )}
            <button onClick={hangup} className="flex flex-col items-center gap-1.5 cursor-pointer border-none bg-transparent text-white">
              <span className="rounded-full flex items-center justify-center" style={{ width: 66, height: 66, background: '#ef4444' }}><i className="fa-solid fa-phone-slash text-[22px]" /></span>
              <span className="text-[11px] opacity-80">پایان</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
