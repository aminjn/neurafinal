"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { squircleMask } from './letter-avatar';

// ── Session-level microphone singleton ──────────────────────────────
// The mic is requested ONCE per page session and kept alive. Every avatar
// instance (re-mounted on each navigation / agent switch) reuses this same
// stream instead of calling getUserMedia again — otherwise the browser
// re-prompts for permission on every mount. The stream is never stopped on
// unmount; it lives until the tab is closed.
let __neuraMicStream = null;
let __neuraMicPromise = null;
function __micLive() {
  return __neuraMicStream && __neuraMicStream.getTracks().some(t => t.readyState === 'live');
}
async function getSharedMic() {
  if (__micLive()) return __neuraMicStream;
  if (__neuraMicPromise) return __neuraMicPromise;
  __neuraMicPromise = navigator.mediaDevices.getUserMedia({ audio: true })
    .then(s => { __neuraMicStream = s; __neuraMicPromise = null; return s; })
    .catch(e => { __neuraMicPromise = null; __neuraMicStream = null; throw e; });
  return __neuraMicPromise;
}
// آزادسازیِ میکروفون وقتی اپ به پس‌زمینه می‌رود (رفعِ «mic روی اندروید بعدِ خروج درگیر می‌ماند»).
function __releaseSharedMic() {
  try { if (__neuraMicStream) { __neuraMicStream.getTracks().forEach((t) => t.stop()); } } catch (e) {}
  __neuraMicStream = null; __neuraMicPromise = null;
  try { document.dispatchEvent(new CustomEvent('neura-mic-released')); } catch (e) {}
}
if (typeof document !== 'undefined' && !(window).__neuraMicVisBound) {
  (window).__neuraMicVisBound = true;
  document.addEventListener('visibilitychange', () => { if (document.hidden) __releaseSharedMic(); });
  window.addEventListener('pagehide', __releaseSharedMic);
}

// Neon Spectrum — exact port of the attached design: flowing concentric dotted
// rings whose angle maps to a frequency bin, so the ring reacts per-frequency to
// the microphone. Transparent canvas, portrait centered, drag to resize/activate,
// mic auto-enabled on drag-down / tap. Reaction kept gentle.
const SPEED = 2.2;
const INTENSITY = 2.3;
const AUDIO_GAIN = 1.5;       // per-frequency swing strength
const SPEED_BOOST = 0.6;      // tempo lift with loudness
const BINS = 96;

// Convert a hex color to its HSL hue (0–360), for tinting the spectrum per agent.
function hexHue(hex) {
  const hsl = hexHsl(hex);
  return hsl ? hsl.h : null;
}

// Convert a hex color to full HSL {h(0–360), s(0–100), l(0–100)} so the spectrum
// can borrow the theme's actual saturation & lightness (matches muted themes,
// not just neon-bright bands).
function hexHsl(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some(v => Number.isNaN(v))) return null;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const L = (mx + mn) / 2;
  let hue = 0, S = 0;
  if (d !== 0) {
    S = d / (1 - Math.abs(2 * L - 1));
    if (mx === r) hue = ((g - b) / d) % 6;
    else if (mx === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = Math.round(hue * 60); if (hue < 0) hue += 360;
  }
  return { h: hue, s: Math.round(S * 100), l: Math.round(L * 100) };
}

export function EuAvatar({ palette, accent, name, portrait, cornerSlot, onSwipeLeft, onSwipeRight, onLongPress, onChatClick, onHire, demo, swipeCount, swipeIndex, fixed, display, hideName, speaking, nameOptions, activeNameId, onPickName, onAddName }: { palette?: 'purple' | 'cyan'; accent?: string | null; name?: string; portrait?: string; fixed?: boolean; display?: boolean; hideName?: boolean; speaking?: boolean; demo?: boolean; cornerSlot?: any; onSwipeLeft?: () => void; onSwipeRight?: () => void; onLongPress?: () => void; onChatClick?: () => void; onHire?: () => void; swipeCount?: number; swipeIndex?: number; nameOptions?: { id: string; name: string }[]; activeNameId?: string; onPickName?: (id: string) => void; onAddName?: () => void } = {}) {
  const portraitSrc = portrait || '/src/assets/avatar-portrait.png';
  const assistantName = name || (typeof localStorage !== 'undefined' && localStorage.getItem('aw-eu-assistant-name')) || 'لادن لرستانی';
  const [nameMenuOpen, setNameMenuOpen] = useState(false);
  const nameTrigRef = useRef<HTMLButtonElement>(null);
  const [nameMenuPos, setNameMenuPos] = useState<{ top: number; left: number } | null>(null);
  const hasNameMenu = (Array.isArray(nameOptions) && nameOptions.length > 0 && !!onPickName) || !!onAddName;
  // Static instances (welcome `display`, legacy `fixed`) are always big & on.
  // Static instances (welcome `display`, legacy `fixed`) are always big & on.
  // The interactive header avatar defaults to BIG + OFF on entry, persists its
  // size across navigation, and collapses to small when the user reaches the
  // bottom of the page and pulls up.
  const isStatic = display || fixed;
  const [active, setActive] = useState(() => {   // size: big (drag down) vs small+higher (drag up)
    if (display || fixed) return true;
    try { const v = localStorage.getItem('aw-eu-avatar-active'); return v === null ? true : v === '1'; } catch { return true; }
  });
  const [powered, setPowered] = useState(() => { // on/off: colour + mic + spectrum
    if (display || fixed) return true;
    try { const v = localStorage.getItem('aw-eu-avatar-powered'); return v === null ? false : v === '1'; } catch { return false; }
  });
  const [micOn, setMicOn] = useState(false);
  const [availW, setAvailW] = useState(460);     // measured column width → uniform fit scale
  const rootRef = useRef(null);

  // crossfade portraits when the agent changes — preload first so there's no blank flash
  const [displaySrc, setDisplaySrc] = useState(portraitSrc);
  const [prevPortrait, setPrevPortrait] = useState(null);
  useEffect(() => {
    if (portraitSrc === displaySrc) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setPrevPortrait(displaySrc);
      setDisplaySrc(portraitSrc);
      setTimeout(() => { if (!cancelled) setPrevPortrait(null); }, 650);
    };
    img.src = portraitSrc;
    return () => { cancelled = true; };
  }, [portraitSrc, displaySrc]);

  const canvasRef = useRef(null);
  const womanRef = useRef(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const smoothRef = useRef(new Float32Array(BINS));
  const overallRef = useRef(0);
  const peakRef = useRef(0.05);
  const floorRef = useRef(0.02);

  const activeRef = useRef(true);
  const poweredRef = useRef(true);
  const draggingRef = useRef(false);
  const swipeStartRef = useRef(null);
  const swipeCbRef = useRef({ left: onSwipeLeft, right: onSwipeRight });
  swipeCbRef.current = { left: onSwipeLeft, right: onSwipeRight };
  const longPressCbRef = useRef(onLongPress);
  longPressCbRef.current = onLongPress;
  const fixedRef = useRef(fixed);
  fixedRef.current = fixed;
  const displayRef = useRef(display);
  displayRef.current = display;
  const micRef = useRef(false);
  const speakingRef = useRef(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const micStreamRef = useRef(null);
  const srcNodeRef = useRef(null);

  // Drag-hint chevron: replays a 3-pulse triple-chevron wave on mount and every
  // time the avatar resizes (active toggles); after the wave it settles back to a
  // single static chevron.
  const [hintKey, setHintKey] = useState(0);
  const [hintDone, setHintDone] = useState(false);
  useEffect(() => {
    setHintKey(k => k + 1);
    setHintDone(false);
    const t = setTimeout(() => setHintDone(true), 3300);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { poweredRef.current = powered; }, [powered]);
  // Persist the interactive avatar's size state so it stays put across screen navigation.
  useEffect(() => {
    if (isStatic) return;
    try { localStorage.setItem('aw-eu-avatar-active', active ? '1' : '0'); } catch {}
  }, [active, isStatic]);
  useEffect(() => {
    if (isStatic) return;
    try { localStorage.setItem('aw-eu-avatar-powered', powered ? '1' : '0'); } catch {}
  }, [powered, isStatic]);

  // When the avatar is big and the user reaches the bottom of a scrollable page
  // and keeps pulling up, collapse the avatar to small to free up screen space.
  useEffect(() => {
    if (isStatic) return;
    function findScrollable(node) {
      let el = node;
      while (el && el !== document.body) {
        if (rootRef.current && rootRef.current.contains(el)) return null; // ignore the avatar itself
        const oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 8) return el;
        el = el.parentElement;
      }
      return null;
    }
    const atBottom = (sc) => sc.scrollHeight - sc.scrollTop - sc.clientHeight <= 3;
    const atTop = (sc) => sc.scrollTop <= 3;
    let startY = 0;
    const onTouchStart = (e) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (document.querySelector('[data-chat-sheet],[data-block-avatar]')) return;   // chat/modal open → ignore avatar resize
      const dy = e.touches[0].clientY - startY;     // up → dy<0, down → dy>0
      const sc = findScrollable(e.target);
      if (!sc) return;
      if (activeRef.current && dy < -24 && atBottom(sc)) setActive(false);       // pull up at bottom → shrink
      else if (!activeRef.current && dy > 24 && atTop(sc)) setActive(true);      // pull down at top → grow
    };
    const onWheel = (e) => {
      if (document.querySelector('[data-chat-sheet],[data-block-avatar]')) return;   // chat/modal open → ignore avatar resize
      const sc = findScrollable(e.target);
      if (!sc) return;
      if (activeRef.current && e.deltaY > 0 && atBottom(sc)) setActive(false);
      else if (!activeRef.current && e.deltaY < 0 && atTop(sc)) setActive(true);
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('wheel', onWheel);
    };
  }, [isStatic]);
  useEffect(() => { micRef.current = micOn; }, [micOn]);
  useEffect(() => { speakingRef.current = !!speaking; }, [speaking]);

  // Live accent HSL for the spectrum (read inside the rAF loop via ref)
  const accentHueRef = useRef(hexHsl(accent));
  useEffect(() => { accentHueRef.current = hexHsl(accent); }, [accent]);

  const W = 460;
  const H = Math.round((W * 296) / 361);
  const WOMAN = Math.round(Math.min(W, H) * 0.58);

  // Measure the available column width and derive a uniform fit scale, so the
  // whole avatar (canvas + portrait + labels) shrinks together with NO distortion
  // and the reserved layout height collapses to match.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const pw = (el.parentElement && el.parentElement.clientWidth) || el.clientWidth || W;
      if (pw) setAvailW(pw);
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && el.parentElement) {
      ro = new ResizeObserver(measure);
      ro.observe(el.parentElement);
    }
    window.addEventListener('resize', measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const fit = Math.min(1, Math.max(0.4, (availW - 12) / W));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      // Always render at the fixed logical W×H; the parent transform scales it
      // for the small state, so the spectrum stays aligned with the portrait
      // instead of being re-buffered from a scaled bounding rect (which broke it).
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = W;
      h = H;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const offsetAt = (a, L, t, unit) => {
      const v =
        Math.sin(5 * a + L * 0.34 + t) +
        0.62 * Math.sin(3 * a - L * 0.20 - t * 0.8 + 1.2) +
        0.40 * Math.sin(8 * a + L * 0.12 + t * 1.25 + 2.1) +
        0.30 * Math.sin(2 * a - L * 0.08 - t * 0.5);
      return (v / 2.32) * unit;
    };
    const colorFor = (nx, alpha, dark) => {
      // Per-agent accent: build a band centered on the chosen color, borrowing its
      // actual hue + saturation + lightness so the spectrum harmonises with the
      // theme (muted themes → muted spectrum, not a fixed neon band).
      const ac = accentHueRef.current;
      if (ac != null) {
        const hue = ac.h - 26 + nx * 52;
        const sat = Math.max(45, Math.min(96, ac.s));
        const baseL = Math.max(44, Math.min(66, ac.l));
        const light = baseL + (dark ? 4 : 0) + nx * 6;
        return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
      }
      if (palette === 'cyan') {
        // cyan → blue band (admin panel)
        const hue = 196 + nx * 26;
        const light = 60 - nx * 4;
        return `hsla(${hue}, 92%, ${light}%, ${alpha})`;
      }
      if (dark) {
        // cyan → purple band (previous dark palette)
        const hue = 300 - nx * 110;
        const light = 58 + nx * 6;
        return `hsla(${hue}, 92%, ${light}%, ${alpha})`;
      }
      // blue → purple band only
      const hue = 280 - nx * 55;
      const light = 56 + nx * 7;
      return `hsla(${hue}, 88%, ${light}%, ${alpha})`;
    };
    const binForAngle = (a) => {
      const na = a / (Math.PI * 2);
      const folded = na < 0.5 ? na * 2 : (1 - na) * 2;
      return Math.min(BINS - 1, Math.floor(folded * BINS));
    };
    const readAudio = () => {
      const smooth = smoothRef.current;
      if (!micRef.current || !analyserRef.current || !audioDataRef.current) {
        if (speakingRef.current) {
          // synthetic speech envelope — makes the spectrum "talk" without a mic
          const tt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
          const env = 0.45 + 0.32 * (Math.sin(tt * 6.3) * 0.5 + 0.5) * (Math.sin(tt * 2.1) * 0.5 + 0.5) + 0.12 * Math.sin(tt * 11.7);
          const target = Math.max(0.18, Math.min(0.92, env));
          overallRef.current += (target - overallRef.current) * 0.16;
          for (let i = 0; i < BINS; i++) {
            const bandTarget = Math.abs(target * (0.45 + 0.55 * Math.sin(tt * 4.7 + i * 0.42)));
            smooth[i] += (bandTarget - smooth[i]) * 0.13;
          }
          return;
        }
        overallRef.current += (0 - overallRef.current) * 0.08;
        for (let i = 0; i < BINS; i++) smooth[i] += (0 - smooth[i]) * 0.1;
        return;
      }
      analyserRef.current.getByteFrequencyData(audioDataRef.current);
      const data = audioDataRef.current;
      // speech energy lives in the low bins — weight those
      let sum = 0;
      const usable = Math.min(BINS, data.length);
      for (let i = 0; i < usable; i++) {
        const v = data[i] / 255;
        smooth[i] += (v - smooth[i]) * 0.18;
        const w = i < usable * 0.5 ? 1.6 : 0.6; // emphasise low/mid
        sum += v * w;
      }
      const raw = sum / usable;
      // noise floor tracks the quiet baseline; signal is energy above it
      floorRef.current += (raw - floorRef.current) * (raw < floorRef.current ? 0.1 : 0.004);
      const signal = Math.max(0, raw - floorRef.current * 1.4);
      // auto-gain: track a slowly-decaying peak so quiet voices still fill the ring
      peakRef.current = Math.max(signal, peakRef.current * 0.99, 0.04);
      const norm = Math.min(1, signal / peakRef.current);
      overallRef.current += (norm - overallRef.current) * 0.12;
    };

    let __avatarVisible = true;
    let __avatarIO: any = null;
    try {
      __avatarIO = new IntersectionObserver((es) => { __avatarVisible = es[0] ? es[0].isIntersecting : true; }, { threshold: 0 });
      if (canvas) __avatarIO.observe(canvas);
    } catch (_e) { __avatarVisible = true; }
    const draw = () => {
      // perf: وقتی آواتار روی صفحه نیست یا تب مخفی است، نقاشیِ سنگین را رد کن (فقط فریمِ بعد را زمان‌بندی کن)
      if ((typeof document !== 'undefined' && document.hidden) || !__avatarVisible) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (!poweredRef.current) {
        overallRef.current = 0;
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      readAudio();
      const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
      const overall = overallRef.current;
      tRef.current += 0.016 * SPEED * (1 + overall * SPEED_BOOST);
      const t = tRef.current;

      const cx = w / 2, cy = h / 2;
      const size = Math.min(w, h);
      const micActive = micRef.current && !!analyserRef.current;
      const voice = micActive || speakingRef.current;
      // global swell — whole ring breathes with the voice (clearly visible)
      const swell = voice ? 1 + overall * 0.08 : 1;
      const baseR = size * 0.27 * swell;
      const dotR = Math.max(0.9, size * 0.0030) * (voice ? 1 + overall * 0.22 : 1);

      ctx.globalCompositeOperation = 'source-over';
      const RINGS = 26;
      const gap = size * 0.00336;
      const waveUnit = size * 0.019250 * INTENSITY * (voice ? 1 + overall * 0.2 : 1);
      const spanR = baseR + RINGS * gap + waveUnit;
      const N = 240;
      const smooth = smoothRef.current;

      for (let L = 0; L < RINGS; L++) {
        const ringFade = Math.pow(1 - L / RINGS, 1.25);
        const layerWeight = Math.pow(L / (RINGS - 1), 0.85);
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          const idle = offsetAt(a, L, t, waveUnit) * 0.62;
          const audio = voice
            ? smooth[binForAngle(a)] * waveUnit * AUDIO_GAIN
            : offsetAt(a, L, t, waveUnit) * 0.38;
          const r = baseR + L * gap + (idle + audio) * layerWeight;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          const nx = Math.min(1, Math.max(0, 0.5 + (x - cx) / (spanR * 1.7)));
          const alpha = (0.5 + (voice ? overall * 0.1 : 0)) * ringFade;
          if (alpha < 0.02) continue;
          ctx.beginPath();
          ctx.fillStyle = colorFor(nx, alpha, isDarkTheme);
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      if (__avatarIO) { try { __avatarIO.disconnect(); } catch (_e) {} }
    };
  }, []);

  const enableMic = useCallback(async () => {
    if (micRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      await audioCtxRef.current.resume();
      if (!analyserRef.current) {
        const a = audioCtxRef.current.createAnalyser();
        a.fftSize = 256;
        a.smoothingTimeConstant = 0.7;
        analyserRef.current = a;
        audioDataRef.current = new Uint8Array(a.frequencyBinCount);
      }
      // Reuse the session-wide mic stream (requested only once → single prompt).
      const stream = await getSharedMic();
      micStreamRef.current = stream;
      const src = audioCtxRef.current.createMediaStreamSource(stream);
      srcNodeRef.current = src;
      src.connect(analyserRef.current);
      setMicOn(true);
    } catch (e) {
      setMicOn(false);
    }
  }, []);

  // مکالمهٔ صوتی: استریمِ گفت‌وگو را به اسپکتروم وصل کن تا با صدای واقعی موج بزند.
  const convSrcRef = useRef(null);
  useEffect(() => {
    const onToggle = (e: any) => {
      try {
        const d = e && e.detail;
        if (d && d.on && d.stream) {
          const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
          try { audioCtxRef.current.resume(); } catch (_) {}
          if (!analyserRef.current) { const a = audioCtxRef.current.createAnalyser(); a.fftSize = 256; a.smoothingTimeConstant = 0.7; analyserRef.current = a; audioDataRef.current = new Uint8Array(a.frequencyBinCount); }
          try { if (convSrcRef.current) convSrcRef.current.disconnect(); } catch (_) {}
          try { convSrcRef.current = audioCtxRef.current.createMediaStreamSource(d.stream); convSrcRef.current.connect(analyserRef.current); } catch (_) {}
          setMicOn(true); setPowered(true);
        } else if (d && d.on === false) {
          try { if (convSrcRef.current) { convSrcRef.current.disconnect(); convSrcRef.current = null; } } catch (_) {}
          setMicOn(false); setPowered(false);
        }
      } catch (_) {}
    };
    window.addEventListener('neura-voice-toggle', onToggle as any);
    return () => window.removeEventListener('neura-voice-toggle', onToggle as any);
  }, []);

  const disableMic = useCallback(() => {
    if (srcNodeRef.current) { try { srcNodeRef.current.disconnect(); } catch (e) {} srcNodeRef.current = null; }
    micStreamRef.current = null;
    // میکروفون را کاملاً آزاد کن تا نشانگرِ ضبطِ مرورگر خاموش شود:
      try { if (__neuraMicStream) { __neuraMicStream.getTracks().forEach((t) => t.stop()); } } catch (e) {}
      __neuraMicStream = null; __neuraMicPromise = null;
    setMicOn(false);
  }, []);

  useEffect(() => () => {
    // On unmount: tear down only this instance (source node + audio context).
    // Never stop the shared mic tracks — that would force a re-prompt next mount.
    if (srcNodeRef.current) { try { srcNodeRef.current.disconnect(); } catch (e) {} srcNodeRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} audioCtxRef.current = null; }
    analyserRef.current = null;
    // آزادسازیِ میکروفون هنگام ترکِ صفحه
      try { if (__neuraMicStream) { __neuraMicStream.getTracks().forEach((t) => t.stop()); } } catch (e) {}
      __neuraMicStream = null; __neuraMicPromise = null;
  }, []);

  // Auto-power on entering the panel (mount follows the user's nav click)
  useEffect(() => {
    const id = setTimeout(() => { /* میکروفون خودکار باز نشود — فقط با تپِ دکمهٔ ویس */ void 0; }, 250);
    return () => clearTimeout(id);
  }, [enableMic]);

  // Horizontal swipe to switch agents — native listeners on the root so they
  // don't fight framer-motion's vertical (resize) drag on the inner element.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let sx = 0, sy = 0, lx = 0, ly = 0, tracking = false, lpFired = false;
    let lpTimer = null;
    const clearLP = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
    const start = (x: number, y: number) => {
      sx = x; sy = y; lx = x; ly = y; tracking = true; lpFired = false;
      clearLP();
      if (longPressCbRef.current) {
        lpTimer = setTimeout(() => { lpTimer = null; lpFired = true; if (longPressCbRef.current) longPressCbRef.current(); }, 1500);
      }
    };
    const move = (x: number, y: number) => {
      // Track the furthest point reached — touchend/touchcancel coordinates are
      // unreliable on mobile (a hijacked scroll can report a stale position),
      // so the gesture decision is based on the max displacement, not the end point.
      if (Math.abs(x - sx) > Math.abs(lx - sx)) lx = x;
      if (Math.abs(y - sy) > Math.abs(ly - sy)) ly = y;
      if (lpTimer && (Math.abs(x - sx) > 12 || Math.abs(y - sy) > 12)) clearLP();
    };
    const end = (x: number, y: number) => {
      clearLP();
      if (!tracking) return; tracking = false;
      if (lpFired) return; // long-press already handled this gesture
      if (fixedRef.current || displayRef.current) return;
      // Use whichever is further: the end coordinate or the furthest tracked move.
      if (Math.abs(x - sx) < Math.abs(lx - sx)) x = lx;
      if (Math.abs(y - sy) < Math.abs(ly - sy)) y = ly;
      const dx = x - sx, dy = y - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        // horizontal swipe → switch agent
        if (dx < 0) swipeCbRef.current.left && swipeCbRef.current.left();
        else swipeCbRef.current.right && swipeCbRef.current.right();
      } else if (Math.abs(dy) > 22 && Math.abs(dy) > Math.abs(dx)) {
        // vertical drag → resize ONLY (up = shrink, down = grow); power/spectrum is untouched.
        if (dy < 0) setActive(false);
        else setActive(true);
      } else {
        // tap → toggle power in any size
        if (poweredRef.current) { setPowered(false); disableMic(); }
        else { setPowered(true); void enableMic(); }
      }
    };
    // Use Pointer Events with pointer capture for ALL input types (touch, pen, mouse).
    // setPointerCapture locks the gesture to this element, so a downward drag can never
    // be hijacked into a page scroll and the move/up events are always delivered here —
    // this is what makes drag-down-to-grow reliable on real phones.
    const pd = (e: PointerEvent) => {
      // Ignore gestures that start on an interactive child (agent-selector dropdown,
      // buttons, links) so taps there still open/close them instead of being
      // swallowed by the avatar's pointer capture.
      const tgt = e.target as Element | null;
      if (tgt && tgt.closest && tgt.closest('[data-avatar-corner],button,a,input,select,[role="button"],[role="listbox"],[role="menu"]')) return;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      start(e.clientX, e.clientY);
    };
    const pm = (e: PointerEvent) => { if (tracking) move(e.clientX, e.clientY); };
    const pu = (e: PointerEvent) => { end(e.clientX, e.clientY); };
    const pc = (e: PointerEvent) => { end(e.clientX, e.clientY); }; // cancel → still resolve with tracked max
    const cm = (e: Event) => { e.preventDefault(); }; // block image-save / context menu on long-press
    el.addEventListener('pointerdown', pd);
    el.addEventListener('pointermove', pm);
    el.addEventListener('pointerup', pu);
    el.addEventListener('pointercancel', pc);
    el.addEventListener('contextmenu', cm);
    return () => {
      clearLP();
      el.removeEventListener('pointerdown', pd);
      el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu);
      el.removeEventListener('pointercancel', pc);
      el.removeEventListener('contextmenu', cm);
    };
  }, []);

  return (
    <div ref={rootRef} className="md:hidden relative" style={{ width: '100%', overflowX: 'hidden', overflowY: 'visible', height: Math.round((active ? H : H / 3) * fit), marginTop: active ? -40 : -14, marginBottom: active ? 4 : 6, touchAction: 'none', transition: 'height 0.45s cubic-bezier(0.4,0,0.2,1), margin-top 0.45s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
    <div className="relative flex items-center justify-center overflow-visible" style={{ width: '100%', height: active ? H : Math.round(H / 3), transform: `scale(${fit})`, transformOrigin: 'top center', transition: 'height 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
      <motion.div
        className="touch-none relative flex items-center justify-center overflow-visible"
        style={{
          cursor: 'grab',
          flex: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          // Fixed logical size; the parent sizer applies a uniform scale to fit the
          // column, so the high-res canvas is cleanly downscaled and never squished.
          width: active ? W : Math.round(W / 3),
          height: active ? H : Math.round(H / 3),
          filter: demo ? 'grayscale(1) brightness(0.92)' : 'none',
          transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), height 0.45s cubic-bezier(0.4,0,0.2,1), filter 0.4s ease',
        }}
        title={powered ? 'برای خاموش کردن کلیک کنید' : 'برای روشن کردن کلیک کنید'}
      >
        {/* Animated neon spectrum (transparent high-res canvas, CSS-fit to container) — fades in when powered on */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', opacity: powered ? 1 : 0, transition: 'opacity 0.55s ease' }} />
        {/* Portrait — circular, sized as a fraction of the container so it tracks the spectrum at every size */}
        <div ref={womanRef} className="absolute rounded-full overflow-hidden" style={{
          // ابعادِ صریحِ پیکسلی (نه درصد+aspect-ratio) — روی iOS Safari ترکیبِ height:٪ + aspect-ratio
          // عرض را به صفر می‌بُرد و آواتار «ناپدید» می‌شد. حالا مربعِ ثابت بر مبنای ارتفاعِ والد.
          width: Math.round((active ? H : H / 3) * 0.54), height: Math.round((active ? H : H / 3) * 0.54),
          left: '50%', top: '50%', transform: 'translate(-50%, -50%)', transformOrigin: 'center',
          filter: 'none',
          transition: 'filter 0.5s ease',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18)',
        }}>
          <img key={displaySrc} src={displaySrc} alt="آواتار" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 22%', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
          {prevPortrait && (
            <img key={'prev-' + prevPortrait} src={prevPortrait} alt="" className="w-full h-full absolute inset-0 aw-avatar-out" style={{ objectFit: 'cover', objectPosition: 'center 22%', zIndex: 2 }} draggable={false} />
          )}
          {/* agentlock: lock overlay — ایجنتِ استخدام‌نشده قفل است */}
          {demo && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.46)', zIndex: 3, backdropFilter: 'blur(1.5px)', WebkitBackdropFilter: 'blur(1.5px)' }}>
              <i className="fa-solid fa-lock text-white" style={{ fontSize: 'clamp(14px, 26%, 34px)', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))' }} />
            </div>
          )}
        </div>
      </motion.div>

      {/* Assistant human name — flanks the big avatar; sits on the dropdown row when small */}
      {!hideName && !display && (
      <div data-avatar-corner className="absolute pointer-events-none flex items-center gap-1.5"
        style={active
          ? { bottom: 16, height: 36, left: '50%', transform: 'translateX(-50%) translateX(-122px)', color: 'var(--aw-text-primary)', transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }
          : { bottom: -10, height: 36, left: '50%', transform: 'translateX(-50%) translateX(-122px)', color: 'var(--aw-text-primary)', transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
        {demo && onHire ? (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onHire(); }}
            className="flex items-center gap-1.5 cursor-pointer rounded-full"
            style={{ pointerEvents: 'auto', padding: '7px 14px', border: '1px solid color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 60%, transparent)', background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 26%, transparent)', color: 'var(--aw-eu-primary, #7b62fc)', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}
          >
            <i className="fa-solid fa-briefcase" style={{ fontSize: 12 }} />
            استخدام ایجنت
          </button>
        ) : (
          <>
                        <span className="relative flex items-center gap-2" style={{ pointerEvents: 'auto', color: 'inherit' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: powered ? 'var(--aw-online, #00E676)' : 'var(--aw-offline, #8F8F8F)' }} />
              {hasNameMenu ? (
                <button ref={nameTrigRef} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); const r = nameTrigRef.current?.getBoundingClientRect(); if (r) setNameMenuPos({ top: r.bottom + 8, left: r.left + r.width / 2 }); setNameMenuOpen(o => !o); }} className="flex items-center gap-1.5 cursor-pointer border-none p-0" style={{ pointerEvents: 'auto', background: 'transparent', color: 'inherit', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
                  <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${nameMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--aw-eu-primary, #7b62fc)' }} />
                  {assistantName}
                </button>
              ) : (
                <span style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>{assistantName}</span>
              )}
              {onChatClick && (
                <button aria-label="گفتگو با ایجنت" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onChatClick(); }} className="flex items-center justify-center cursor-pointer border-none p-0 flex-shrink-0" style={{ pointerEvents: 'auto', width: 30, height: 30, background: 'transparent' }}>
                  <span aria-hidden style={{ display: 'block', width: 26, height: 26, background: accent || 'var(--aw-eu-primary, #7b62fc)', WebkitMaskImage: 'url("data:image/png;base64,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")', maskImage: 'url("data:image/png;base64,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")', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
                </button>
              )}
              {nameMenuOpen && nameMenuPos && typeof document !== 'undefined' && createPortal(
                <>
                  {/* بک‌دراپ + منو در پرتالِ body با موقعیتِ fixed تا هیچ استکینگ‌کانتکست/کارتی رویش نیفتد (رفعِ «باز می‌شود ولی پشتِ کارت‌ها پنهان است») */}
                  <div className="fixed inset-0" style={{ zIndex: 2147483000 }} onPointerDown={(e) => { e.stopPropagation(); setNameMenuOpen(false); }} onClick={(e) => { e.stopPropagation(); setNameMenuOpen(false); }} />
                  <motion.div onPointerDown={(e) => e.stopPropagation()} initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.16 }} className="min-w-[190px] rounded-2xl p-1.5" style={{ position: 'fixed', top: nameMenuPos.top, left: nameMenuPos.left, transform: 'translateX(-50%)', zIndex: 2147483001, background: 'color-mix(in srgb, var(--aw-eu-primary) 12%, var(--aw-bg-modal, rgba(240,238,250,0.98)))', backdropFilter: 'blur(22px) saturate(1.5)', WebkitBackdropFilter: 'blur(22px) saturate(1.5)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary) 32%, transparent)', boxShadow: '0 16px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.35)' }}>
                    {(nameOptions || []).map(o => { const isActive = o.id === activeNameId; return (
                      <button key={o.id} onClick={(e) => { e.stopPropagation(); onPickName(o.id); setNameMenuOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer border-none text-right" style={{ background: isActive ? 'color-mix(in srgb, var(--aw-eu-primary) 22%, transparent)' : 'transparent' }}>
                        <span className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-white text-[10px]" style={{ borderRadius: 7, background: 'var(--aw-eu-primary, #7b62fc)', fontWeight: 700 }}>{(o.name || 'د').slice(0, 1)}</span>
                        <span className="flex-1 text-[12.5px] truncate" style={{ color: 'var(--aw-text-primary)', fontWeight: isActive ? 700 : 500 }}>{o.name}</span>
                        {isActive && <i className="fa-solid fa-check text-[11px]" style={{ color: 'var(--aw-eu-primary)' }} />}
                      </button>
                    ); })}
                    {onAddName && (<button onClick={(e) => { e.stopPropagation(); onAddName(); setNameMenuOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer border-none text-right mt-0.5" style={{ background: 'transparent' }}>
                      <span className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-white text-[11px]" style={{ borderRadius: 7, background: 'var(--aw-eu-primary, #7b62fc)', fontWeight: 700 }}><i className="fa-solid fa-plus" /></span>
                      <span className="flex-1 text-[12.5px]" style={{ color: 'var(--aw-eu-primary, #7b62fc)', fontWeight: 700 }}>{/* hireanother: add option */}استخدام یکی دیگر</span>
                    </button>)}
                  </motion.div>
                </>,
                document.body)}
            </span>
          </>
        )}
      </div>
      )}

      {/* Agent selector — flanks the big avatar; on the name's row when small */}
      {cornerSlot && (
        <div className="absolute" data-avatar-corner style={active
          ? { bottom: 16, left: '50%', transform: 'translateX(-50%) translateX(116px)', zIndex: 42, transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }
          : { bottom: -10, left: '50%', transform: 'translateX(-50%) translateX(116px)', zIndex: 42, transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
          {cornerSlot}
        </div>
      )}

      {/* Drag hint — animated triple chevron that settles to a single one; replays on each resize */}
      {!fixed && (
      <div
        key={hintKey}
        className="absolute pointer-events-none flex flex-col items-center"
        style={{ bottom: active ? 14 : 1, left: '50%', transform: 'translateX(-50%)', color: 'var(--aw-eu-primary, #7b62fc)' }}
      >
        {hintDone ? (
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ opacity: 0.85 }}>
            {active
              ? <path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              : <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}
          </svg>
        ) : (
          [0, 1, 2].map((i) => (
            <motion.svg
              key={i}
              width="12" height="8" viewBox="0 0 12 8" fill="none"
              style={{ marginTop: i === 0 ? 0 : -2 }}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.7, 0.18, 1, 0.7] }}
              transition={{
                duration: 1,
                times: [0, 0.25, 0.6, 1],
                repeat: 2,
                ease: 'easeInOut',
                delay: (active ? (2 - i) : i) * 0.13,
              }}
            >
              <path d={active ? "M1 7L6 2L11 7" : "M1 1L6 6L11 1"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </motion.svg>
          ))
        )}
      </div>
      )}

      {/* Multi-agent swipe indicator — dots show when this team has more than one agent */}
      {(swipeCount || 0) > 1 && (
        <div className="absolute pointer-events-none flex items-center gap-1.5" style={{ bottom: active ? 0 : -13, left: '50%', transform: 'translateX(-50%)' }}>
          {Array.from({ length: swipeCount }).map((_, i) => (
            <span key={i} className="rounded-full" style={{ width: i === swipeIndex ? 7 : 5, height: i === swipeIndex ? 7 : 5, background: i === swipeIndex ? 'var(--aw-eu-primary, #22A6F0)' : 'var(--aw-text-muted, #9aa)', opacity: i === swipeIndex ? 1 : 0.5, transition: 'all .2s' }} />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
