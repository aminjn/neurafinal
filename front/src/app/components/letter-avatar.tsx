import React from 'react';

// ────────────────────────────────────────────────────────────────
// Squircle (superellipse) monogram / icon chip.
// The reference chip is a puffy squircle — square whose sides bow
// outward slightly and whose corners are smoothly rounded — filled
// with a diagonal light streak in the theme accent colour.
// Used everywhere a contact / customer / company / smart-agent /
// meeting would otherwise show an emoji or generic square icon.
// ────────────────────────────────────────────────────────────────

// Build a superellipse path in a 0..100 box (scales with preserveAspectRatio=none).
function superPath(n = 4.2, N = 80, R = 50, C = 50): string {
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * 2 * Math.PI;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = C + R * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const y = C + R * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
  }
  return d + 'Z';
}
const SQUIRCLE_D = superPath(4.2, 80);
const SQUIRCLE_URI = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${SQUIRCLE_D}' fill='black'/></svg>`
)}")`;

// Mask that clips any chip to the squircle outline.
export const squircleMask: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_URI,
  maskImage: SQUIRCLE_URI,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  // alpha mode so the black-filled path = visible (consistent across engines)
  WebkitMaskMode: 'alpha' as any,
  maskMode: 'alpha' as any,
};

// Diagonal light-streak fill in the theme accent (var --aw-eu-primary in glass
// panels, falls back to --aw-primary). A soft inner ring + outer glow give the
// frosted-chip look of the reference.
const chipFill = (accent: string): React.CSSProperties => ({
  background: `linear-gradient(135deg,
    color-mix(in srgb, ${accent} 62%, white) 0%,
    ${accent} 34%,
    color-mix(in srgb, ${accent} 78%, white) 52%,
    ${accent} 68%,
    color-mix(in srgb, ${accent} 84%, black) 100%)`,
  boxShadow: `inset 0 1px 1.5px rgba(255,255,255,0.4), inset 0 0 0 1px color-mix(in srgb, ${accent} 80%, black)`,
});

export function LetterAvatar({
  name,
  init,
  size = 40,
  radius, // kept for API compatibility (ignored — squircle shape)
  accent = 'var(--aw-eu-primary, var(--aw-primary))',
  className = '',
  style = {},
}: {
  name?: string;
  init?: string;
  size?: number;
  radius?: number;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const letter = (init || (name || '؟').trim()[0] || '؟');
  return (
    <div
      className={`letter-avatar relative flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        ...squircleMask,
        ...chipFill(accent),
        filter: `drop-shadow(0 1px 3px color-mix(in srgb, ${accent} 45%, transparent))`,
        ...style,
      }}
    >
      <span
        className="relative"
        style={{
          color: '#fff',
          fontWeight: 600,
          fontSize: Math.round(size * 0.42),
          lineHeight: 1,
          fontFamily: "'Kamand', 'Vazirmatn', sans-serif",
          textShadow: '0 1px 3px rgba(60,20,90,0.4)',
        }}
      >
        {letter}
      </span>
    </div>
  );
}

// Glassy squircle tile holding a Font-Awesome icon — same treatment as
// LetterAvatar, used for conversation/thread rows (chat bubble, group, …).
export function GlassTile({
  icon,
  bg, // kept for API compatibility (ignored — theme accent)
  hue,
  size = 48,
  radius,
  accent = 'var(--aw-eu-primary, var(--aw-primary))',
  className = '',
  style = {},
}: {
  icon: string;
  bg?: string;
  hue?: number;
  size?: number;
  radius?: number;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`glass-tile relative flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        ...squircleMask,
        ...chipFill(accent),
        filter: `drop-shadow(0 1px 3px color-mix(in srgb, ${accent} 45%, transparent))`,
        ...style,
      }}
    >
      <i
        className={icon}
        style={{
          position: 'relative',
          color: '#fff',
          fontSize: Math.round(size * 0.4),
          lineHeight: 1,
          textShadow: '0 1px 3px rgba(60,20,90,0.4)',
        }}
      />
    </div>
  );
}
