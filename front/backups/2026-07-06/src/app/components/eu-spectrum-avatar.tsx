"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';

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

export function EuAvatar({ palette, accent, name, portrait, cornerSlot, onSwipeLeft, onSwipeRight, onLongPress, onChatClick, onHire, demo, swipeCount, swipeIndex, fixed, display, hideName, speaking }: { palette?: 'purple' | 'cyan'; accent?: string | null; name?: string; portrait?: string; fixed?: boolean; display?: boolean; hideName?: boolean; speaking?: boolean; demo?: boolean; cornerSlot?: any; onSwipeLeft?: () => void; onSwipeRight?: () => void; onLongPress?: () => void; onChatClick?: () => void; onHire?: () => void; swipeCount?: number; swipeIndex?: number } = {}) {
  const portraitSrc = portrait || 'src/assets/avatar-portrait.png';
  const assistantName = name || (typeof localStorage !== 'undefined' && localStorage.getItem('aw-eu-assistant-name')) || 'لادن لرستانی';
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

    const draw = () => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const src = audioCtxRef.current.createMediaStreamSource(stream);
      src.connect(analyserRef.current);
      setMicOn(true);
    } catch (e) {
      setMicOn(false);
    }
  }, []);

  const disableMic = useCallback(() => {
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(tr => tr.stop()); micStreamRef.current = null; }
    setMicOn(false);
  }, []);

  useEffect(() => () => {
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(tr => tr.stop());
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} }
  }, []);

  // Auto-power on entering the panel (mount follows the user's nav click)
  useEffect(() => {
    const id = setTimeout(() => { void enableMic(); }, 250);
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
    <div ref={rootRef} className="md:hidden relative overflow-visible" style={{ width: '100%', height: Math.round((active ? H : H / 3) * fit), marginTop: active ? -28 : -8, marginBottom: active ? 16 : 20, touchAction: 'none', transition: 'height 0.45s cubic-bezier(0.4,0,0.2,1), margin-top 0.45s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
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
          height: '54%', aspectRatio: '1', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', transformOrigin: 'center',
          filter: 'none',
          transition: 'filter 0.5s ease',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18)',
        }}>
          <img key={displaySrc} src={displaySrc} alt="آواتار" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 22%', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
          {prevPortrait && (
            <img key={'prev-' + prevPortrait} src={prevPortrait} alt="" className="w-full h-full absolute inset-0 aw-avatar-out" style={{ objectFit: 'cover', objectPosition: 'center 22%', zIndex: 2 }} draggable={false} />
          )}
        </div>
      </motion.div>

      {/* Assistant human name — flanks the big avatar; sits on the dropdown row when small */}
      {!hideName && !display && (
      <div className="absolute pointer-events-none flex items-center gap-1.5"
        style={active
          ? { bottom: 26, height: 36, left: '50%', transform: 'translateX(-50%) translateX(-122px)', color: 'var(--aw-text-primary)', transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }
          : { bottom: 0, height: 36, left: '50%', transform: 'translateX(-50%) translateX(-122px)', color: 'var(--aw-text-primary)', transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
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
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: powered ? 'var(--aw-online, #00E676)' : 'var(--aw-offline, #8F8F8F)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>{assistantName}</span>
            {onChatClick && (
              <button
                aria-label="گفتگو با ایجنت"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onChatClick(); }}
                className="flex items-center justify-center rounded-[9px] cursor-pointer"
                style={{ pointerEvents: 'auto', width: 32, height: 32, marginRight: 2, border: '1px solid color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 55%, transparent)', background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 22%, transparent)', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.18)' }}
              >
                <img src="data:image/png;base64,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" alt="گفتگو" style={{ width: 19, height: 19, objectFit: 'contain' }} />
              </button>
            )}
          </>
        )}
      </div>
      )}

      {/* Agent selector — flanks the big avatar; on the name's row when small */}
      {cornerSlot && (
        <div className="absolute" data-avatar-corner style={active
          ? { bottom: 26, left: '50%', transform: 'translateX(-50%) translateX(116px)', zIndex: 42, transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }
          : { bottom: 0, left: '50%', transform: 'translateX(-50%) translateX(116px)', zIndex: 42, transition: 'bottom 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
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
      {swipeCount && swipeCount > 1 && (
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
