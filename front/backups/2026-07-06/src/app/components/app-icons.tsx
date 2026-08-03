import React from 'react';

// Map of semantic icon names → bespoke PNG assets (designed by the client).
export const PNG_ICONS: Record<string, string> = {
  marketing: 'src/icons/png/marketing.png',
  call: 'src/icons/png/call.png',
  phone: 'src/icons/png/call.png',
  chat: 'src/icons/png/chat.png',
  chats: 'src/icons/png/chat.png',
  secretary: 'src/icons/png/secretary.png',
  calendar: 'src/icons/png/secretary.png',
  schedule: 'src/icons/png/secretary.png',
  discount: 'src/icons/png/discount.png',
  tag: 'src/icons/png/discount.png',
  finance: 'src/icons/png/finance.png',
  calculator: 'src/icons/png/finance.png',
  food: 'src/icons/png/food.png',
  restaurant: 'src/icons/png/food.png',
  delivery: 'src/icons/png/delivery.png',
  gift: 'src/icons/png/delivery.png',
  home: 'src/icons/png/home.png',
  location: 'src/icons/png/location.png',
  procurement: 'src/icons/png/procurement.png',
  box: 'src/icons/png/procurement.png',
  logistics: 'src/icons/png/procurement.png',
  mail: 'src/icons/png/mail.png',
  notifications: 'src/icons/png/notifications.png',
  bell: 'src/icons/png/notifications.png',
  'postal-code': 'src/icons/png/postal-code.png',
  profile: 'src/icons/png/profile.png',
  user: 'src/icons/png/profile.png',
  reports: 'src/icons/png/reports.png',
  chart: 'src/icons/png/reports.png',
  performance: 'src/icons/png/reports.png',
  search: 'src/icons/png/search.png',
  sales: 'src/icons/png/sales.png',
  invoice: 'src/icons/png/sales.png',
  setting: 'src/icons/png/setting.png',
  settings: 'src/icons/png/setting.png',
  shop: 'src/icons/png/shop.png',
  market: 'src/icons/png/shop.png',
  support: 'src/icons/png/support.png',
  wallet: 'src/icons/png/wallet.png',
  website: 'src/icons/png/website.png',
  globe: 'src/icons/png/website.png',
};

// Render a bespoke PNG icon by semantic name; falls back to a Font Awesome <i> if unknown.
export function AppIcon({ name, size = 24, faFallback, style, className }: {
  name: string; size?: number; faFallback?: string; style?: React.CSSProperties; className?: string;
}) {
  const url = PNG_ICONS[name];
  if (url) {
    return <img src={url} alt="" width={size} height={size} className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block', ...style }} />;
  }
  return <i className={`${faFallback || 'fa-solid fa-circle'} ${className || ''}`} style={{ fontSize: size * 0.8, ...style }} />;
}

// Avatar that shows a photo, or the first letter of the name on a coloured tile when no photo.
export function Avatar({ name, src, size = 48, radius = 14, gradient, fontScale = 0.42, className, style }: {
  name?: string; src?: string; size?: number; radius?: number; gradient?: string; fontScale?: number;
  className?: string; style?: React.CSSProperties;
}) {
  const initial = (name || '').trim().charAt(0) || '؟';
  const bg = gradient || 'linear-gradient(135deg, #8169ff, #5c4abd)';
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...style,
  };
  if (src) {
    return <div className={className} style={base}><img src={src} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
  }
  return (
    <div className={className} style={{ ...base, background: bg, color: '#fff', fontWeight: 700, fontSize: Math.round(size * fontScale), fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>
      {initial}
    </div>
  );
}
