import React, { useState, useRef, useContext, createContext, useEffect } from 'react';

function __grpFa(v: any): string {
  const n = String(v == null ? '' : v).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString('en-US').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) : '';
}

function __dlCsv(filename: string, rows: any[]): boolean {
  try {
    if (!rows || !rows.length) return false;
    const headers = Object.keys(rows[0]);
    const esc = (v: any) => '"' + String(v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v)).replace(/"/g, '""') + '"';
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map((h) => esc(r[h])).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (_) { return false; }
}
function __pickFile(accept: string, cb: (name: string) => void) {
  try { const i = document.createElement('input'); i.type = 'file'; if (accept) i.accept = accept; i.onchange = () => { const f = (i.files && i.files[0]); if (f) cb(f.name); }; i.click(); } catch (_) {}
}
function __speak(text: string) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'fa-IR'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (_) {}
}
function __recMic(onOk: () => void, onErr: () => void) {
  try { (navigator as any).mediaDevices.getUserMedia({ audio: true }).then((st: any) => { onOk(); try { st.getTracks().forEach((t: any) => setTimeout(() => t.stop(), 4000)); } catch (_) {} }).catch(() => onErr()); } catch (_) { onErr(); }
}
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp, AdminScreen, AgentTeam, ChatGroup } from './app-context';
import { TimePicker } from './time-picker';
import { api } from '../services/api';
function __usePersistAdmin(coll: string, value: any, setValue: (v: any) => void) {
  const __l = React.useRef(false);
  React.useEffect(() => { (async () => { try { const v: any = await (api as any).myList(coll); if (Array.isArray(v)) setValue(v); } catch (_) {} __l.current = true; })(); }, []);
  React.useEffect(() => { if (!__l.current) return; const h = setTimeout(() => { (api as any).myBulkSave(coll, value).catch(() => {}); }, 700); return () => clearTimeout(h); }, [value]);
}


function __planPrice(p: string): number {
  const en = String(p || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/,/g, '').trim();
  const m = en.match(/([\d.]+)\s*([KMkm]?)/);
  if (!m) return 0;
  let n = parseFloat(m[1]) || 0;
  if (/m/i.test(m[2])) n *= 1000000; else if (/k/i.test(m[2])) n *= 1000;
  return Math.round(n);
}

function __printInvoice(inv: any, subtotal: number, tax: number, total: number) {
  try {
    const w = window.open('', '_blank');
    if (!w) return false;
    const fa = (n: number) => (Number(n) || 0).toLocaleString('fa-IR');
    const rows = (inv.lines || []).map((l: any) => `<tr><td>${l.description || l.name || ''}</td><td>${fa(l.qty)}</td><td>${fa(l.unitPrice)}</td><td>${fa((l.qty || 0) * (l.unitPrice || 0))}</td></tr>`).join('');
    w.document.write(`<html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>فاکتور ${inv.number || ''}</title><style>body{font-family:Tahoma,Arial,sans-serif;padding:28px;color:#111}h2{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:14px 0}td,th{border:1px solid #ccc;padding:7px;text-align:right;font-size:13px}th{background:#f3f3f3}.tot{margin:3px 0}.fin{font-size:16px;font-weight:800;margin-top:8px}</style></head><body><h2>فاکتور ${inv.number || ''}</h2><div>مشتری: ${inv.customer || ''}</div><div>تاریخ صدور: ${inv.issueDate || ''} — سررسید: ${inv.dueDate || ''}</div><table><thead><tr><th>شرح</th><th>تعداد</th><th>قیمت واحد</th><th>مبلغ</th></tr></thead><tbody>${rows}</tbody></table><div class="tot">جمع جزء: ${fa(subtotal)} ریال</div>${inv.discount > 0 ? '<div class="tot">تخفیف: −' + fa(inv.discount) + ' ریال</div>' : ''}<div class="tot">مالیات: ${fa(tax)} ریال</div><div class="fin">مبلغ نهایی: ${fa(total)} ریال</div>${inv.note ? '<div style="margin-top:10px">یادداشت: ' + inv.note + '</div>' : ''}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch (_) {} }, 300);
    return true;
  } catch (_) { return false; }
}

const __ANALYTICS: any = { monthlyRevenue: null, weeklyActivity: null };
let __analyticsLoaded = false;
function __useAnalytics() {
  const [, __af] = React.useState(0);
  React.useEffect(() => {
    if (__analyticsLoaded) { if (__ANALYTICS.monthlyRevenue) __af((x) => x + 1); return; }
    (async () => { try { const a: any = await (api as any).analytics(); if (a && a.monthlyRevenue) { __ANALYTICS.monthlyRevenue = a.monthlyRevenue; __ANALYTICS.weeklyActivity = a.weeklyActivity; __analyticsLoaded = true; __af((x) => x + 1); } } catch (_) {} })();
  }, []);
}

import {
  COMPANIES, NOTIFICATIONS, Agent, Customer, Deal, FinanceItem, Task, Personnel, PERSONNEL_PERMISSIONS,
  Invoice,
  toFa, STATUS_LABELS, STAGE_LABELS,
  TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS,
  MONTHLY_REVENUE_DATA, WEEKLY_ACTIVITY_DATA, CRM_FUNNEL_DATA
} from './data';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import MarketingCampaignScreen from './marketing-campaign-screen';
import { SalesFunnelScreen, SalesForecastScreen, InventoryScreen, PurchaseRequestScreen } from './sales-inventory-screens';
import { SECRETARY_MEETINGS, MEETING_STATUS, MeetingViewer, NewMeetingContent, type SecretaryMeeting } from './meetings';
import neuraLogo from "figma:asset/0ee60e1dbaa3bcb0e2daccbfdd0200ba026fb510.png";
function logoMaskUrl(){ try { return (window.__VFS_IMG__ && window.__VFS_IMG__["/src/assets/neura-logo-blue.png"]) || ""; } catch(e){ return ""; } }
import svgPaths from "../../imports/svg-t4fpzrr60b";
import DailyBriefingScreen from './daily-briefing';
import { SecPlanningScreen, SecCrmLiteScreen, SecPerformanceScreen, SecDailyFinanceScreen, SecTodayScreen } from './secretary-screens';
import { EuAssistantScreen } from './eu-agent-screens';
import { EuAvatar } from './eu-spectrum-avatar';
import EndUserPanel, { SwipeToCall, EuProfileBody } from './end-user-panel';
import { LetterAvatar, GlassTile } from './letter-avatar';
import { MktConversationsScreen, MktLeadsScreen, MktSegmentScreen, MktPerformanceScreen, MktApprovalsScreen, MktCalendarScreen, MktCrmScreen, MktActionsScreen } from './marketing-screens';
import { MarketingProvider } from './marketing-context';
import { ProcRequestsScreen, ProcOrdersScreen, ProcDeliveryScreen, ProcFinanceScreen, ProcSupplyScreen, ProcImportScreen } from './procurement-screens';
import { SalesPosScreen, SalesOrdersScreen, SalesInvoicesScreen, SalesMenuScreen, SalesCustomersScreen, SalesQuickReportScreen } from './sales-screens';
import { DineSettingsScreen, DineMenuBuilderScreen, DineTablesScreen, DineKdsScreen, DinePosScreen, DineRecipesScreen, DineStaffScreen, DineInsightsScreen, DineReservationsScreen, DineLoyaltyScreen, DineMarketingScreen, DineCompetitorsScreen } from './dine-screens';
import { SalesConversationsScreen, SalesShiftScreen } from './sales-extra';
import { QuickForm } from './quick-actions';

// ========================
// AGENT TEAM CONFIG
// ========================
type TeamKey = 'marketing' | 'secretary' | 'finance' | 'procurement' | 'sales' | 'dine';

interface TeamConfig {
  id: TeamKey;
  name: string;
  desc: string;
  icon: string;
  bg: string;
  gradient: string;
  agentId: string;
  navItems: { id: AdminScreen; icon: string; label: string }[];
}

const TEAM_CONFIGS: Record<TeamKey, TeamConfig> = {
  marketing: {
    id: 'marketing', name: 'بازاریابی', desc: 'مدیریت کمپین‌ها، تحلیل بازار و جذب مشتری',
    icon: 'fa-solid fa-bullhorn', bg: 'aw-bg-blue', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    agentId: 'marketing',
    navItems: [
      { id: 'mktActionsScreen', icon: 'fa-solid fa-bolt', label: 'اقدامات' },
      { id: 'mktConversationsScreen', icon: 'fa-solid fa-comments', label: 'گفتگو' },
      { id: 'mktCrmScreen', icon: 'fa-solid fa-address-book', label: 'CRM' },
      { id: 'campaignScreen', icon: 'fa-solid fa-bullhorn', label: 'کمپین‌ها' },
      { id: 'mktPerformanceScreen', icon: 'fa-solid fa-chart-line', label: 'گزارش' },
    ],
  },
  secretary: {
    id: 'secretary', name: 'منشی', desc: 'مرکز فرماندهی، مدیریت تقویم، جلسات و هماهنگی‌ها',
    icon: 'fa-solid fa-calendar-check', bg: 'aw-bg-pink', gradient: 'linear-gradient(135deg, #22A6F0, #1B4FE8)',
    agentId: 'secretary',
    navItems: [
      { id: 'secTodayScreen', icon: 'fa-solid fa-house', label: 'امروز من' },
      { id: 'chatsScreen', icon: 'fa-solid fa-comments', label: 'گفتگو' },
      { id: 'secPlanningScreen', icon: 'fa-solid fa-calendar-days', label: 'برنامه‌ریزی' },
      { id: 'secPerformanceScreen', icon: 'fa-solid fa-chart-simple', label: 'گزارشات' },
    ],
  },
  finance: {
    id: 'finance', name: 'مالی / اداری', desc: 'حسابداری، فاکتورها و گزارش‌های مالی',
    icon: 'fa-solid fa-calculator', bg: 'aw-bg-purple', gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    agentId: 'finance',
    navItems: [
      { id: 'chatsScreen', icon: 'fa-solid fa-comments', label: 'گفتگوها' },
      { id: 'dashboardScreen', icon: 'fa-solid fa-th-large', label: 'داشبورد' },
      { id: 'financeScreen', icon: 'fa-solid fa-wallet', label: 'مالی' },
      { id: 'reportsScreen', icon: 'fa-solid fa-file-invoice-dollar', label: 'فاکتورها' },
      { id: 'tasksScreen', icon: 'fa-solid fa-list-check', label: 'وظایف' },
    ],
  },
  procurement: {
    id: 'procurement', name: 'خرید / تدارکات', desc: 'زنجیره تأمین: درخواست → سفارش → تحویل → انبار → پرداخت',
    icon: 'fa-solid fa-boxes-stacked', bg: 'aw-bg-orange', gradient: 'linear-gradient(135deg, #F97316, #C2410C)',
    agentId: 'procurement',
    navItems: [
      { id: 'inventoryScreen', icon: 'fa-solid fa-warehouse', label: 'انبار' },
      { id: 'chatsScreen', icon: 'fa-solid fa-comments', label: 'گفتگو' },
      { id: 'procSupplyScreen', icon: 'fa-solid fa-truck-field', label: 'تامین' },
      { id: 'procImportScreen', icon: 'fa-solid fa-ship', label: 'عملیات واردات' },
      { id: 'procFinanceScreen', icon: 'fa-solid fa-money-check-dollar', label: 'مالی' },
    ],
  },
  sales: {
    id: 'sales', name: 'فروشنده/صندوقدار', desc: 'مدیریت فروش، فاکتورها و ارتباط با مشتری',
    icon: 'fa-solid fa-cash-register', bg: 'aw-bg-green', gradient: 'linear-gradient(135deg, #10B981, #047857)',
    agentId: 'sales',
    navItems: [
      { id: 'salesConversationsScreen', icon: 'fa-solid fa-headset', label: 'گفتگو' },
      { id: 'salesOrdersScreen', icon: 'fa-solid fa-receipt', label: 'سفارش' },
      { id: 'salesQuickReportScreen', icon: 'fa-solid fa-cash-register', label: 'مالی' },
      { id: 'salesMenuScreen', icon: 'fa-solid fa-store', label: 'محصولات' },
      { id: 'inventoryScreen', icon: 'fa-solid fa-warehouse', label: 'انبار' },
      { id: 'salesCustomersScreen', icon: 'fa-solid fa-address-book', label: 'CRM' },
    ],
  },
  dine: {
    id: 'dine', name: 'داین', desc: 'مدیریتِ کاملِ رستوران/کافه: منو، پذیرش، آشپزخانه، صندوق، انبار و بهای تمام‌شده',
    icon: 'fa-solid fa-utensils', bg: 'aw-bg-teal', gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)',
    agentId: 'dine',
    navItems: [
      { id: 'chatsScreen', icon: 'fa-solid fa-comments', label: 'گفتگو' },
      { id: 'dineMenuScreen', icon: 'fa-solid fa-book-open', label: 'منو' },
      { id: 'dinePosScreen', icon: 'fa-solid fa-cash-register', label: 'صندوق' },
      { id: 'dineTablesScreen', icon: 'fa-solid fa-chair', label: 'میزها' },
      { id: 'dineReservationsScreen', icon: 'fa-solid fa-calendar-check', label: 'رزرو' },
      { id: 'dineKdsScreen', icon: 'fa-solid fa-fire', label: 'آشپزخانه' },
      { id: 'inventoryScreen', icon: 'fa-solid fa-warehouse', label: 'انبار' },
      { id: 'dineRecipesScreen', icon: 'fa-solid fa-flask', label: 'رسپی' },
      { id: 'dineStaffScreen', icon: 'fa-solid fa-users', label: 'پرسنل' },
      { id: 'dineLoyaltyScreen', icon: 'fa-solid fa-users-line', label: 'باشگاه' },
      { id: 'dineMarketingScreen', icon: 'fa-solid fa-bullhorn', label: 'بازاریابی' },
      { id: 'dineCompetitorsScreen', icon: 'fa-solid fa-chart-simple', label: 'رقبا' },
      { id: 'dineReportsScreen', icon: 'fa-solid fa-brain', label: 'بینشِ مدیر' },
      { id: 'dineSettingsScreen', icon: 'fa-solid fa-gear', label: 'تنظیمات' },
    ],
  },
};

// Rename the sales "محصولات" tab based on the company's activity type:
//  کافه و رستوران → منو, خدمات → لیست خدمات, otherwise محصولات.
function productsLabelFor(type?: string): string {
  if (type === 'کافه و رستوران') return 'منو';
  if (type === 'خدمات') return 'لیست خدمات';
  return 'محصولات';
}
function applyProductsLabel(items: { id: AdminScreen; icon: string; label: string }[], type?: string) {
  const lbl = productsLabelFor(type);
  if (lbl === 'محصولات') return items;
  return items.map(it => it.id === 'salesMenuScreen' ? { ...it, label: lbl } : it);
}

function getTeamNavItems(teamKey: AgentTeam): { id: AdminScreen; icon: string; label: string }[] {
  if (!teamKey) return ADMIN_NAV_ITEMS;
  return TEAM_CONFIGS[teamKey]?.navItems || ADMIN_NAV_ITEMS;
}

// ── Per-agent accent palette ──────────────────────────────────────────────
// 12 curated accents; selecting one re-themes the whole panel for that agent.
export const ACCENT_PALETTE = [
  '#7B62FC',
  '#7E13A3', '#1B60C9', '#257916', '#99122D',
  '#0C7373', '#9F7B14', '#3E0F8F', '#BC5817',
];

// First N items of avatars/themes are free; the rest are locked and bought individually.
export const FREE_COUNT = 3;
export const AVATAR_PRICE = 250000;
export const THEME_PRICE = 150000;

function BuyItemModal({ kind, label, price, swatch, imgSrc, onConfirm }: { kind: 'avatar' | 'theme'; label: string; price: number; swatch?: string; imgSrc?: string; onConfirm: () => void }) {
  const { walletBalance, showToast, closeModal } = useApp();
  const fmt = (n: number) => toFa(Math.round(n).toLocaleString('en-US'));
  const enough = walletBalance >= price;
  const buy = () => {
    if (!enough) { showToast('موجودی تنخواه کافی نیست', 'error'); return; }
    onConfirm();
    showToast((kind === 'avatar' ? 'آواتار' : 'تم رنگی') + ' با موفقیت خریداری شد ✅', 'success');
    closeModal();
  };
  return (
    <div className="p-4 flex flex-col items-center">
      {imgSrc && <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-[var(--aw-border)]"><img src={imgSrc} alt="" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 18%' }} /></div>}
      {swatch && <div className="w-20 h-20 rounded-2xl mb-3" style={{ background: swatch, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }} />}
      <div className="text-[15px] mb-1" style={{ fontWeight: 800 }}>{label}</div>
      <div className="text-[12px] text-[var(--aw-text-muted)] mb-4">برای استفاده باید این مورد را خریداری کنید</div>
      <div className="w-full rounded-2xl border border-[var(--aw-border)] p-3.5 mb-3" style={{ background: 'var(--aw-bg-card)' }}>
        <div className="flex justify-between items-center mb-1.5 text-[13px]"><span className="text-[var(--aw-text-secondary)]">قیمت</span><span style={{ fontWeight: 800, color: 'var(--aw-primary)', direction: 'ltr' }}>{fmt(price)} تومان</span></div>
        <div className="flex justify-between items-center text-[12px]"><span className="text-[var(--aw-text-secondary)]">موجودی تنخواه</span><span style={{ fontWeight: 700, color: enough ? 'var(--aw-text-primary)' : 'var(--aw-danger)', direction: 'ltr' }}>{fmt(walletBalance)} تومان</span></div>
      </div>
      <button onClick={buy} className="w-full py-3 rounded-[12px] border-none cursor-pointer text-white text-[14px]" style={{ background: enough ? 'var(--aw-primary)' : 'var(--aw-border)', fontWeight: 700 }}>
        <i className="fa-solid fa-bag-shopping ml-1.5" /> {enough ? 'پرداخت و خرید' : 'موجودی ناکافی'}
      </button>
    </div>
  );
}

function hexToRgb(hex: string) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hsl(h: number, s: number, l: number) { return `hsl(${h}, ${s}%, ${Math.max(0, Math.min(100, l))}%)`; }

// Build the full CSS override block for a given accent hex.
function buildAccentCSS(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const sat = Math.max(s, 70);
  const dark = hsl(h, sat, Math.max(l - 16, 14));
  const light = hsl(h, sat, Math.min(l + 16, 88));
  const bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const rot = Math.round(h - 258); // chat-pattern source art is purple (~258°)
  const iconRot = Math.round(h - 248); // designed PNG/SVG icons share a ~248° base hue
  const tint = hsl(h, Math.min(sat, 42), 96); // very-light accent-harmonized page bg (light/glass only)
  return `
  .neura-admin {
    --aw-primary: ${hex} !important; --aw-primary-dark: ${dark} !important; --aw-primary-light: ${light} !important; --aw-primary-bg: ${bg} !important;
    --aw-accent: ${hex} !important; --aw-eu-primary: ${hex} !important; --aw-eu-primary-dark: ${dark} !important;
    --aw-bubble-sent: linear-gradient(135deg, ${light}, ${dark}) !important; --aw-bubble-sent-solid: ${hex} !important;
  }
  [data-theme="light"] .neura-admin, [data-theme="glass"] .neura-admin { --aw-bg-app: ${tint} !important; --aw-eu-bg: ${tint} !important; }
  [data-theme="light"] .aw-glass-bg.admin-bg, [data-theme="glass"] .aw-glass-bg.admin-bg { background: ${tint} !important; }
  .aw-glass-bg.admin-bg .blob-1 { background: ${hsl(h, Math.min(sat, 58), 72)} !important; }
  .aw-glass-bg.admin-bg .blob-2 { background: ${hsl(h, Math.min(sat, 40), 90)} !important; }
  .aw-glass-bg.admin-bg .blob-3 { background: ${hsl(h, Math.min(sat, 62), 66)} !important; }
  .aw-glass-bg.admin-bg .blob-4 { background: ${hsl((h + 14) % 360, Math.min(sat, 46), 78)} !important; }
  .aw-glass-bg.admin-bg .blob-5 { background: ${hsl((h + 346) % 360, Math.min(sat, 38), 88)} !important; }
  .aw-glass-bg.admin-bg .blob-6 { background: linear-gradient(135deg, ${hsl(h, Math.min(sat, 55), 70)}, ${hsl((h + 14) % 360, Math.min(sat, 45), 82)}) !important; }
  [data-theme="dark"] .aw-glass-bg.admin-bg .blob-1 { background: ${hsl(h, sat, 58)} !important; }
  [data-theme="dark"] .aw-glass-bg.admin-bg .blob-2 { background: ${hsl(h, sat, 52)} !important; }
  [data-theme="dark"] .aw-glass-bg.admin-bg .blob-3 { background: ${dark} !important; }
  [data-theme="dark"] .aw-glass-bg.admin-bg .blob-4 { background: ${hsl(h, sat, 60)} !important; }
  [data-theme="dark"] .aw-glass-bg.admin-bg .blob-5 { background: ${hex} !important; }
  [data-theme="dark"] .aw-glass-bg.admin-bg .blob-6 { background: linear-gradient(135deg, ${dark}, ${hex}) !important; }
  .neura-admin .aw-chat-pattern::before { filter: hue-rotate(${rot}deg) saturate(1.25) !important; }
  [data-theme="dark"].neura-admin .aw-chat-pattern::before,
  .neura-admin[data-theme="dark"] .aw-chat-pattern::before { filter: invert(1) hue-rotate(${rot + 180}deg) brightness(1.1) saturate(1.25) !important; }
  .neura-admin .nav-icon-img { filter: hue-rotate(${iconRot}deg) saturate(1.2) !important; }
  [data-theme="dark"] .neura-admin .nav-icon-img { filter: hue-rotate(${iconRot}deg) saturate(1.2) brightness(1.12) !important; }
  .neura-admin .letter-avatar { filter: hue-rotate(${iconRot}deg) saturate(1.12) !important; }
  `;
}

// Same accent overrides but scoped to the embedded personal-assistant panel
// (which has no .neura-admin wrapper). Themes every var-driven color + the
// wallet/nav-icon/chat patterns when the assistant's accent changes.
function buildAsstAccentCSS(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const sat = Math.max(s, 70);
  const dark = hsl(h, sat, Math.max(l - 16, 14));
  const light = hsl(h, sat, Math.min(l + 16, 88));
  const bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const rot = Math.round(h - 258);
  const iconRot = Math.round(h - 248);
  const tint = hsl(h, Math.min(sat, 42), 96);
  return `
  .neura-asst {
    --aw-primary: ${hex} !important; --aw-primary-dark: ${dark} !important; --aw-primary-light: ${light} !important; --aw-primary-bg: ${bg} !important;
    --aw-accent: ${hex} !important; --aw-eu-primary: ${hex} !important; --aw-eu-primary-dark: ${dark} !important; --aw-eu-primary-light: ${light} !important;
    --aw-bubble-sent: linear-gradient(135deg, ${light}, ${dark}) !important; --aw-bubble-sent-solid: ${hex} !important;
  }
  [data-theme="light"] .neura-asst, [data-theme="glass"] .neura-asst { --aw-bg-app: ${tint} !important; --aw-eu-bg: ${tint} !important; }
  [data-theme="light"] .neura-asst .aw-glass-bg, [data-theme="glass"] .neura-asst .aw-glass-bg { background: ${tint} !important; }
  .neura-asst .aw-chat-pattern::before { filter: hue-rotate(${rot}deg) saturate(1.25) !important; }
  [data-theme="dark"] .neura-asst .aw-chat-pattern::before { filter: invert(1) hue-rotate(${rot + 180}deg) brightness(1.1) saturate(1.25) !important; }
  .neura-asst .nav-icon-img { filter: hue-rotate(${iconRot}deg) saturate(1.2) !important; }
  [data-theme="dark"] .neura-asst .nav-icon-img { filter: hue-rotate(${iconRot}deg) saturate(1.2) brightness(1.12) !important; }
  .neura-asst .letter-avatar { filter: hue-rotate(${iconRot}deg) saturate(1.12) !important; }
  `;
}


// Designed icon-pack mapping for agent teams
const TEAM_ICON_SRC: Record<string, string> = {
  secretary: '/src/icons/png/secretary.png',
  marketing: '/src/icons/png/marketing.png',
  finance: '/src/icons/png/finance.png',
  procurement: '/src/icons/png/logistics.png',
  sales: '/src/icons/png/seller-cashier.png',
};
// Default per-agent portraits — shown from first launch even before the user
// buys/changes an avatar. Keyed by agent id; unknown ids fall back by gender.
const DEFAULT_AGENT_PORTRAIT: Record<string, string> = {
  marketing: '/src/avatars/fw1.png',
  secretary: '/src/avatars/fw2.png',
  restaurant: '/src/avatars/fw3.png',
  support: '/src/avatars/fw4.png',
  marketing_beta: '/src/avatars/fw5.png',
  sales: '/src/avatars/m1.png',
  finance: '/src/avatars/m2.png',
  procurement: '/src/avatars/m3.png',
  assistant: '/src/avatars/m4.png',
  sales_beta: '/src/avatars/m5.png',
};
function defaultPortrait(agent: { id?: string; gender?: string }): string {
  if (agent.id && DEFAULT_AGENT_PORTRAIT[agent.id]) return DEFAULT_AGENT_PORTRAIT[agent.id];
  return agent.gender === 'm' ? '/src/avatars/m6.png' : '/src/avatars/fw6.png';
}
// Renders an agent's saved photo avatar if set, else a default portrait (per role)
function AgentCircle({ agent, size, radius, fontSize, className = '', style = {} }: { agent: { avatar?: string; bg: string; init: string; id?: string; gender?: string }; size: number; radius: number; fontSize?: number; className?: string; style?: React.CSSProperties }) {
  const photo = agent.avatar || defaultPortrait(agent);
  if (photo) {
    return (
      <div className={`flex-shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size, borderRadius: radius, ...style }}>
        <img src={photo} alt="" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 18%' }} draggable={false} />
      </div>
    );
  }
  return (
    <LetterAvatar init={agent.init} name={agent.init} size={size} className={className} style={style} />
  );
}
// Designed icon-pack mapping for footer nav screens
const NAV_ICON_SRC: Record<string, string> = {
  mktActionsScreen: '/src/icons/svg2/tasks.svg',
  mktCrmScreen: '/src/icons/svg2/audience.svg',
  mktConversationsScreen: '/src/icons/png/chat.png',
  chatsScreen: '/src/icons/png/chat.png',
  salesConversationsScreen: '/src/icons/png/chat.png',
  campaignScreen: '/src/icons/png/marketing.png',
  mktLeadsScreen: '/src/icons/svg2/audience.svg',
  mktSegmentScreen: '/src/icons/svg2/audience.svg',
  mktPerformanceScreen: '/src/icons/png/reports-charts.png',
  secPlanningScreen: '/src/icons/png/calendar.png',
  secTodayScreen: '/src/icons/png/home.png',
  secCrmLiteScreen: '/src/icons/svg2/audience.svg',
  secPerformanceScreen: '/src/icons/png/reports-charts.png',
  secDailyFinanceScreen: '/src/icons/svg2/coins.svg',
  dashboardScreen: '/src/icons/svg2/dashboard.svg',
  financeScreen: '/src/icons/png/wallet.png',
  reportsScreen: '/src/icons/svg2/invoice.svg',
  tasksScreen: '/src/icons/svg2/tasks.svg',
  procRequestsScreen: '/src/icons/svg2/requests.svg',
  procOrdersScreen: '/src/icons/svg2/orders.svg',
  procDeliveryScreen: '/src/icons/svg2/delivery2.svg',
  procSupplyScreen: '/src/icons/svg2/orders.svg',
  inventoryScreen: '/src/icons/svg2/warehouse2.svg',
  procFinanceScreen: '/src/icons/svg2/coins.svg',
  salesOrdersScreen: '/src/icons/svg2/orders.svg',
  salesInvoicesScreen: '/src/icons/svg2/invoice.svg',
  salesMenuScreen: '/src/icons/png/shop-market.png',
  salesCustomersScreen: '/src/icons/svg2/audience.svg',
  salesQuickReportScreen: '/src/icons/png/reports-charts.png',
};
// Designed icon-pack mapping for notification glyphs (keeps notifications consistent with the rest of the app)
export const NOTIF_ICON_SRC: Record<string, string> = {
  'fa-solid fa-bullhorn': '/src/icons/png/marketing.png',
  'fa-solid fa-file-invoice-dollar': '/src/icons/svg2/invoice.svg',
  'fa-solid fa-user-plus': '/src/icons/svg2/audience.svg',
  'fa-solid fa-chart-bar': '/src/icons/png/reports-charts.png',
  'fa-solid fa-calendar-check': '/src/icons/png/calendar.png',
  'fa-solid fa-utensils': '/src/icons/png/shop-market.png',
  'fa-solid fa-robot': '/src/icons/svg2/assistant.svg',
};
function NavIcon({ id, fa, size, active }: { id: string; fa: string; size: number; active?: boolean }) {
  const src = NAV_ICON_SRC[id];
  if (src) return <img src={src} alt="" className="nav-icon-img" style={{ width: size + 4, height: size + 4, objectFit: 'contain', filter: active ? 'brightness(0) opacity(0.72)' : undefined }} />;
  return <i className={fa} style={{ fontSize: size, color: active ? 'color-mix(in srgb, var(--aw-primary) 82%, black)' : undefined }} />;
}

// ========================
// MOTION VARIANTS
// ========================
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// Custom RTL-friendly Recharts tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] px-3 py-2 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-modal)', direction: 'rtl', boxShadow: 'var(--aw-shadow-sm)' }}>
      <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-[12px] flex items-center gap-1.5" style={{ color: p.color, fontWeight: 600 }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {toFa(p.value)}
        </div>
      ))}
    </div>
  );
}

// ========================
// HEADER
// ========================
function TeamSelectionScreen() {
  const { setAgentTeam, setAdminScreen } = useApp();
  const teams = Object.values(TEAM_CONFIGS);

  return (
    <div className="flex flex-col h-full items-center justify-center" style={{ background: 'var(--aw-bg-app)' }}>
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <img src="/src/assets/neura-logo-blue.png" alt="Neura" className="neura-logo h-10 w-auto object-contain" style={{ filter: 'var(--aw-logo-filter)' }} />
        <span className="text-[24px] text-[var(--aw-text-primary)] font-[Neogrey]" style={{ fontWeight: 700 }}>neura</span>
      </div>

      <p className="text-[13px] text-[var(--aw-text-secondary)] mb-8">تیم عامل هوشمند خود را انتخاب کنید</p>

      {/* Thumbnail Grid */}
      <div className="flex flex-wrap justify-center gap-5 md:gap-8 px-6 max-w-[480px]">
        {teams.map((team, i) => (
          <motion.button
            key={team.id}
            className="flex flex-col items-center gap-2.5 bg-transparent border-none cursor-pointer group"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
            onClick={() => {
              setAgentTeam(team.id);
              setAdminScreen(team.navItems[0]?.id || 'chatsScreen');
            }}
          >
            <motion.div
              className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[22px] flex items-center justify-center text-white text-[28px] md:text-[32px]"
              style={{ background: team.gradient, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}
              whileHover={{ scale: 1.1, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }}
              whileTap={{ scale: 0.92 }}
            >
              <i className={team.icon} />
            </motion.div>
            <span className="text-[12px] text-[var(--aw-text-secondary)] group-hover:text-[var(--aw-text-primary)] transition-colors" style={{ fontWeight: 600 }}>
              {team.name}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Agent selector */}
      <div className="mt-10 flex justify-center">
        <AgentSelector />
      </div>
    </div>
  );
}

// ========================
// HEADER
// ========================
function AdminHeader() {
  const { company, setCompany, companies, openModal, agentTeam, theme, setAdminScreen, setAppStage } = useApp();
  const [companyOpen, setCompanyOpen] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!companyOpen) return;
    const onDown = (e: PointerEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [companyOpen]);

  return (
    <header className="flex-shrink-0 relative" style={{ background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 40 }}>
      {/* Progressive blur band (mobile) — heavy blur in the mid transition band, tinted to the team accent */}
      <div aria-hidden className="md:hidden" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[
          { b: 2, m: 'linear-gradient(to top, #000 0%, #000 8%, transparent 22%)' },
          { b: 6, m: 'linear-gradient(to top, transparent 8%, #000 20%, #000 32%, transparent 46%)' },
          { b: 14, m: 'linear-gradient(to top, transparent 20%, #000 34%, #000 46%, transparent 60%)' },
          { b: 26, m: 'linear-gradient(to top, transparent 32%, #000 46%, #000 60%, transparent 74%)' },
          { b: 32, m: 'linear-gradient(to top, transparent 46%, #000 60%, #000 74%, transparent 88%)' },
          { b: 20, m: 'linear-gradient(to top, transparent 62%, #000 78%)' },
        ].map((l, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, backdropFilter: `blur(${l.b}px)`, WebkitBackdropFilter: `blur(${l.b}px)`, maskImage: l.m, WebkitMaskImage: l.m }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-primary) 22%, var(--aw-bg-app)) 0%, color-mix(in srgb, var(--aw-primary) 22%, var(--aw-bg-app)) 40%, color-mix(in srgb, var(--aw-primary) 16%, transparent) 62%, color-mix(in srgb, var(--aw-primary) 7%, transparent) 82%, transparent 100%)' }} />
      </div>
      {/* Mobile: personal-panel style top row — logo left, icons right */}
      <div className="flex items-center relative md:hidden px-[16px] pt-[40px] pb-[8px]" style={{ zIndex: 1 }}>
        <button onClick={() => setAppStage('home')} className="flex items-center gap-[3px] flex-1 bg-transparent border-none cursor-pointer p-0">
          <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Neogrey', 'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 16, color: 'var(--aw-text-primary)' }}>neura</span>
        </button>

        {/* Company / workspace switcher — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[36px]">
          <div ref={companyRef} className="relative flex items-center gap-1">
            <button onClick={() => setCompanyOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] cursor-pointer border"
              style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', color: 'var(--aw-text-primary)' }}>
              <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 15, height: 15, objectFit: 'contain', flexShrink: 0 }} />
              <span className="text-[12px] max-w-[110px] truncate" style={{ fontWeight: 600 }}>{companies[company]?.name}</span>
              <i className={`fa-solid fa-chevron-down text-[8px] text-[var(--aw-text-muted)] transition-transform ${companyOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {companyOpen && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setCompanyOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-[230px] rounded-[14px] overflow-hidden z-[46] p-1.5"
                    style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-primary) 16%, var(--aw-bg-modal)), var(--aw-bg-modal))', border: '1px solid color-mix(in srgb, var(--aw-primary) 30%, var(--aw-border))', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', top: '100%' }}>
                    <div className="px-2.5 py-1.5 text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 700 }}>فضای کاری / شرکت‌ها</div>
                    {Object.entries(companies).map(([k, v]) => {
                      const active = k === company;
                      return (
                        <button key={k} onClick={() => { setCompany(k); setCompanyOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] cursor-pointer border-none text-right transition-colors"
                          style={{ background: active ? 'var(--aw-primary-bg)' : 'transparent' }}>
                          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: v.logo ? 'transparent' : (active ? 'var(--aw-eu-primary)' : 'var(--aw-bg-input)'), color: active ? '#fff' : 'var(--aw-text-secondary)' }}>
                            {v.logo ? <img src={v.logo} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-building text-[12px]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] truncate" style={{ fontWeight: 600, color: 'var(--aw-text-primary)' }}>{v.name}</div>
                            <div className="text-[10px] text-[var(--aw-text-muted)]">{v.type}</div>
                          </div>
                          {active && <i className="fa-solid fa-circle-check text-[13px]" style={{ color: 'var(--aw-eu-primary)' }} />}
                        </button>
                      );
                    })}
                    <button onClick={() => { setCompanyOpen(false); openModal('افزودن شرکت', <AddCompanyContent />); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2.5 mt-1 rounded-[10px] cursor-pointer border border-dashed text-right transition-colors"
                      style={{ borderColor: 'var(--aw-border)', background: 'transparent' }}>
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-eu-primary)' }}>
                        <i className="fa-solid fa-plus text-[12px]" />
                      </div>
                      <span className="text-[12.5px]" style={{ fontWeight: 600, color: 'var(--aw-eu-primary)' }}>افزودن شرکت جدید</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-[14px]">
          <button className="w-[26px] h-[26px] bg-transparent border-none cursor-pointer flex items-center justify-center p-0"
            style={{ color: 'var(--aw-eu-primary)', fontSize: 16 }} onClick={() => openModal('جستجو', <SearchContent />)}>
            <span aria-hidden style={{ display: 'block', width: 25, height: 25, background: 'var(--aw-eu-primary)', WebkitMaskImage: 'url("/src/icons/search.svg")', maskImage: 'url("/src/icons/search.svg")', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskSize: 'contain', maskSize: 'contain' }} />
          </button>
          <button className="w-[20px] h-[20px] bg-transparent border-none cursor-pointer flex items-center justify-center p-0 relative"
            style={{ color: 'var(--aw-text-secondary)', fontSize: 16 }} onClick={() => openModal('اعلان‌ها', <NotificationsContent />)}>
            <img src="/src/icons/png/bell.png" alt="" className="nav-icon-img" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            <span className="absolute top-[1px] right-[1px] w-[7px] h-[7px] rounded-full" style={{ background: '#FF4D4D', border: '1.5px solid rgba(255,255,255,0.9)' }} />
          </button>
          <button className="w-[20px] h-[20px] bg-transparent border-none cursor-pointer flex items-center justify-center p-0"
            style={{ color: 'var(--aw-text-primary)', fontSize: 16 }} onClick={() => openModal('تنظیمات', <MoreScreenModal />)}>
            <img src="/src/icons/png/setting.png" alt="" className="nav-icon-img" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </button>
        </div>
      </div>

      {/* Desktop: logo + team name (right) / search + bell + company (left) */}
      <div className="hidden md:flex items-center px-6 pt-3 pb-2 gap-2 border-b border-[var(--aw-border)]">
        <div className="flex items-center gap-2 flex-1">
          <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
          <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
            {agentTeam === 'assistant' ? 'دستیار شخصی' : agentTeam ? TEAM_CONFIGS[agentTeam]?.name : 'مدیریت'}
          </span>
        </div>
        <div className="relative flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
          <LetterAvatar name={COMPANIES[company]?.name} size={18} radius={5} style={{ fontSize: 10 }} />
          <span className="text-[11px] text-[var(--aw-text-primary)] max-w-[80px] truncate" style={{ fontWeight: 600 }}>{COMPANIES[company]?.name.split(' ').slice(-1)[0]}</span>
          <i className="fa-solid fa-chevron-down text-[8px] text-[var(--aw-text-muted)]" />
          <select className="absolute inset-0 opacity-0 cursor-pointer text-base" value={company} onChange={(e) => setCompany(e.target.value)}>
            {Object.entries(COMPANIES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <HeaderBtn icon="fa-solid fa-search" onClick={() => openModal('جستجو', <SearchContent />)} />
        <HeaderBtn icon="fa-solid fa-bell" badge={3} onClick={() => openModal('اعلان‌ها', <NotificationsContent />)} />
      </div>
    </header>
  );
}

function HeaderBtn({ icon, badge, onClick }: { icon: string; badge?: number; onClick?: () => void }) {
  return (
    <button
      className="w-[38px] h-[38px] rounded-[10px] bg-transparent border-none text-[var(--aw-text-secondary)] text-base cursor-pointer relative flex items-center justify-center transition-all hover:text-[var(--aw-primary)]"
      onClick={onClick}
    >
      <i className={icon} />
      {badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[10px]" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
          {toFa(badge)}
        </span>
      )}
    </button>
  );
}

function PhonePersonnelForm({ onAdd }: { onAdd: (name: string, phone: string) => void }) {
  const { showToast } = useApp();
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const ist: any = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 10, padding: '10px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand','Vazirmatn',sans-serif" };
  const search = async () => {
    const p = String(phone || '').trim(); if (!p) { showToast('شماره موبایل را وارد کنید'); return; }
    setBusy(true); setName(''); setDone(false);
    try { const r: any = await (api as any).lookupUserByPhone(p); if (r && r.found) { setName(r.name || ''); setDone(true); } else { showToast('این شماره با شاهکار ثبت‌نام نکرده است'); } }
    catch (_e) { showToast('خطا در جستجو'); }
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11.5px] text-[var(--aw-text-muted)] leading-6">فقط افرادی که با شاهکار ثبت‌نام کرده‌اند قابلِ افزودن‌اند. شمارهٔ موبایل را جستجو کنید؛ نام به‌صورتِ خودکار می‌آید و قابل ویرایش نیست.</div>
      <div className="flex gap-2">
        <input style={ist} inputMode="numeric" dir="ltr" placeholder="شماره موبایل" value={phone} onChange={e => { setPhone(e.target.value); setDone(false); setName(''); }} />
        <button type="button" onClick={search} disabled={busy} className="px-4 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{busy ? '...' : 'جستجو'}</button>
      </div>
      {done && (
        <div className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <div className="text-[10px] text-[var(--aw-text-muted)] mb-1 flex items-center gap-1"><i className="fa-solid fa-shield-halved text-[9px]" style={{ color: '#10B981' }} />نام و نام‌خانوادگی (از شاهکار — غیرقابل ویرایش)</div>
          <input style={{ ...ist, opacity: 0.9 }} value={name} readOnly disabled />
          <button type="button" onClick={() => { if (String(name).trim()) onAdd(String(name).trim(), String(phone).trim()); }} className="w-full mt-3 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: '#10B981', fontWeight: 700 }}>افزودن پرسنل</button>
        </div>
      )}
    </div>
  );
}

export function RoleSwitcher() {
  const { role, setRole, setBriefingSeen, theme } = useApp();
  const isGlass = theme === 'glass' || theme === 'dark';

  if (isGlass) {
    return (
      <div
        className="flex gap-[3px] p-[3px] rounded-[9999px] border"
        style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 4px rgba(46,134,255,0.2)' }}
      >
        {(['user', 'admin'] as const).map((r) => (
          <button
            key={r}
            className="flex-1 border-none rounded-[100px] cursor-pointer transition-all"
            style={role === r
              ? { background: 'var(--aw-eu-primary, #7B62FC)', color: '#fff', fontWeight: 700, padding: '7px 12px', fontSize: 12, boxShadow: 'inset 2px 2px 1px rgba(255,255,255,0.45), 2px 4px 4px rgba(0,0,0,0.25)' }
              : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 500, padding: '7px 12px', fontSize: 12 }}
            onClick={() => { setRole(r); if (r === 'admin') setBriefingSeen(true); }}
          >
            {r === 'admin' ? 'پنل مدیریت' : 'پنل شخصی'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 p-1 mx-4 mb-1.5 rounded-[10px]" style={{ background: 'var(--aw-bg-card)' }}>
      {(['admin', 'user'] as const).map((r) => (
        <button
          key={r}
          className={`flex-1 py-1.5 px-2 border-none rounded-lg text-[12px] cursor-pointer transition-all ${
            role === r ? 'text-white shadow-md' : 'bg-transparent text-[var(--aw-text-muted)]'
          }`}
          style={role === r ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 600, boxShadow: '0 2px 10px rgba(46,134,255,0.3)' } : { fontWeight: 600 }}
          onClick={() => { setRole(r); if (r === 'admin') setBriefingSeen(true); }}
        >
          {r === 'admin' ? 'پنل مدیریت' : 'پنل شخصی'}
        </button>
      ))}
    </div>
  );
}

// ========================
// AGENT SELECTOR — unified dropdown: دستیار شخصی + management teams
// (replaces the panel toggle; switches role + active team)
// ========================
export function AgentSelector() {
  const { role, setRole, agentTeam, setAgentTeam, setAdminScreen, setBriefingSeen } = useApp();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const trigRef = useRef<HTMLButtonElement>(null);
  const order: TeamKey[] = ['secretary', 'marketing', 'finance', 'procurement', 'sales', 'dine'];
  const ASSISTANT_ICON = '/src/icons/svg2/assistant.svg';
  const options: { key: string; name: string; desc: string; icon: string }[] = [
    { key: 'assistant', name: 'دستیار شخصی', desc: 'دستیار هوشمند شخصی شما', icon: ASSISTANT_ICON },
    ...order.map(k => ({ key: k, name: TEAM_CONFIGS[k].name, desc: TEAM_CONFIGS[k].desc, icon: TEAM_ICON_SRC[k] || ASSISTANT_ICON })),
  ];
  const currentKey = role === 'user' ? 'assistant' : (agentTeam || 'assistant');
  const current = options.find(o => o.key === currentKey) || options[0];
  // Blue (business) side ⇒ tint the portalled icons blue to match the .neura-admin scope they escape.
  const blueTheme = role === 'admin' && agentTeam !== 'assistant';

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = trigRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    setOpen(true);
  };

  const pick = (key: string) => {
    setOpen(false);
    if (key === 'assistant') {
      // Personal assistant is now a first-class member of the management panel:
      // stay in the admin shell and render the full personal (EU) experience
      // inside it. role stays 'admin'; AdminPanel branches on agentTeam.
      setBriefingSeen(true);
      setAgentTeam('assistant');
      setRole('admin');
      return;
    }
    setBriefingSeen(true);
    setAgentTeam(key as TeamKey);
    const cfg = TEAM_CONFIGS[key as TeamKey];
    if (cfg?.navItems?.[0]) setAdminScreen(cfg.navItems[0].id as AdminScreen);
    setRole('admin');
  };

  return (
    <div className="relative" style={{ zIndex: 40 }}>
      <button
        ref={trigRef}
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-full border cursor-pointer transition-all"
        style={{
          height: 36,
          padding: '0 12px',
          background: 'var(--aw-eu-nav-bg, rgba(255,255,255,0.2))',
          borderColor: 'var(--aw-eu-nav-border, rgba(255,255,255,0.5))',
          backdropFilter: 'blur(14px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 2px 10px rgba(0,0,0,0.16)',
        }}
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src={current.icon} alt="" className="nav-icon-img" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        </span>
        <span className="text-[12px] whitespace-nowrap" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{current.name}</span>
        <i className="fa-solid fa-chevron-down text-[9px]" style={{ color: 'var(--aw-text-secondary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {open && menuPos && createPortal(
        <div className={blueTheme ? 'neura-admin' : undefined} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)}>
          <motion.div
            className="w-[224px] rounded-2xl overflow-hidden p-1.5"
            onClick={(e: any) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: menuPos.top,
              right: menuPos.right,
              background: 'color-mix(in srgb, var(--aw-bg-modal) 96%, transparent)',
              border: '1px solid var(--aw-border)',
              backdropFilter: 'blur(28px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
              zIndex: 9999,
            }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
          >
            {options.map(o => {
              const isActive = o.key === currentKey;
              return (
                <button
                  key={o.key}
                  onClick={() => pick(o.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer transition-all text-right"
                  style={{ background: isActive ? 'var(--aw-primary-bg)' : 'transparent' }}
                >
                  <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={o.icon} alt="" className="nav-icon-img" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{o.name}</span>
                    <span className="block text-[10px] truncate" style={{ color: 'var(--aw-text-muted)' }}>{o.desc}</span>
                  </span>
                  {isActive && <i className="fa-solid fa-check text-[12px]" style={{ color: 'var(--aw-eu-primary)' }} />}
                </button>
              );
            })}
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ========================
// TEAM ICON BAR (small icons for quick team switching)
// ========================
function TeamIconBar() {
  const { agentTeam, setAgentTeam, setAdminScreen, setRole, setBriefingSeen } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const teamOrder: TeamKey[] = ['secretary', 'marketing', 'finance', 'procurement', 'sales', 'dine'];
  const teams = teamOrder.map(k => TEAM_CONFIGS[k]);
  const activeTeam = agentTeam ? TEAM_CONFIGS[agentTeam] : null;

  // Collapsed: show only the active agent + an expand button (saves vertical space)
  if (collapsed && activeTeam) {
    return (
      <div className="flex items-center justify-center gap-2 mx-4 mb-2 py-1.5">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[12px]" style={{ background: activeTeam.gradient }}>
            <i className={activeTeam.icon} />
          </div>
          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{activeTeam.name}</span>
          <button className="w-6 h-6 rounded-full bg-transparent border-none cursor-pointer text-[var(--aw-text-muted)] text-[11px]" title="نمایش همه عامل‌ها" onClick={() => setCollapsed(false)}>
            <i className="fa-solid fa-chevron-down" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mx-4 mb-2 py-2 relative">
      {activeTeam && (
        <button className="absolute left-1 top-1 w-6 h-6 rounded-full bg-transparent border-none cursor-pointer text-[var(--aw-text-muted)] text-[11px]" title="جمع کردن نوار عامل‌ها" onClick={() => setCollapsed(true)}>
          <i className="fa-solid fa-chevron-up" />
        </button>
      )}
      {teams.map((team) => {
        const active = agentTeam === team.id;
        return (
          <button
            key={team.id}
            title={team.name}
            className="relative flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer p-0 group"
            style={{ width: 56 }}
            onClick={() => {
              setAgentTeam(team.id);
              setAdminScreen(team.navItems[0]?.id || 'chatsScreen');
              setRole('admin');
              setBriefingSeen(true);
            }}
          >
            <div
              className={`w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-white text-[17px] transition-all ${
                active ? '' : 'opacity-50 hover:opacity-90'
              }`}
              style={{
                background: team.gradient,
                boxShadow: active ? '0 0 0 2px var(--aw-bg-app), 0 0 0 3.5px var(--aw-primary), 0 3px 12px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <i className={team.icon} />
            </div>
            <span className={`text-[10px] transition-colors whitespace-nowrap ${active ? 'text-[var(--aw-text-primary)]' : 'text-[var(--aw-text-muted)]'}`} style={{ fontWeight: active ? 700 : 500 }}>
              {team.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ========================
// NAV ITEMS (shared between bottom nav & desktop sidebar)
// ========================
const ADMIN_NAV_ITEMS: { id: AdminScreen; icon: string; label: string }[] = [
  { id: 'chatsScreen', icon: 'fa-solid fa-comments', label: 'گفتگوها' },
  { id: 'dashboardScreen', icon: 'fa-solid fa-th-large', label: 'داشبورد' },
  { id: 'crmScreen', icon: 'fa-solid fa-users', label: 'CRM' },
  { id: 'financeScreen', icon: 'fa-solid fa-wallet', label: 'مالی' },
  { id: 'tasksScreen', icon: 'fa-solid fa-list-check', label: 'وظایف' },
  { id: 'reportsScreen', icon: 'fa-solid fa-chart-bar', label: 'گزارش‌ها' },
];

// ========================
// BOTTOM NAV (mobile only)
// ========================
// Map detail/sub-screens to the footer parent that should stay highlighted
const NAV_PARENT: Partial<Record<AdminScreen, AdminScreen>> = {
  mktApprovalsScreen: 'mktConversationsScreen',
  mktCalendarScreen: 'campaignScreen',
  salesInvoicesScreen: 'salesOrdersScreen',
  salesPosScreen: 'salesOrdersScreen',
  salesShiftScreen: 'salesQuickReportScreen',
};

function AdminNav() {
  const { adminScreen, setAdminScreen, agentTeam, company, companies } = useApp();
  const baseNav = agentTeam ? TEAM_CONFIGS[agentTeam]?.navItems || ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const navItems = applyProductsLabel(baseNav, companies[company]?.type);
  const activeId = NAV_PARENT[adminScreen] || adminScreen;

  return (
    <div
      className="flex-shrink-0 md:hidden px-3"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingTop: 4 }}
    >
      <nav
        className="flex items-center rounded-[1000px]"
        style={{
          background: 'color-mix(in srgb, var(--aw-primary) 10%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          boxShadow: 'inset 0 0 2.6px rgba(255,255,255,0.25)',
          padding: 5,
        }}
      >
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              className="flex-1 flex flex-col items-center gap-[2px] border-none cursor-pointer transition-all relative rounded-[100px]"
              style={{
                padding: '6px 2px',
                minWidth: 0,
                flexBasis: 0,
                background: isActive ? 'color-mix(in srgb, var(--aw-primary) 15%, transparent)' : 'transparent',
                color: isActive ? 'var(--aw-primary)' : 'var(--aw-text-secondary)',
                fontWeight: isActive ? 800 : 500,
                boxShadow: isActive ? 'inset 0 0 3px rgba(255,255,255,0.55)' : 'none',
                backdropFilter: isActive ? 'blur(4px)' : undefined,
                WebkitBackdropFilter: isActive ? 'blur(4px)' : undefined,
              }}
              onClick={() => setAdminScreen(item.id)}
            >
              <NavIcon id={item.id} fa={item.icon} size={14} active={isActive} />
              <span style={{ fontSize: 8, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ========================
// DESKTOP SIDEBAR (collapsible — expanded / icon-only)
// ========================
function AdminSidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { adminScreen, setAdminScreen, company, setCompany, companies, openModal, openUnifiedCall, agentTeam } = useApp();
  const navItems = applyProductsLabel(getTeamNavItems(agentTeam), companies[company]?.type);
  const w = expanded ? 240 : 68;

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 border-l border-[var(--aw-border)] h-full overflow-hidden"
      style={{
        width: w, minWidth: w,
        background: 'var(--aw-bg-card)',
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Logo row + toggle button */}
      <div className="flex items-center px-2 py-3 border-b border-[var(--aw-border)]" style={{ minHeight: 56 }}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
              <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
              <span className="text-[16px] text-[var(--aw-text-primary)] font-[Neogrey] whitespace-nowrap" style={{ fontWeight: 700 }}>neura</span>
            </div>
            <button
              className="w-[32px] h-[32px] rounded-[10px] bg-transparent border-none text-[var(--aw-text-muted)] text-[13px] cursor-pointer flex items-center justify-center flex-shrink-0 transition-all hover:text-[var(--aw-primary)] hover:bg-[var(--aw-bg-card-hover)]"
              onClick={onToggle}
              title="کوچک کردن منو"
            >
              <i className="fa-solid fa-angles-right" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <img src={neuraLogo} alt="Neura" className="neura-logo" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
            <button
              className="w-[30px] h-[30px] rounded-[8px] bg-transparent border-none text-[var(--aw-text-muted)] text-[12px] cursor-pointer flex items-center justify-center transition-all hover:text-[var(--aw-primary)] hover:bg-[var(--aw-bg-card-hover)]"
              onClick={onToggle}
              title="باز کردن منو"
            >
              <i className="fa-solid fa-angles-left" />
            </button>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 aw-scroll">
        {navItems.map((item) => {
          const isActive = (NAV_PARENT[adminScreen] || adminScreen) === item.id;
          return (
            <button
              key={item.id}
              title={!expanded ? item.label : undefined}
              className={`w-full flex items-center gap-3 mb-1 border-none rounded-[10px] cursor-pointer transition-all text-[13px] relative ${
                expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
              } ${isActive ? 'text-white' : 'bg-transparent text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)]'}`}
              style={isActive ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 600, boxShadow: '0 2px 10px rgba(46,134,255,0.3)' } : { fontWeight: 500 }}
              onClick={() => setAdminScreen(item.id)}
            >
              <i className={`${item.icon} ${expanded ? 'w-5' : 'w-full'} text-center text-[15px]`} />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={`py-3 border-t border-[var(--aw-border)] space-y-1.5 ${expanded ? 'px-3' : 'px-2'}`}>
        <button title={!expanded ? 'تماس‌ها' : undefined} className={`w-full flex items-center gap-3 py-2.5 border-none rounded-[10px] cursor-pointer transition-all text-[13px] bg-transparent text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)] ${expanded ? 'px-3' : 'px-0 justify-center'}`} style={{ fontWeight: 500 }} onClick={openUnifiedCall}>
          <i className={`fa-solid fa-phone ${expanded ? 'w-5' : 'w-full'} text-center text-[var(--aw-secondary)]`} />
          {expanded && <span>تماس‌ها</span>}
        </button>
        <button title={!expanded ? 'تنظیمات' : undefined} className={`w-full flex items-center gap-3 py-2.5 border-none rounded-[10px] cursor-pointer transition-all text-[13px] bg-transparent text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)] ${expanded ? 'px-3' : 'px-0 justify-center'}`} style={{ fontWeight: 500 }} onClick={() => openModal('تنظیمات', <MoreScreenModal />)}>
          <i className={`fa-solid fa-cog ${expanded ? 'w-5' : 'w-full'} text-center`} />
          {expanded && <span>تنظیمات</span>}
        </button>
      </div>

      {/* Agent selector (expanded only) */}
      {expanded && (
        <div className="px-3 pb-3"><AgentSelector /></div>
      )}
    </aside>
  );
}

// ========================
// NEW GROUP CHAT CONTENT (global, not tied to category)
// ========================
function NewGroupChatContent() {
  const { agents, personnel, customers, company, addGroupChat, closeModal, showToast, agentTeam, openChat, openModal } = useApp();
  const [chatName, setChatName] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [listTab, setListTab] = useState<'mine' | 'others'>('mine');
  const [selected, setSelected] = useState<{ id: string; type: 'agent' | 'personnel' | 'customer'; name: string; init: string; bg: string }[]>([]);

  const companyAgents = agents.filter(a => !a.company || a.company === company).filter(a => !a.locked);
  const allItems = [
    ...companyAgents.map(a => ({ id: a.id, type: 'agent' as const, name: a.name, sub: a.role, init: a.init, bg: a.bg })),
    ...personnel.map(p => ({ id: p.id, type: 'personnel' as const, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' })),
    ...customers.map(c => ({ id: c.id, type: 'customer' as const, name: c.name, sub: c.contact, init: c.name[0], bg: 'bg-emerald-500' })),
  ];
  const filtered = allItems
    .filter(i => listTab === 'mine' ? (i.type === 'agent' || i.type === 'personnel') : i.type === 'customer')
    .filter(i => !searchQ || i.name.includes(searchQ) || i.sub.includes(searchQ));

  const isSelected = (id: string, type: string) => selected.some(s => s.id === id && s.type === type);
  const toggle = (it: { id: string; type: 'agent' | 'personnel' | 'customer'; name: string; init: string; bg: string }) => {
    setSelected(prev => isSelected(it.id, it.type)
      ? prev.filter(s => !(s.id === it.id && s.type === it.type))
      : [...prev, { id: it.id, type: it.type, name: it.name, init: it.init, bg: it.bg }]);
  };

  const BG_OPTIONS = ['bg-violet-600', 'bg-pink-500', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];

  const submit = () => {
    if (!chatName.trim()) { showToast('نام گروه را وارد کنید'); return; }
    if (selected.length < 2) { showToast('حداقل ۲ عضو انتخاب کنید'); return; }
    const id = 'gc_' + Date.now();
    addGroupChat({
      id,
      name: chatName.trim(),
      bg: BG_OPTIONS[Math.floor(Math.random() * BG_OPTIONS.length)],
      memberIds: selected.map(s => ({ id: s.id, type: s.type })),
      team: agentTeam || null,
    });
    showToast('چت گروهی ایجاد شد');
    closeModal();
    setTimeout(() => openChat(id, 'group'), 150);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1.5 block" style={{ fontWeight: 600 }}>نام گروه</label>
        <input
          className="w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
          placeholder="مثلاً: تیم پروژه..."
          value={chatName}
          onChange={(e) => setChatName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1.5 block" style={{ fontWeight: 600 }}>مخاطبین</label>
        <div
          className="w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-[10px] px-3 py-2.5 text-[13px] cursor-pointer flex items-center justify-between gap-2"
          onClick={() => setSelectOpen(o => !o)}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-h-[20px]">
            {selected.length === 0 && <span className="text-[var(--aw-text-muted)]">انتخاب مخاطبین...</span>}
            {selected.map(s => (
              <span key={s.type + s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-white" style={{ background: 'var(--aw-primary, #2E86FF)' }}>
                {s.name}
                <button className="border-none bg-transparent text-white cursor-pointer text-[10px] p-0 leading-none"
                  onClick={(e) => { e.stopPropagation(); toggle({ id: s.id, type: s.type, name: s.name, init: s.init, bg: s.bg }); }}>
                  <i className="fa-solid fa-times" />
                </button>
              </span>
            ))}
          </div>
          <i className={`fa-solid fa-chevron-${selectOpen ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)]`} />
        </div>
        {selectOpen && (
          <div className="mt-1.5 border border-[var(--aw-border)] rounded-[10px] overflow-hidden" style={{ background: 'var(--aw-bg-card)' }}>
            <div className="flex gap-1 p-1.5 border-b border-[var(--aw-border)]">
              {([{ id: 'mine', label: 'شرکت من' }, { id: 'others', label: 'سایرین' }] as const).map(t => (
                <button key={t.id} onClick={() => setListTab(t.id)} className="flex-1 py-1.5 rounded-lg border-none cursor-pointer text-[11.5px]" style={listTab === t.id ? { background: 'var(--aw-primary)', color: '#fff', fontWeight: 700 } : { background: 'var(--aw-bg-input)', color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{t.label}</button>
              ))}
            </div>
            <input
              className="w-full bg-transparent border-b border-[var(--aw-border)] px-3 py-2 text-[12px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
              placeholder="جستجو..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              autoFocus
            />
            {listTab === 'mine' && (
              <button onClick={() => openModal('افزودن پرسنل جدید', <QuickForm submitLabel="افزودن پرسنل" toast="پرسنل جدید افزوده شد" fields={[{ key: 'name', label: 'نام و نام خانوادگی' }, { key: 'role', label: 'سمت' }, { key: 'phone', label: 'شماره تماس' }]} />)}
                className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer border-none border-b border-[var(--aw-border)] bg-transparent text-right hover:bg-[var(--aw-bg-card-hover)]">
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)' }}><i className="fa-solid fa-user-plus text-[11px]" /></div>
                <span className="text-[12px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>افزودن پرسنل جدید</span>
              </button>
            )}
            <div className="max-h-[240px] overflow-y-auto aw-scroll">
              {listTab === 'mine' && filtered.some(i => i.type === 'agent') && (
                <div className="px-3 pt-2 pb-1 text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 700 }}>عامل‌های من (My Agents)</div>
              )}
              {filtered.length === 0 && (
                <div className="text-center py-4 text-[var(--aw-text-muted)] text-[12px]">یافت نشد</div>
              )}
              {filtered.map(it => {
                const sel = isSelected(it.id, it.type);
                return (
                  <div key={it.type + it.id}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--aw-bg-card-hover)]"
                    onClick={() => toggle(it)}>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] flex-shrink-0 ${it.bg}`} style={{ fontWeight: 700 }}>{it.init}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px]" style={{ fontWeight: 600 }}>{it.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] truncate">{it.sub}</div>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${sel ? 'text-white' : ''}`}
                      style={{ background: sel ? 'var(--aw-primary)' : 'var(--aw-bg-input)', border: sel ? 'none' : '1px solid var(--aw-border)' }}>
                      {sel && <i className="fa-solid fa-check text-[8px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <button
        className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px]"
        style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}
        onClick={submit}
      >
        <i className="fa-solid fa-check ml-1.5" />
        ایجاد چت گروهی
      </button>
    </div>
  );
}

// ========================
// RENAME CATEGORY
// ========================
function RenameCategoryContent({ group }: { group: ChatGroup }) {
  const { updateChatGroup, closeModal, showToast } = useApp();
  const [name, setName] = useState(group.name);
  const submit = () => {
    if (!name.trim()) { showToast('نام معتبر وارد کنید'); return; }
    updateChatGroup(group.id, { name: name.trim() });
    showToast('نام دسته‌بندی تغییر یافت');
    closeModal();
  };
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[12px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>نام دسته‌بندی</label>
      <input
        className="w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <button
        className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px]"
        style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}
        onClick={submit}
      >
        ذخیره
      </button>
    </div>
  );
}

// ========================
// ADD CHAT TO CATEGORY
// ========================
function AddChatToCategoryContent({ group }: { group: ChatGroup }) {
  const { agents, personnel, customers, company, updateChatGroup, closeModal, showToast } = useApp();
  const [searchQ, setSearchQ] = useState('');
  const [selected, setSelected] = useState<{ id: string; type: 'agent' | 'personnel' | 'customer' }[]>([]);

  const isMember = (id: string, type: string) => group.members.some(m => m.id === id && m.type === type);
  const isSelected = (id: string, type: string) => selected.some(s => s.id === id && s.type === type);

  const companyAgents = agents.filter(a => !a.company || a.company === company).filter(a => !a.locked);
  const allItems = [
    ...companyAgents.map(a => ({ id: a.id, type: 'agent' as const, name: a.name, sub: a.role, init: a.init, bg: a.bg })),
    ...personnel.map(p => ({ id: p.id, type: 'personnel' as const, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' })),
    ...customers.map(c => ({ id: c.id, type: 'customer' as const, name: c.name, sub: c.contact, init: c.name[0], bg: 'bg-emerald-500' })),
  ].filter(i => !isMember(i.id, i.type));

  const filtered = allItems.filter(i => !searchQ || i.name.includes(searchQ) || i.sub.includes(searchQ));

  const toggle = (id: string, type: 'agent' | 'personnel' | 'customer') => {
    setSelected(prev => prev.some(s => s.id === id && s.type === type)
      ? prev.filter(s => !(s.id === id && s.type === type))
      : [...prev, { id, type }]);
  };

  const submit = () => {
    if (selected.length === 0) { showToast('چتی انتخاب نشده'); return; }
    updateChatGroup(group.id, { members: [...group.members, ...selected] });
    showToast(toFa(selected.length) + ' چت اضافه شد');
    closeModal();
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        className="w-full bg-[var(--aw-bg-input)] border border-[var(--aw-border)] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
        placeholder="جستجو..."
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
      />
      <div className="max-h-[300px] overflow-y-auto aw-scroll flex flex-col gap-1">
        {filtered.length === 0 && (
          <div className="text-center py-6 text-[var(--aw-text-muted)] text-[12px]">چتی برای افزودن نیست</div>
        )}
        {filtered.map(it => {
          const sel = isSelected(it.id, it.type);
          return (
            <div
              key={it.type + '_' + it.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-[10px] cursor-pointer transition-all border ${sel ? 'border-[var(--aw-primary)]' : 'border-transparent'}`}
              style={{ background: sel ? 'rgba(126,95,170,0.12)' : 'var(--aw-bg-input)' }}
              onClick={() => toggle(it.id, it.type)}
            >
              <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 ${it.bg}`} style={{ fontWeight: 700 }}>
                {it.init}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px]" style={{ fontWeight: 600 }}>{it.name}</div>
                <div className="text-[11px] text-[var(--aw-text-muted)] truncate">{it.sub}</div>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${sel ? 'text-white' : ''}`} style={{ background: sel ? 'var(--aw-primary)' : 'var(--aw-bg-card)', border: sel ? 'none' : '1px solid var(--aw-border)' }}>
                {sel && <i className="fa-solid fa-check text-[10px]" />}
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px]"
        style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}
        onClick={submit}
      >
        افزودن {selected.length > 0 && '(' + toFa(selected.length) + ')'}
      </button>
    </div>
  );
}

// ========================
// NEW GROUP CONTENT (for + button modal)
// ========================
function NewGroupContent() {
  const { agents, personnel, customers, company, addChatGroup, setChatTab, closeModal, showToast, agentTeam } = useApp();
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<{ id: string; type: 'agent' | 'personnel' | 'customer' }[]>([]);
  const [searchQ, setSearchQ] = useState('');

  const companyAgents = agents.filter(a => !a.company || a.company === company).filter(a => !a.locked);

  const allItems: { id: string; type: 'agent' | 'personnel' | 'customer'; name: string; sub: string; init: string; bg: string }[] = [
    ...companyAgents.map(a => ({ id: a.id, type: 'agent' as const, name: a.name, sub: a.role, init: a.init, bg: a.bg })),
    ...personnel.map(p => ({ id: p.id, type: 'personnel' as const, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' })),
    ...customers.map(c => ({ id: c.id, type: 'customer' as const, name: c.name, sub: c.contact, init: c.name[0], bg: 'bg-emerald-500' })),
  ];

  const filtered = allItems.filter(i => !searchQ || i.name.includes(searchQ) || i.sub.includes(searchQ));

  const toggleSelect = (id: string, type: 'agent' | 'personnel' | 'customer') => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === id && s.type === type);
      if (exists) return prev.filter(s => !(s.id === id && s.type === type));
      return [...prev, { id, type }];
    });
  };

  const isSelected = (id: string, type: string) => selected.some(s => s.id === id && s.type === type);

  const handleCreate = () => {
    if (!groupName.trim()) { showToast('لطفاً نام دسته‌بندی را وارد کنید'); return; }
    if (selected.length === 0) { showToast('لطفاً حداقل یک چت انتخاب کنید'); return; }
    const group: ChatGroup = {
      id: 'grp_' + Date.now(),
      name: groupName.trim(),
      members: selected,
      team: agentTeam || null,
    };
    addChatGroup(group);
    setChatTab(group.id);
    closeModal();
    showToast('دسته‌بندی «' + groupName.trim() + '» ایجاد شد');
  };

  return (
    <div className="flex flex-col gap-4 max-h-[70vh]">
      {/* Group Name */}
      <div>
        <label className="block text-[12px] text-[var(--aw-text-muted)] mb-1.5">نام دسته‌بندی جدید</label>
        <input
          className="w-full bg-transparent border border-[var(--aw-border)] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
          style={{ background: 'var(--aw-bg-input)' }}
          placeholder="مثلاً: مشتریان VIP"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          autoFocus
        />
      </div>

      {/* Select Chats */}
      <div>
        <label className="block text-[12px] text-[var(--aw-text-muted)] mb-1.5">
          افزودن چت‌ها به این گروه
          {selected.length > 0 && <span className="mr-1 text-[var(--aw-primary)]">({toFa(selected.length)} انتخاب شده)</span>}
        </label>
        <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)] mb-2" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input
            className="flex-1 bg-transparent border-none py-2 text-[12px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="جستجو در مخاطبین..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto max-h-[40vh] aw-scroll rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          {filtered.length === 0 && (
            <div className="text-center py-6 text-[var(--aw-text-muted)] text-[12px]">موردی یافت نشد</div>
          )}
          {filtered.map(item => (
            <button
              key={item.type + '_' + item.id}
              className="w-full flex items-center gap-3 p-2.5 border-none cursor-pointer transition-all bg-transparent text-right"
              style={{
                borderBottom: '1px solid var(--aw-border)',
                background: isSelected(item.id, item.type) ? 'rgba(126,95,170,0.15)' : 'transparent'
              }}
              onClick={() => toggleSelect(item.id, item.type)}
            >
              <div className="relative">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 ${item.bg}`} style={{ fontWeight: 700, fontSize: 13 }}>
                  {item.init}
                </div>
                {isSelected(item.id, item.type) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white" style={{ background: 'var(--aw-primary, #2E86FF)' }}>
                    <i className="fa-solid fa-check" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[var(--aw-text-primary)] truncate">{item.name}</div>
                <div className="text-[11px] text-[var(--aw-text-muted)] truncate">{item.sub}</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
                background: item.type === 'agent' ? 'rgba(126,95,170,0.2)' : item.type === 'personnel' ? 'rgba(59,130,246,0.2)' : 'rgba(0,230,118,0.2)',
                color: item.type === 'agent' ? '#9F8DC6' : item.type === 'personnel' ? '#3B82F6' : '#00E676',
              }}>
                {item.type === 'agent' ? 'عامل' : item.type === 'personnel' ? 'پرسنل' : 'مشتری'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Button */}
      <button
        className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px] transition-all"
        style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600, opacity: groupName.trim() && selected.length > 0 ? 1 : 0.5 }}
        onClick={handleCreate}
      >
        <i className="fa-solid fa-folder-plus ml-2" />
        ایجاد گروه ({toFa(selected.length)} عضو)
      </button>
    </div>
  );
}

// ========================
// CHATS SCREEN
// ========================
const TEAM_SAMPLE_CHATS: Record<TeamKey, { id: string; name: string; init: string; bg: string; lastMsg: string; time: string; unread: number; tag: string }[]> = {
  secretary: [],
  marketing: [],
  finance: [],
  procurement: [],
  sales: [],
};

const SearchHighlightContext = createContext<string>('');

function Hi({ text }: { text: string }) {
  const q = useContext(SearchHighlightContext).trim();
  if (!q || !text) return <>{text}</>;
  const idx = text.indexOf(q);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255,210,0,0.45)', color: 'inherit', borderRadius: 3, padding: '0 1px' }}>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

interface PeerChatMsg { from: string; text: string; time: string; }
interface PersonnelPeerChat {
  id: string;
  members: string[];
  isGroup: boolean;
  title?: string;
  lastMsg: string;
  time: string;
  unread: number;
  bg: string;
  transcript: PeerChatMsg[];
}

const PERSONNEL_PEER_CHATS_BY_TEAM: Record<TeamKey, PersonnelPeerChat[]> = {
  secretary: [],
  marketing: [],
  finance: [],
  procurement: [],
  sales: [],
};

function PersonnelPeerChatViewer({ chat, personnel }: { chat: PersonnelPeerChat; personnel: any[] }) {
  const memberNames = chat.members.map(id => personnel.find(p => p.id === id)?.name || id);
  return (
    <div className="flex flex-col" style={{ maxHeight: '70vh' }}>
      <div className="px-1 pb-3 border-b border-[var(--aw-border)] mb-3">
        <div className="text-[13px] mb-1" style={{ fontWeight: 600 }}>
          {chat.isGroup ? chat.title : memberNames.join(' و ')}
        </div>
        <div className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1.5">
          <i className="fa-solid fa-eye" />
          فقط مشاهده — {chat.isGroup ? `${toFa(chat.members.length)} نفر` : 'گفتگوی دونفره'}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto aw-scroll space-y-2 pb-2">
        {chat.transcript.map((m, i) => {
          const sender = personnel.find(p => p.id === m.from);
          return (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 bg-[var(--aw-primary)]" style={{ fontWeight: 700 }}>
                {sender?.name?.[0] || '؟'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[var(--aw-text-muted)] mb-0.5 flex items-center gap-1.5">
                  <span style={{ fontWeight: 600 }}>{sender?.name || m.from}</span>
                  <span>·</span>
                  <span>{m.time}</span>
                </div>
                <div className="text-[12px] rounded-[10px] p-2.5 inline-block border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--aw-border)] text-[11px] text-[var(--aw-text-muted)] text-center flex items-center justify-center gap-1.5">
        <i className="fa-solid fa-lock" />
        دسترسی ادمین فقط خواندنی است — امکان ارسال پیام وجود ندارد
      </div>
    </div>
  );
}


function ChatsScreen() {
  const { chatTab, setChatTab, agents, personnel, customers, company, openChat, openModal, chatGroups, removeChatGroup, updateChatGroup, showToast, agentTeam, startCall, groupChats, removeGroupChat } = useApp();
  const [search, setSearch] = useState('');
  const [hiddenBaseTabs, setHiddenBaseTabs] = useState<Record<string, string[]>>({});
  const listScrollRef = useRef<HTMLDivElement>(null);
  const [spyTab, setSpyTab] = useState('customers');
  // WhatsApp-style conversation filters + favorites
  const [favChats, setFavChats] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('ADMIN_CHAT_FAVS') || 'null') || []; } catch { return []; } });
  const toggleFav = (k: string) => setFavChats(prev => { const next = prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]; try { localStorage.setItem('ADMIN_CHAT_FAVS', JSON.stringify(next)); } catch {} showToast(prev.includes(k) ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد'); return next; });
  const AGG_FILTERS = ['all', 'calls', 'unread', 'favorites', 'groups'];
  const isCustomGroupTab = chatGroups.some(g => g.id === chatTab);
  const isAgg = chatTab !== 'meetings' && !isCustomGroupTab;
  const passes = (key: string, unread: number, isGroup: boolean, callable: boolean) => {
    if (chatTab === 'unread') return unread > 0;
    if (chatTab === 'favorites') return favChats.includes(key);
    if (chatTab === 'groups') return isGroup;
    if (chatTab === 'calls') return false;
    return true;
  };
  // Row wrapper: adds a favorite-star toggle beside any conversation row
  const FavRow = ({ fk, children }: { fk: string; children: React.ReactNode }) => {
    const fav = favChats.includes(fk);
    return (
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0">{children}</div>
        <button
          title={fav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
          onClick={(e) => { e.stopPropagation(); toggleFav(fk); }}
          className="w-8 flex-shrink-0 flex items-center justify-center bg-transparent border-none cursor-pointer text-[13px] transition-all hover:scale-110"
          style={{ color: fav ? '#F5B301' : 'var(--aw-text-muted)', opacity: fav ? 1 : 0.5 }}
        >
          <i className={fav ? 'fa-solid fa-star' : 'fa-regular fa-star'} />
        </button>
      </div>
    );
  };
  const onListScroll = () => {
    const sc = listScrollRef.current;
    if (!sc || chatTab !== 'all') return;
    const markers = sc.querySelectorAll('[data-cat]');
    const topY = sc.getBoundingClientRect().top;
    let current = '';
    markers.forEach(m => {
      const r = (m as HTMLElement).getBoundingClientRect();
      if (r.top - topY <= 72) current = (m as HTMLElement).getAttribute('data-cat') || current;
    });
    if (current && current !== spyTab) setSpyTab(current);
  };
  const teamScope = agentTeam || '_none';
  const hiddenForTeam = hiddenBaseTabs[teamScope] || [];
  const hideBaseTab = (id: string) => {
    setHiddenBaseTabs(prev => ({ ...prev, [teamScope]: [...(prev[teamScope] || []), id] }));
    if (chatTab === id) setChatTab('all');
    showToast('دسته‌بندی حذف شد');
  };

  const allBaseTabs: { id: string; label: string; icon?: string }[] = [
    { id: 'all', label: 'همه', icon: 'fa-solid fa-layer-group' },
    { id: 'calls', label: 'تماس‌ها', icon: 'fa-solid fa-phone' },
    { id: 'unread', label: 'نخوانده‌ها', icon: 'fa-solid fa-envelope' },
    { id: 'favorites', label: 'مورد علاقه‌ها', icon: 'fa-solid fa-star' },
    { id: 'groups', label: 'گروه‌ها', icon: 'fa-solid fa-users' },
    ...(agentTeam === 'secretary' ? [{ id: 'meetings', label: 'جلسات', icon: 'fa-solid fa-handshake' }] : []),
  ];
  const baseTabs = allBaseTabs.filter(t => !hiddenForTeam.includes(t.id));

  const teamGroups = chatGroups.filter(g => (g.team || null) === (agentTeam || null));
  const allTabs = [...baseTabs, ...teamGroups.map(g => ({ id: g.id, label: g.name, icon: 'fa-solid fa-folder' as string }))];

  const filteredAgents = agents
    .filter(a => !a.company || a.company === company)
    .filter(a => !search || a.name.includes(search) || a.role.includes(search));

  const filteredPersonnel = personnel.filter(p => !search || p.name.includes(search) || p.role.includes(search));
  const filteredCustomers = customers.filter(c => !search || c.name.includes(search) || c.contact.includes(search));

  const teamKey = (agentTeam as TeamKey | null) || null;
  // Interactions visibility (option A): the secretary is a coordination hub — it aggregates
  // business interactions from every team EXCEPT the four specialized domains, whose contacts
  // are handled inside those agents. (Assistant shows only personal chats, handled separately.)
  const SEC_EXCLUDED_TEAMS: TeamKey[] = ['marketing', 'sales', 'finance', 'procurement'];
  const teamSamples = teamKey === 'secretary'
    ? (Object.keys(TEAM_SAMPLE_CHATS) as TeamKey[]).filter(k => !SEC_EXCLUDED_TEAMS.includes(k)).flatMap(k => TEAM_SAMPLE_CHATS[k])
    : (teamKey ? TEAM_SAMPLE_CHATS[teamKey] : null);
  const teamConfig = teamKey ? TEAM_CONFIGS[teamKey] : null;
  const filteredTeamSamples = teamSamples?.filter(s => !search || s.name.includes(search) || s.lastMsg.includes(search) || s.tag.includes(search)) || [];

  // Find current group if active tab is a custom group
  const activeGroup = chatGroups.find(g => g.id === chatTab);

  // Get members for a group
  const getGroupMembers = (group: ChatGroup) => {
    return group.members.map(m => {
      if (m.type === 'agent') {
        const a = agents.find(x => x.id === m.id);
        return a ? { ...m, name: a.name, sub: a.role, init: a.init, bg: a.bg } : null;
      }
      if (m.type === 'personnel') {
        const p = personnel.find(x => x.id === m.id);
        return p ? { ...m, name: p.name, sub: p.role, init: p.name[0], bg: 'bg-blue-500' } : null;
      }
      if (m.type === 'customer') {
        const c = customers.find(x => x.id === m.id);
        return c ? { ...m, name: c.name, sub: c.contact, init: c.name[0], bg: 'bg-emerald-500' } : null;
      }
      return null;
    }).filter(Boolean);
  };

  const handleDeleteGroup = (groupId: string) => {
    removeChatGroup(groupId);
    setChatTab('all');
    showToast('گروه حذف شد');
  };

  return (
    <SearchHighlightContext.Provider value={search}>
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-4 pb-2.5 flex-shrink-0">
        <div className="flex gap-1 p-[4px] rounded-full overflow-x-auto aw-noscroll border items-center" style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
          {allTabs.map(t => {
            const knownIds = allTabs.map(x => x.id);
            const isActive = chatTab === t.id || (t.id === 'all' && !knownIds.includes(chatTab) && chatTab !== 'meetings');
            const isCustomGroup = teamGroups.some(g => g.id === t.id);
            return (
              <div
                key={t.id}
                className={`flex-shrink-0 flex items-center rounded-full transition-all ${isActive ? '' : 'bg-transparent text-[var(--aw-text-secondary)]'}`}
                style={isActive ? { background: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 45%, transparent)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' } : undefined}
              >
                <button
                  className="pr-3 pl-3 py-1.5 text-center border-none bg-transparent text-inherit text-[11px] cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  style={{ fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}
                  onClick={() => setChatTab(chatTab === t.id ? 'all' : t.id)}
                >
                  {t.icon && <i className={`${t.icon} text-[10px] ${isActive ? '' : 'opacity-70'}`} />}
                  {t.label}
                </button>
              </div>
            );
          })}
          {/* Add category (+) */}
          <button
            title="افزودن دسته‌بندی"
            onClick={() => openModal('دسته‌بندی جدید', <NewGroupContent />)}
            className="flex-shrink-0 w-[28px] h-[28px] rounded-full border-none cursor-pointer flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'color-mix(in srgb, var(--aw-primary) 16%, transparent)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 35%, transparent)' }}
          >
            <i className="fa-solid fa-plus text-[11px]" />
          </button>
        </div>
      </div>

      {/* Group header with delete option */}
      {activeGroup && (
        <div className="px-4 pb-2 flex-shrink-0 flex items-center justify-between">
          <span className="text-[12px] text-[var(--aw-text-muted)]">
            <i className="fa-solid fa-folder-open ml-1 text-[var(--aw-primary)]" />
            {toFa(activeGroup.members.length)} عضو
          </span>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <button
              className="bg-transparent border-none text-[11px] text-[var(--aw-primary)] cursor-pointer flex items-center gap-1 hover:opacity-80 transition-all"
              onClick={() => openModal('افزودن چت', <AddChatToCategoryContent group={activeGroup} />)}
            >
              <i className="fa-solid fa-user-plus text-[10px]" />
              افزودن چت
            </button>
            <button
              className="bg-transparent border-none text-[11px] text-[var(--aw-primary)] cursor-pointer flex items-center gap-1 hover:opacity-80 transition-all"
              onClick={() => openModal('تغییر نام دسته‌بندی', <RenameCategoryContent group={activeGroup} />)}
            >
              <i className="fa-solid fa-pen text-[10px]" />
              تغییر نام
            </button>
            <button
              className="bg-transparent border-none text-[11px] text-red-400 cursor-pointer flex items-center gap-1 hover:text-red-300 transition-all"
              onClick={() => handleDeleteGroup(activeGroup.id)}
            >
              <i className="fa-solid fa-trash text-[10px]" />
              حذف گروه
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input
            className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="جستجوی گفتگو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer text-sm" onClick={() => setSearch('')}>
              <i className="fa-solid fa-times" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div ref={listScrollRef} onScroll={onListScroll} className="flex-1 overflow-y-auto px-3 pb-4 aw-scroll">
        {/* New Chat / Group / Meeting Button */}
        {chatTab === 'meetings' && agentTeam === 'secretary' ? (
          <button
            className="w-full flex items-center gap-3 p-3 mb-2 rounded-[10px] border border-dashed border-[var(--aw-border)] cursor-pointer transition-all bg-transparent hover:border-[var(--aw-primary)] group"
            onClick={() => openModal('برگزاری جلسه', <NewMeetingContent />)}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all" style={{ background: 'rgba(126,95,170,0.15)' }}>
              <i className="fa-solid fa-calendar-plus text-[var(--aw-primary)] text-sm" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-[13px] text-[var(--aw-text-primary)] group-hover:text-[var(--aw-primary)] transition-all">برگزاری جلسه</div>
              <div className="text-[11px] text-[var(--aw-text-muted)]">برنامه‌ریزی جلسه حضوری یا آنلاین</div>
            </div>
            <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)] group-hover:text-[var(--aw-primary)] transition-all" />
          </button>
        ) : (isAgg && chatTab !== 'calls') ? (
          <button
            className="w-full flex items-center gap-3 p-3 mb-2 rounded-[10px] border border-dashed border-[var(--aw-border)] cursor-pointer transition-all bg-transparent hover:border-[var(--aw-primary)] group"
            onClick={() => openModal('گفتگوی جدید', <NewChatContent />)}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all" style={{ background: 'rgba(126,95,170,0.15)' }}>
              <i className="fa-solid fa-plus text-[var(--aw-primary)] text-sm" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-[13px] text-[var(--aw-text-primary)] group-hover:text-[var(--aw-primary)] transition-all">ایجاد گفتگوی جدید</div>
              <div className="text-[11px] text-[var(--aw-text-muted)]">چت یا گروه جدید بسازید</div>
            </div>
            <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)] group-hover:text-[var(--aw-primary)] transition-all" />
          </button>
        ) : null}

        {/* Real call log (تماس‌ها) */}
        {chatTab === 'calls' && (() => {
          const src = [
            ...((teamSamples as any[]) || []).map((s: any) => ({ id: 'ts_' + s.id, name: s.name, init: s.init, bg: s.bg, sub: s.tag, voip: '' })),
            ...filteredAgents.map(a => ({ id: 'a_' + a.id, name: a.name, init: a.init, bg: a.bg, sub: a.role, voip: a.voip || '' })),
          ].filter(e => !search || e.name.includes(search));
          const dirs = ['out', 'in', 'missed', 'out', 'in', 'missed', 'out'];
          const times = ['۵ دقیقه پیش', '۲۰ دقیقه پیش', '۱ ساعت پیش', '۲ ساعت پیش', 'دیروز ۱۸:۳۰', 'دیروز ۱۴:۱۰', '۲ روز پیش', '۳ روز پیش'];
          const kinds = ['voice', 'voice', 'voice', 'video', 'voice', 'voice', 'video'];
          const log = src.slice(0, 10).map((b, idx) => ({ ...b, dir: dirs[idx % dirs.length], time: times[idx % times.length], kind: kinds[idx % kinds.length] }));
          if (log.length === 0) return <EmptyState icon="fa-solid fa-phone" text="تماسی یافت نشد" />;
          return (
            <div>
              <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--aw-primary)' }} /> تماس‌های اخیر
                <span className="text-[10px] text-[var(--aw-text-muted)]">({toFa(log.length)})</span>
              </div>
              {log.map(e => {
                const missed = e.dir === 'missed';
                const dirIcon = missed ? 'fa-solid fa-phone-slash' : e.dir === 'in' ? 'fa-solid fa-arrow-down-left' : 'fa-solid fa-arrow-up-right';
                const dirColor = missed ? 'var(--aw-danger)' : e.dir === 'in' ? 'var(--aw-secondary)' : 'var(--aw-text-muted)';
                return (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-[10px] mb-1 border border-transparent hover:bg-[var(--aw-bg-card-hover)] transition-all">
                    <LetterAvatar name={e.name} init={e.init} size={48} radius={14} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[13px]" style={{ fontWeight: 600, color: missed ? 'var(--aw-danger)' : undefined }}><Hi text={e.name} /></span>
                        <span className="text-[11px] text-[var(--aw-text-muted)]">{e.time}</span>
                      </div>
                      <div className="text-[11px] flex items-center gap-1.5" style={{ color: dirColor }}>
                        <i className={dirIcon + ' text-[10px]'} />
                        <span>{missed ? 'بی‌پاسخ' : e.dir === 'in' ? 'ورودی' : 'خروجی'}</span>
                        <span className="text-[var(--aw-text-muted)]">·</span>
                        <i className={(e.kind === 'video' ? 'fa-solid fa-video' : 'fa-solid fa-phone') + ' text-[9px] text-[var(--aw-text-muted)]'} />
                        <span className="text-[var(--aw-text-muted)]">{e.kind === 'video' ? 'تصویری' : 'صوتی'}</span>
                      </div>
                    </div>
                    <button onClick={() => startCall(e.name, e.sub, e.bg, e.init, e.voip)} className="w-9 h-9 rounded-[10px] border-none cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform" style={{ background: 'color-mix(in srgb, var(--aw-online) 18%, transparent)', color: 'var(--aw-online)' }} title="تماس">
                      <i className={(e.kind === 'video' ? 'fa-solid fa-video' : 'fa-solid fa-phone') + ' text-[13px]'} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Team-specific sample chats */}
        {chatTab === 'all' && <div data-cat="customers" style={{ height: 0 }} aria-hidden="true" />}
        {teamSamples && teamConfig && isAgg && (() => {
          const visTS = filteredTeamSamples.filter(s => passes('ts_' + s.id, s.unread, false, true));
          if (visTS.length === 0) return null;
          return (
          <div className="mb-3">
            <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
              <i className={teamConfig.icon} style={{ color: 'var(--aw-primary)' }} />
              نمونه‌های تیم {teamConfig.name}
              <span className="text-[10px] text-[var(--aw-text-muted)]">({toFa(visTS.length)})</span>
            </div>
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-1">
              {visTS.map(s => (
                <FavRow key={s.id} fk={'ts_' + s.id}>
                <SwipeToCall onCall={() => startCall(s.name, s.tag, s.bg, s.init, '')}>
                <div
                  className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border border-transparent hover:bg-[var(--aw-bg-card-hover)] transition-all"
                  onClick={() => openChat(s.id, 'contact', { name: s.name, init: s.init, bg: s.bg, sub: s.tag })}>
                  <LetterAvatar name={s.name} init={s.init} size={48} radius={14} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[13px]" style={{ fontWeight: 600 }}><Hi text={s.name} /></span>
                      <span className="text-[11px] text-[var(--aw-text-muted)]">{s.time}</span>
                    </div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 mb-0.5">
                      <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(126,95,170,0.15)', color: 'var(--aw-primary)', fontWeight: 700 }}>
                        <Hi text={s.tag} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] text-[var(--aw-text-secondary)] truncate flex-1"><Hi text={s.lastMsg} /></div>
                      {s.unread > 0 && (
                        <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 mr-1" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                          {toFa(s.unread)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                </SwipeToCall>
                </FavRow>
              ))}
            </div>
            {chatTab === 'all' && filteredCustomers.length > 0 && (
              <div className="text-[11px] text-[var(--aw-text-muted)] mt-2 mb-1 px-1" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-users ml-1" /> سایر تعاملات
              </div>
            )}
          </div>
          );
        })()}

        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-1">
        {chatTab === 'all' && <div data-cat="agents" style={{ height: 0, gridColumn: '1 / -1' }} aria-hidden="true" />}
        {isAgg && filteredAgents.filter(a => passes('a_' + a.id, a.unread, false, !a.locked)).map(a => (
          <FavRow key={'a_' + a.id} fk={'a_' + a.id}><AgentChatItem agent={a} /></FavRow>
        ))}
        {chatTab === 'all' && <div data-cat="personnel" style={{ height: 0, gridColumn: '1 / -1' }} aria-hidden="true" />}
        {isAgg && (() => {
          const visible = (PERSONNEL_PEER_CHATS_BY_TEAM[(agentTeam as TeamKey) || 'secretary'] || []).filter(c => {
            if (!search) return true;
            const names = c.members.map(id => personnel.find(p => p.id === id)?.name || '').join(' ');
            return c.lastMsg.includes(search) || names.includes(search) || (c.title || '').includes(search);
          });
          return visible.filter(c => passes('pp_' + c.id, c.unread, c.isGroup, !c.isGroup)).map(c => {
            const memberNames = c.members.map(id => personnel.find(p => p.id === id)?.name || id);
            const title = c.isGroup ? c.title : memberNames.join(' و ');
            return (
              <FavRow key={'pp_' + c.id} fk={'pp_' + c.id}><div
                className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer mb-1 border border-transparent hover:bg-[var(--aw-bg-card-hover)] transition-all"
                onClick={() => {
                  let msgId = 9000 + c.id.charCodeAt(0);
                  const initMsgs = c.transcript.map((m, i) => ({
                    id: msgId++,
                    text: (personnel.find(p => p.id === m.from)?.name || m.from) + ': ' + m.text,
                    sent: i % 2 === 0,
                    time: m.time,
                  }));
                  openChat('peer_' + c.id, 'contact', {
                    name: title || '',
                    init: c.isGroup ? 'گ' : (memberNames[0]?.[0] || 'پ'),
                    bg: c.bg,
                    sub: c.isGroup ? `گروه · ${toFa(c.members.length)} نفر` : 'گفتگوی پرسنل',
                  }, initMsgs);
                }}>
                <GlassTile bg={c.bg} icon={c.isGroup ? 'fa-solid fa-users' : 'fa-solid fa-comments'} size={48} radius={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[13px] truncate" style={{ fontWeight: 600 }}><Hi text={title || ''} /></span>
                    <span className="text-[11px] text-[var(--aw-text-muted)] flex-shrink-0">{c.time}</span>
                  </div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(126,95,170,0.15)', color: 'var(--aw-primary)', fontWeight: 700 }}>
                      <i className="fa-solid fa-eye text-[8px]" /> فقط مشاهده
                    </span>
                    <span>·</span>
                    <span>{c.isGroup ? `${toFa(c.members.length)} نفر` : 'دونفره'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] text-[var(--aw-text-secondary)] truncate flex-1"><Hi text={c.lastMsg} /></div>
                    {c.unread > 0 && (
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 mr-1" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                        {toFa(c.unread)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              </FavRow>
            );
          });
        })()}
        {isAgg && filteredCustomers.filter(c => passes('c_' + c.id, c.unread, false, true)).map(c => (
          <FavRow key={'c_' + c.id} fk={'c_' + c.id}><CustomerChatItem customer={c} /></FavRow>
        ))}
        {/* Global group chats (team-scoped) */}
        {(() => {
          const visibleGroupChats = groupChats.filter(g => (g.team || null) === (agentTeam || null) && (!search || g.name.includes(search))).filter(g => passes('gc_' + g.id, 0, true, false));
          if (!isAgg) return null;
          if (visibleGroupChats.length === 0) return null;
          return (
            <div className="mb-3">
              <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className="fa-solid fa-comments" style={{ color: 'var(--aw-primary)' }} />
                چت‌های گروهی
                <span className="text-[10px] text-[var(--aw-text-muted)]">({toFa(visibleGroupChats.length)})</span>
              </div>
              {visibleGroupChats.map(gc => (
                <FavRow key={gc.id} fk={'gc_' + gc.id}><div
                  className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer mb-1 border border-transparent hover:bg-[var(--aw-bg-card-hover)] transition-all"
                  onClick={() => openChat(gc.id, 'group')}>
                  {gc.image ? (
                    <div className={`w-12 h-12 rounded-[10px] flex-shrink-0 overflow-hidden ${gc.bg}`}>
                      <img src={gc.image} alt={gc.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <GlassTile bg={gc.bg} icon="fa-solid fa-users" size={48} radius={10} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]" style={{ fontWeight: 600 }}><Hi text={gc.name} /></div>
                    <div className="text-[11px] text-[var(--aw-text-muted)]">{toFa(gc.memberIds.length)} عضو</div>
                  </div>
                  <button
                    className="w-8 h-8 rounded-[10px] border-none bg-transparent text-red-400 cursor-pointer flex items-center justify-center text-[11px] flex-shrink-0 hover:text-red-300"
                    onClick={(e) => { e.stopPropagation(); removeGroupChat(gc.id); showToast('چت گروهی حذف شد'); }}
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
                </FavRow>
              ))}
            </div>
          );
        })()}
        {/* Custom group content */}
        {activeGroup && (() => {
          const members = getGroupMembers(activeGroup);
          const filteredMembers = members.filter((m: any) => !search || m.name.includes(search) || m.sub.includes(search));
          const removeMember = (memberId: string, type: string) => {
            updateChatGroup(activeGroup.id, { members: activeGroup.members.filter(mm => !(mm.id === memberId && mm.type === type)) });
            showToast('چت از دسته‌بندی حذف شد');
          };
          return filteredMembers.length > 0 ? filteredMembers.map((m: any) => {
            let inner: React.ReactNode = null;
            if (m.type === 'agent') {
              const a = agents.find(x => x.id === m.id);
              if (a) inner = <AgentChatItem agent={a} />;
            } else if (m.type === 'personnel') {
              const p = personnel.find(x => x.id === m.id);
              if (p) inner = <PersonnelChatItem person={p} />;
            } else if (m.type === 'customer') {
              const c = customers.find(x => x.id === m.id);
              if (c) inner = <CustomerChatItem customer={c} />;
            }
            if (!inner) return null;
            return (
              <div key={'grp_' + m.type + '_' + m.id} className="relative group">
                {inner}
                <button
                  title="حذف از دسته‌بندی"
                  className="absolute top-2 left-2 w-7 h-7 rounded-[10px] border-none bg-[var(--aw-bg-card)] text-red-400 cursor-pointer flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300"
                  onClick={(e) => { e.stopPropagation(); removeMember(m.id, m.type); }}
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
            );
          }) : (
            <EmptyState icon="fa-solid fa-folder-open" text="عضوی یافت نشد" />
          );
        })()}
        </div>
        {chatTab === 'meetings' && agentTeam === 'secretary' && (() => {
          const filtered = SECRETARY_MEETINGS.filter(m =>
            !search || m.title.includes(search) || m.location.includes(search) || (m.minutes || []).some(x => x.includes(search))
          );
          const inperson = filtered.filter(m => m.kind === 'inperson');
          const online = filtered.filter(m => m.kind === 'online');
          if (filtered.length === 0) {
            return <EmptyState icon="fa-solid fa-handshake" text="جلسه‌ای یافت نشد" />;
          }
          const renderSection = (title: string, icon: string, items: SecretaryMeeting[]) => items.length === 0 ? null : (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-2 text-[11px] text-[var(--aw-text-muted)]" style={{ fontWeight: 700 }}>
                <i className={icon} /> <span>{title}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-md bg-[var(--aw-bg-card)]">{toFa(items.length)}</span>
              </div>
              {items.map(m => {
                const st = MEETING_STATUS[m.status];
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all mb-1 border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
                    style={{ background: 'var(--aw-bg-card)' }}
                    onClick={() => openModal('جلسه', <MeetingViewer meeting={m} personnel={personnel} />)}
                  >
                    <GlassTile hue={m.kind === 'inperson' ? 245 : 190} icon={m.kind === 'inperson' ? 'fa-solid fa-building-user' : 'fa-solid fa-video'} size={48} radius={10} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm truncate" style={{ fontWeight: 600 }}><Hi text={m.title} /></span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap" style={{ background: st.bg, color: st.text, fontWeight: 700 }}>
                          <i className={`${st.icon} ml-1`} />{st.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-2 mb-0.5">
                        <span><i className="fa-solid fa-calendar ml-1" />{m.date}</span>
                        <span><i className="fa-solid fa-clock ml-1" />{m.time}</span>
                        <span><i className="fa-solid fa-hourglass-half ml-1" />{m.duration}</span>
                      </div>
                      <div className="text-[12px] text-[var(--aw-text-secondary)] truncate flex items-center gap-1">
                        <i className={`${m.kind === 'inperson' ? 'fa-solid fa-location-dot' : 'fa-solid fa-link'} text-[10px] opacity-70`} />
                        <Hi text={m.location} />
                        <span className="mx-1 opacity-50">•</span>
                        <i className="fa-solid fa-users text-[10px] opacity-70" />
                        <span>{toFa(m.attendees.length)} نفر</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
          return (
            <div>
              {renderSection('جلسات حضوری', 'fa-solid fa-building-user', inperson)}
              {renderSection('جلسات آنلاین', 'fa-solid fa-video', online)}
              <div className="mt-2 p-3 rounded-[12px] text-[11px] text-[var(--aw-text-secondary)] flex items-start gap-2" style={{ background: 'var(--aw-bg-card)', border: '1px dashed var(--aw-border)' }}>
                <i className="fa-solid fa-microphone-lines mt-0.5" style={{ color: 'var(--aw-primary)' }} />
                <span>منشی هوشمند در تمامی جلسات حضور دارد، گفتگوها را ثبت کرده و صورتجلسه را به صورت خودکار تهیه می‌کند.</span>
              </div>
            </div>
          );
        })()}
        {isAgg && chatTab !== 'calls' && (() => {
          const cnt =
            filteredTeamSamples.filter(s => passes('ts_' + s.id, s.unread, false, true)).length +
            filteredAgents.filter(a => passes('a_' + a.id, a.unread, false, !a.locked)).length +
            filteredCustomers.filter(c => passes('c_' + c.id, c.unread, false, true)).length +
            (PERSONNEL_PEER_CHATS_BY_TEAM[(agentTeam as TeamKey) || 'secretary'] || []).filter(c => passes('pp_' + c.id, c.unread, c.isGroup, !c.isGroup)).length +
            groupChats.filter(g => (g.team || null) === (agentTeam || null)).filter(g => passes('gc_' + g.id, 0, true, false)).length;
          if (cnt > 0) return null;
          const msg = chatTab === 'unread' ? 'گفتگوی نخوانده‌ای نیست' : chatTab === 'favorites' ? 'هنوز چتی را نشان نکرده‌اید' : chatTab === 'groups' ? 'گروهی یافت نشد' : chatTab === 'calls' ? 'تماسی یافت نشد' : 'چتی یافت نشد';
          const ic = chatTab === 'favorites' ? 'fa-regular fa-star' : chatTab === 'groups' ? 'fa-solid fa-users' : chatTab === 'calls' ? 'fa-solid fa-phone' : 'fa-solid fa-comments';
          return <EmptyState icon={ic} text={msg} />;
        })()}
      </div>
    </div>
    </SearchHighlightContext.Provider>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-12 text-[var(--aw-text-muted)]">
      <i className={`${icon} text-[56px] opacity-25 block mb-5`} />
      <p className="text-[13px]">{text}</p>
    </div>
  );
}

function AgentChatItem({ agent: a }: { agent: Agent }) {
  const { openChat, openModal, startCall } = useApp();

  if (a.locked) {
    return (
      <SwipeToCall onCall={() => startCall(a.name, a.role, a.bg, a.init, a.voip || '')}>
      <div
        className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all opacity-60"
        onClick={() => openModal('فعال‌سازی ' + a.name, <SubscribeContent agentId={a.id} />)}
      >
        <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-white flex-shrink-0 relative ${a.bg}`} style={{ fontWeight: 700, fontSize: 18 }}>
          {a.init}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-sm" style={{ fontWeight: 600 }}><Hi text={a.name} /></span>
            <span className="text-[10px] text-black px-2 py-0.5 rounded-md" style={{ background: 'var(--aw-accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <i className="fa-solid fa-lock" /> خرید اشتراک
            </span>
          </div>
          <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1">
            <i className="fa-solid fa-robot" /> <Hi text={a.role} />
          </div>
          <div className="text-[12px] text-[var(--aw-text-secondary)] truncate max-w-[200px]">{a.lastMsg}</div>
        </div>
      </div>
      </SwipeToCall>
    );
  }

  return (
    <SwipeToCall onCall={() => startCall(a.name, a.role, a.bg, a.init, a.voip || '')}>
    <div
      className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
      onClick={() => openChat(a.id, 'agent')}
    >
      <div className="relative flex-shrink-0">
        <AgentCircle agent={a} size={48} radius={14} fontSize={18} />
        <span className="absolute bottom-0.5 left-0.5 w-[13px] h-[13px] rounded-full border-2 border-[var(--aw-bg-app)]" style={{ background: 'var(--aw-online)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-sm" style={{ fontWeight: 600 }}><Hi text={a.name} /></span>
          <span className="text-[11px] text-[var(--aw-text-muted)]">{a.lastTime}</span>
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1">
          <i className="fa-solid fa-robot" /> <Hi text={a.role} /> | داخلی: {a.voip}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-[var(--aw-text-secondary)] truncate max-w-[200px]">{a.lastMsg}</span>
          {a.unread > 0 && (
            <span className="min-w-[20px] h-5 rounded-[10px] flex items-center justify-center text-white text-[11px] px-1.5" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}>
              {toFa(a.unread)}
            </span>
          )}
        </div>
      </div>
    </div>
    </SwipeToCall>
  );
}

function PersonnelChatItem({ person: p }: { person: any }) {
  const { openChat, startCall } = useApp();
  return (
    <SwipeToCall onCall={() => startCall(p.name, p.role, p.bg, p.init, p.voip || '')}>
    <div
      className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
      onClick={() => openChat(p.id, 'personnel')}
    >
      <div className="relative flex-shrink-0">
        <LetterAvatar name={p.name} init={p.init} size={48} radius={14} />
        <span className="absolute bottom-0.5 left-0.5 w-[13px] h-[13px] rounded-full border-2 border-[var(--aw-bg-app)]" style={{ background: p.status === 'online' ? 'var(--aw-online)' : 'var(--aw-offline)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-sm" style={{ fontWeight: 600 }}><Hi text={p.name} /></span>
          <span className="text-[11px] text-[var(--aw-text-muted)]">{p.lastTime}</span>
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1">
          <i className="fa-solid fa-user-tie" /> <Hi text={p.role} /> | داخلی: {p.voip} | {p.status === 'online' ? 'آنلاین' : 'آفلاین'}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-[var(--aw-text-secondary)] truncate max-w-[200px]">{p.lastMsg}</span>
          {p.unread > 0 && (
            <span className="min-w-[20px] h-5 rounded-[10px] flex items-center justify-center text-white text-[11px] px-1.5" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}>
              {toFa(p.unread)}
            </span>
          )}
        </div>
      </div>
    </div>
    </SwipeToCall>
  );
}

function CustomerChatItem({ customer: c }: { customer: Customer }) {
  const { openChat, startCall } = useApp();
  const statusColor = c.status === 'active' ? 'var(--aw-online)' : c.status === 'lead' ? '#f59e0b' : 'var(--aw-offline)';
  return (
    <SwipeToCall onCall={() => startCall(c.name, 'مشتری', c.bg, c.init, '')}>
    <div
      className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all border border-transparent hover:bg-[var(--aw-bg-card-hover)] active:scale-[0.98]"
      onClick={() => openChat(c.id, 'customer')}
    >
      <div className="relative flex-shrink-0">
        <LetterAvatar name={c.name} init={c.init} size={48} radius={14} />
        <span className="absolute bottom-0.5 left-0.5 w-[13px] h-[13px] rounded-full border-2 border-[var(--aw-bg-app)]" style={{ background: statusColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-sm" style={{ fontWeight: 600 }}><Hi text={c.name} /></span>
          <span className="text-[11px] text-[var(--aw-text-muted)]">{c.lastTime}</span>
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1">
          <i className="fa-solid fa-building" /> <Hi text={c.contact} /> | {STATUS_LABELS[c.status]}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-[var(--aw-text-secondary)] truncate max-w-[200px]">{c.lastMsg}</span>
          {c.unread > 0 && (
            <span className="min-w-[20px] h-5 rounded-[10px] flex items-center justify-center text-white text-[11px] px-1.5" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}>
              {toFa(c.unread)}
            </span>
          )}
        </div>
      </div>
    </div>
    </SwipeToCall>
  );
}

// ========================
// DASHBOARD
// ========================
function DashboardScreen() {
  __useAnalytics();
  const { agents, customers, company, personnel, setAdminScreen, setChatTab, openChat, openModal, setFinTab, setCrmTab } = useApp();
  const companyAgents = agents.filter(a => !a.locked && (!a.company || a.company === company));
  const totalDone = companyAgents.reduce((s, a) => s + a.done, 0);
  const totalPending = companyAgents.reduce((s, a) => s + a.pending, 0);
  const onlinePersonnel = personnel.filter(p => p.status === 'online').length;

  // Agent performance chart data
  const agentChartData = companyAgents.map(a => ({
    name: a.name.split(' ')[0],
    done: a.done,
    pending: a.pending,
  }));

  return (
    <motion.div className="flex-1 overflow-y-auto p-4 pb-4 aw-scroll" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp}><StatCard icon="fa-solid fa-robot" color="var(--aw-primary)" bg="rgba(46,134,255,0.15)" value={toFa(companyAgents.length)} label="عامل فعال" onClick={() => { setAdminScreen('chatsScreen'); setChatTab('agents'); }} /></motion.div>
        <motion.div variants={fadeInUp}><StatCard icon="fa-solid fa-check-circle" color="var(--aw-secondary)" bg="rgba(16,185,129,0.15)" value={toFa(totalDone)} label="کار انجام شده" onClick={() => setAdminScreen('tasksScreen')} /></motion.div>
        <motion.div variants={fadeInUp}><StatCard icon="fa-solid fa-clock" color="var(--aw-accent)" bg="rgba(245,158,11,0.15)" value={toFa(totalPending)} label="در انتظار" onClick={() => setAdminScreen('tasksScreen')} /></motion.div>
        <motion.div variants={fadeInUp}><StatCard icon="fa-solid fa-users" color="var(--aw-danger)" bg="rgba(239,68,68,0.15)" value={toFa(customers.length)} label="مشتریان" onClick={() => { setAdminScreen('crmScreen'); setCrmTab('customers'); }} /></motion.div>
      </motion.div>

      {/* Quick stats */}
      <motion.div className="rounded-[10px] p-4 mb-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }} variants={fadeInUp} initial="initial" animate="animate">
        <div className="flex justify-around text-center">
          <div className="cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded-lg" onClick={() => { setAdminScreen('chatsScreen'); setChatTab('personnel'); }}>
            <div className="text-lg text-[var(--aw-secondary)]" style={{ fontWeight: 800 }}>{toFa(onlinePersonnel)}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">پرسنل آنلاین</div>
          </div>
          <div className="w-px" style={{ background: 'var(--aw-border)' }} />
          <div className="cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded-lg" onClick={() => { setAdminScreen('chatsScreen'); setChatTab('personnel'); }}>
            <div className="text-lg text-[var(--aw-primary)]" style={{ fontWeight: 800 }}>{toFa(personnel.length)}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">کل پرسنل</div>
          </div>
          <div className="w-px" style={{ background: 'var(--aw-border)' }} />
          <div className="cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded-lg" onClick={() => openModal('شرکت‌ها', <CompanyListContent />)}>
            <div className="text-lg text-[var(--aw-accent)]" style={{ fontWeight: 800 }}>{toFa(Object.keys(COMPANIES).length)}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">شرکت‌ها</div>
          </div>
        </div>
      </motion.div>

      {/* Agent Performance Chart */}
      <DashSection title="عملکرد عامل‌ها" icon="fa-solid fa-chart-line" iconColor="var(--aw-primary)" onTitleClick={() => setAdminScreen('analyticsScreen')} actionLabel="گزارش کامل">
        <div className="w-full h-[200px] mb-3" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentChartData} barGap={4} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Bar key="bar-done-dash" dataKey="done" name="انجام شده" fill="#00E676" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar key="bar-pending-dash" dataKey="pending" name="معلق" fill="#22A6F0" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {companyAgents.map(a => (
          <div
            key={a.id}
            className="flex items-center gap-2.5 py-2 border-b border-[var(--aw-border-light)] last:border-none cursor-pointer hover:bg-[var(--aw-bg-card-hover)] rounded-lg transition-all px-1 -mx-1"
            onClick={() => openChat(a.id, 'agent')}
          >
            <AgentCircle agent={a} size={32} radius={8} fontSize={13} />
            <div className="flex-1">
              <div className="text-[12px]" style={{ fontWeight: 600 }}>{a.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{a.role}</div>
            </div>
            <div className="text-left flex items-center gap-3">
              <span className="text-[11px]"><span className="text-[var(--aw-secondary)]" style={{ fontWeight: 700 }}>{toFa(a.done)}</span> <span className="text-[var(--aw-text-muted)]">انجام</span></span>
              <span className="text-[11px]"><span className="text-[var(--aw-accent)]" style={{ fontWeight: 700 }}>{toFa(a.pending)}</span> <span className="text-[var(--aw-text-muted)]">معلق</span></span>
            </div>
            <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
          </div>
        ))}
      </DashSection>

      {/* Revenue Trend Chart */}
      <DashSection title="روند درآمد ماهانه" icon="fa-solid fa-chart-area" iconColor="var(--aw-secondary)" onTitleClick={() => { setAdminScreen('financeScreen'); setFinTab('overview'); }} actionLabel="ماژول مالی">
        <div className="w-full h-[180px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={(__ANALYTICS.monthlyRevenue || MONTHLY_REVENUE_DATA).slice(-6)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="income" name="درآمد (م)" stroke="#00E676" fill="url(#incomeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashSection>

      <DashSection title="اعلان‌های اخیر" icon="fa-solid fa-bell" iconColor="var(--aw-accent)" onTitleClick={() => openModal('اعلان‌ها', <NotificationsContent />)} actionLabel="همه اعلان‌ها">
        {NOTIFICATIONS.slice(0, 3).map(n => (
          <NotifItem key={n.id} notif={n} />
        ))}
      </DashSection>
    </motion.div>
  );
}

function CompanyListContent() {
  const { setCompany, closeModal, showToast } = useApp();
  return (
    <div>
      {Object.entries(COMPANIES).map(([key, comp]) => (
        <div
          key={key}
          className="flex items-center gap-3 p-3.5 rounded-[10px] mb-1.5 cursor-pointer border border-[var(--aw-border)] hover:border-[var(--aw-primary)] transition-all"
          style={{ background: 'var(--aw-bg-card)' }}
          onClick={() => { setCompany(key); closeModal(); showToast('شرکت ' + comp.name + ' انتخاب شد'); }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[var(--aw-primary)]" style={{ background: 'var(--aw-primary-bg)' }}>
            <i className="fa-solid fa-building text-base" />
          </div>
          <div className="flex-1">
            <div className="text-[13px]" style={{ fontWeight: 600 }}>{comp.name}</div>
            <div className="text-[11px] text-[var(--aw-text-muted)]">{comp.type || 'شرکت'}</div>
          </div>
          <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, color, bg, value, label, onClick }: { icon: string; color: string; bg: string; value: string; label: string; onClick?: () => void }) {
  return (
    <div
      className={`rounded-[10px] p-4 border border-[var(--aw-border)] transition-all ${onClick ? 'cursor-pointer hover:border-[var(--aw-primary)] hover:scale-[1.02] active:scale-[0.98]' : ''}`}
      style={{ background: 'var(--aw-bg-card)' }}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-base mb-2.5" style={{ background: bg, color }}><i className={icon} /></div>
      <div className="text-[24px] mb-0.5" style={{ fontWeight: 800 }}>{value}</div>
      <div className="text-[11px] text-[var(--aw-text-muted)]">{label}</div>
      {onClick && (
        <div className="mt-2 text-[10px] text-[var(--aw-primary)] flex items-center gap-1" style={{ fontWeight: 600 }}>
          <span>مشاهده</span>
          <i className="fa-solid fa-arrow-left text-[8px]" />
        </div>
      )}
    </div>
  );
}

function DashSection({ title, icon, iconColor, children, onTitleClick, actionLabel }: { title: string; icon: string; iconColor: string; children: React.ReactNode; onTitleClick?: () => void; actionLabel?: string }) {
  return (
    <div className="rounded-[10px] p-4 mb-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
      <div className="text-sm mb-3 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
        <i className={icon} style={{ color: iconColor }} /> {title}
        {onTitleClick && (
          <button
            className="mr-auto text-[11px] text-[var(--aw-primary)] bg-transparent border-none cursor-pointer flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ fontWeight: 600 }}
            onClick={onTitleClick}
          >
            {actionLabel || 'مشاهده همه'}
            <i className="fa-solid fa-arrow-left text-[9px]" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ========================
// CRM SCREEN
// ========================
function CrmScreen() {
  const { crmTab, setCrmTab, customers, deals, openModal } = useApp();
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'customers' as const, label: 'مشتریان' },
    { id: 'leads' as const, label: 'سرنخ‌ها' },
    { id: 'deals' as const, label: 'معاملات' },
  ];

  const filtered = customers.filter(c => !search || c.name.includes(search) || c.contact.includes(search));
  const filteredDeals = deals.filter(d => !search || d.title.includes(search) || d.customer.includes(search));

  const addLabel = { customers: 'مشتری', leads: 'سرنخ', deals: 'معامله' }[crmTab] || '';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 flex-shrink-0">
        <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: 'var(--aw-bg-card)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`flex-1 py-2 text-center border-none rounded-lg text-[12px] cursor-pointer transition-all ${
                crmTab === t.id ? 'text-white' : 'bg-transparent text-[var(--aw-text-muted)]'
              }`}
              style={crmTab === t.id ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 } : { fontWeight: 600 }}
              onClick={() => setCrmTab(t.id)}
            >
              {t.label}
              {t.id === 'leads' && <span className="mr-1 text-[10px]">({toFa(customers.filter(c => c.status === 'lead').length)})</span>}
              {t.id === 'deals' && <span className="mr-1 text-[10px]">({toFa(deals.length)})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]" placeholder="جستجو در CRM..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer text-sm" onClick={() => setSearch('')}>
              <i className="fa-solid fa-times" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll relative">
        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2.5">
        {crmTab === 'customers' && filtered.filter(c => c.status === 'active' || c.status === 'inactive').map(c => (
          <CrmCard key={c.id} customer={c} />
        ))}
        {crmTab === 'leads' && filtered.filter(c => c.status === 'lead').map(c => (
          <CrmCard key={c.id} customer={c} />
        ))}
        {crmTab === 'deals' && filteredDeals.map(d => (
          <DealCard key={d.id} deal={d} />
        ))}
        </div>
        {crmTab === 'customers' && filtered.filter(c => c.status === 'active' || c.status === 'inactive').length === 0 && (
          <EmptyState icon="fa-solid fa-users" text="مشتری‌ای یافت نشد" />
        )}
        {crmTab === 'leads' && filtered.filter(c => c.status === 'lead').length === 0 && (
          <EmptyState icon="fa-solid fa-user-plus" text="سرنخی یافت نشد" />
        )}
        {crmTab === 'deals' && filteredDeals.length === 0 && (
          <EmptyState icon="fa-solid fa-handshake" text="معامله‌ای یافت نشد" />
        )}
      </div>

      <button
        className="absolute bottom-20 left-5 w-[52px] h-[52px] rounded-full border-none text-white text-xl cursor-pointer z-40 flex items-center justify-center"
        style={{ background: 'var(--aw-primary, #2E86FF)', boxShadow: 'var(--aw-shadow)' }}
        onClick={() => openModal('افزودن ' + addLabel, <CrmAddContent />)}
      >
        <i className="fa-solid fa-plus" />
      </button>
    </div>
  );
}

function CrmCard({ customer: c }: { customer: Customer }) {
  const { openModal } = useApp();
  const statusStyle = c.status === 'active'
    ? { background: 'rgba(16,185,129,0.2)', color: '#10b981' }
    : c.status === 'lead'
    ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }
    : { background: 'rgba(100,116,139,0.2)', color: '#64748b' };

  return (
    <div
      className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
      style={{ background: 'var(--aw-bg-card)' }}
      onClick={() => openModal(c.name, <CustomerDetailContent customerId={c.id} />)}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm" style={{ fontWeight: 600 }}>{c.name}</span>
        <span className="px-2.5 py-0.5 rounded-[20px] text-[10px]" style={{ ...statusStyle, fontWeight: 600 }}>{STATUS_LABELS[c.status]}</span>
      </div>
      <div className="text-[12px] text-[var(--aw-text-secondary)] space-y-1">
        <div className="flex items-center gap-1.5"><i className="fa-solid fa-user text-[var(--aw-text-muted)]" /> {c.contact}</div>
        <div className="flex items-center gap-1.5"><i className="fa-solid fa-phone text-[var(--aw-text-muted)]" /> {c.phone}</div>
        {c.value !== '۰' && <div className="flex items-center gap-1.5"><i className="fa-solid fa-coins text-[var(--aw-accent)]" /> ارزش: {c.value} ریال</div>}
      </div>
    </div>
  );
}

function DealCard({ deal: d }: { deal: Deal }) {
  const { openModal } = useApp();
  const stageStyle: Record<string, any> = {
    negotiation: { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    proposal: { background: 'rgba(46,134,255,0.2)', color: '#2E86FF' },
    closed: { background: 'rgba(16,185,129,0.2)', color: '#10b981' },
  };

  return (
    <div
      className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
      style={{ background: 'var(--aw-bg-card)' }}
      onClick={() => openModal(d.title, <DealDetailContent dealId={d.id} />)}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm" style={{ fontWeight: 600 }}>{d.title}</span>
        <span className="px-2.5 py-0.5 rounded-[20px] text-[10px]" style={{ ...stageStyle[d.stage], fontWeight: 600 }}>{STAGE_LABELS[d.stage]}</span>
      </div>
      <div className="text-[12px] text-[var(--aw-text-secondary)] space-y-1">
        <div className="flex items-center gap-1.5"><i className="fa-solid fa-building text-[var(--aw-text-muted)]" /> {d.customer}</div>
        <div className="flex items-center gap-1.5"><i className="fa-solid fa-coins text-[var(--aw-accent)]" /> {d.value} ریال</div>
        <div className="flex items-center gap-1.5"><i className="fa-solid fa-percentage text-[var(--aw-text-muted)]" /> احتمال: {d.probability}</div>
      </div>
    </div>
  );
}

// ========================
// FINANCE SCREEN
// ========================
function FinanceScreen() {
  const { finTab, setFinTab, financeData, openModal } = useApp();

  const tabs = [
    { id: 'overview' as const, label: 'نمای کلی' },
    { id: 'income' as const, label: 'درآمدها' },
    { id: 'expense' as const, label: 'هزینه‌ها' },
    { id: 'invoices' as const, label: 'گزارش' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1.5 px-4 py-2.5 flex-wrap flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`py-2 px-3.5 rounded-[20px] border text-[11px] cursor-pointer transition-all ${
              finTab === t.id ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={finTab === t.id ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 } : { fontWeight: 600 }}
            onClick={() => setFinTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
        {finTab === 'overview' && <FinOverview />}
        {finTab === 'income' && <FinTable items={financeData.income} colorClass="var(--aw-secondary)" type="income" />}
        {finTab === 'expense' && <FinTable items={financeData.expense} colorClass="var(--aw-danger)" type="expense" />}
        {finTab === 'invoices' && <ReportsBody />}
      </div>
    </div>
  );
}

function FinOverview() {
  __useAnalytics();
  const { financeData, openModal } = useApp();
  const allItems = [...financeData.income, ...financeData.expense];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp}><FinSumCard value="۱,۰۰۰,۰۰۰,۰۰۰" label="کل درآمد (ریال)" color="var(--aw-secondary)" /></motion.div>
        <motion.div variants={fadeInUp}><FinSumCard value="۳۵۰,۰۰۰,۰۰۰" label="کل هزینه (ریال)" color="var(--aw-danger)" /></motion.div>
        <motion.div variants={fadeInUp}><FinSumCard value="—" label="سود خالص (ریال)" color="var(--aw-primary)" /></motion.div>
        <motion.div variants={fadeInUp}><FinSumCard value={toFa(financeData.income.filter(f => f.status === 'pending').length + financeData.expense.filter(f => f.status === 'pending').length)} label="فاکتور معوق" color="var(--aw-accent)" /></motion.div>
      </motion.div>

      {/* Income vs Expense Chart */}
      <DashSection title="مقایسه درآمد و هزینه" icon="fa-solid fa-chart-line" iconColor="var(--aw-secondary)">
        <div className="w-full h-[220px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={(__ANALYTICS.monthlyRevenue || MONTHLY_REVENUE_DATA)} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="finIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="finExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border-light)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="income" name="درآمد (م)" stroke="#00E676" fill="url(#finIncomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="هزینه (م)" stroke="#ef4444" fill="url(#finExpenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashSection>

      <DashSection title="آخرین تراکنش‌ها" icon="fa-solid fa-exchange-alt" iconColor="var(--aw-primary)">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>شرح</th>
                <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>دسته‌بندی</th>
                <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>مبلغ</th>
                <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>تاریخ</th>
                <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>نوع</th>
                <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {allItems.slice(0, 6).map(f => {
                const isIncome = financeData.income.some(x => x.id === f.id);
                return (
                <tr key={f.id} className="hover:bg-[var(--aw-bg-card-hover)] cursor-pointer" onClick={() => openModal('جزئیات تراکنش', <FinDetailContent itemId={f.id} />)}>
                  <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]" style={{ whiteSpace: 'nowrap' }}>{f.desc}</td>
                  <td className="p-2 text-[11px] border-b border-[var(--aw-border-light)] text-[var(--aw-text-secondary)]" style={{ whiteSpace: 'nowrap' }}>{f.category || '—'}</td>
                  <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]" style={{ fontWeight: 700, color: isIncome ? 'var(--aw-secondary)' : 'var(--aw-danger)', whiteSpace: 'nowrap' }}>{isIncome ? '+' : '−'}{f.amount}</td>
                  <td className="p-2 text-[11px] border-b border-[var(--aw-border-light)] text-[var(--aw-text-muted)]" style={{ whiteSpace: 'nowrap' }}>{f.date}</td>
                  <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]">
                    <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: isIncome ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.16)', color: isIncome ? '#10b981' : '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {isIncome ? 'درآمد' : 'هزینه'}
                    </span>
                  </td>
                  <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]">
                    <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: f.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: f.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {f.status === 'paid' ? 'پرداخت شده' : 'معوق'}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashSection>
    </motion.div>
  );
}

function FinSumCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-[10px] p-3.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
      <div className="text-xl mb-0.5" style={{ fontWeight: 800, color }}>{value}</div>
      <div className="text-[11px] text-[var(--aw-text-muted)]">{label}</div>
    </div>
  );
}

function FinTable({ items, colorClass, type }: { items: FinanceItem[]; colorClass: string; type: 'income' | 'expense' }) {
  const { openModal } = useApp();
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr>
              <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>شرح</th>
              <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>دسته‌بندی</th>
              <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>مبلغ</th>
              <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>تاریخ</th>
              <th className="text-right p-2 text-[11px] text-[var(--aw-text-muted)] border-b border-[var(--aw-border)]" style={{ fontWeight: 600 }}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {items.map(f => (
              <tr key={f.id} className="hover:bg-[var(--aw-bg-card-hover)] cursor-pointer" onClick={() => openModal('جزئیات تراکنش', <FinDetailContent itemId={f.id} />)}>
                <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]" style={{ whiteSpace: 'nowrap' }}>{f.desc}</td>
                <td className="p-2 text-[11px] border-b border-[var(--aw-border-light)] text-[var(--aw-text-secondary)]" style={{ whiteSpace: 'nowrap' }}>{f.category || '—'}</td>
                <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]" style={{ fontWeight: 700, color: colorClass, whiteSpace: 'nowrap' }}>{f.amount}</td>
                <td className="p-2 text-[11px] border-b border-[var(--aw-border-light)] text-[var(--aw-text-muted)]" style={{ whiteSpace: 'nowrap' }}>{f.date}</td>
                <td className="p-2 text-[12px] border-b border-[var(--aw-border-light)]">
                  <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: f.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: f.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {f.status === 'paid' ? 'پرداخت شده' : 'معوق'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="w-full py-2.5 px-5 border border-dashed border-[var(--aw-border)] rounded-[10px] text-[13px] cursor-pointer bg-transparent text-[var(--aw-text-secondary)] hover:border-[var(--aw-primary)] hover:text-[var(--aw-primary)] transition-all"
        style={{ fontWeight: 600 }}
        onClick={() => openModal('افزودن ' + (type === 'income' ? 'درآمد' : 'هزینه'), <FinAddContent type={type} />)}
      >
        <i className="fa-solid fa-plus" /> افزودن {type === 'income' ? 'درآمد' : 'هزینه'} جدید
      </button>
    </>
  );
}

function fmtRial(n: number): string {
  return toFa(Math.round(n).toLocaleString('en-US'));
}
function nowDateFa(): string {
  // Simple current Persian-style date placeholder (Jalali approximation for demo).
  return '۱۴۰۴/۱۲/۰۵';
}
function invoiceTotals(inv: { lines: { qty: number; unitPrice: number }[]; taxPct: number; discount: number }) {
  const subtotal = (inv.lines || []).reduce((s: any, l: any) => s + (l.qty || 0) * (l.unitPrice || 0), 0);
  const taxable = Math.max(0, subtotal - (inv.discount || 0));
  const tax = Math.round(taxable * (inv.taxPct || 0) / 100);
  const total = taxable + tax;
  return { subtotal, tax, total };
}
const INVOICE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'پرداخت شده', color: '#10b981', bg: 'rgba(16,185,129,0.18)' },
  pending: { label: 'در انتظار',  color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
  overdue: { label: 'سررسید گذشته', color: '#ef4444', bg: 'rgba(239,68,68,0.18)' },
  draft:   { label: 'پیش‌نویس',   color: '#6b7280', bg: 'rgba(107,114,128,0.18)' },
};

function InvoicesTab() {
  const { invoices, openModal } = useApp();
  const [filter, setFilter] = useState<'all' | 'sales' | 'purchase'>('all');
  const shown = invoices.filter(inv => filter === 'all' ? true : inv.type === filter);

  const filterTabs: { id: typeof filter; label: string }[] = [
    { id: 'all', label: 'همه' },
    { id: 'sales', label: 'فروش' },
    { id: 'purchase', label: 'خرید' },
  ];

  return (
    <div>
      {/* New invoice button */}
      <button
        className="w-full mb-3 py-3 rounded-[10px] border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2"
        style={{ background: 'var(--aw-primary)', fontWeight: 700 }}
        onClick={() => openModal('فاکتور جدید', <NewInvoiceForm />)}
      >
        <i className="fa-solid fa-plus" /> افزودن فاکتور جدید
      </button>

      {/* Sub-filter */}
      <div className="flex gap-1 p-[3px] rounded-full border border-[var(--aw-border)] mb-3" style={{ background: 'var(--aw-bg-card)' }}>
        {filterTabs.map(t => (
          <button key={t.id}
            className="flex-1 py-1.5 rounded-full border-none cursor-pointer text-[12px] transition-all"
            style={filter === t.id
              ? { background: 'var(--aw-primary)', color: '#fff', fontWeight: 700 }
              : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 600 }}
            onClick={() => setFilter(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="text-center text-[12px] text-[var(--aw-text-muted)] py-8">فاکتوری ثبت نشده است.</div>
      )}

      {shown.map(inv => {
        const { total } = invoiceTotals(inv);
        const meta = INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.draft;
        return (
          <div key={inv.id}
            className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
            style={{ background: 'var(--aw-bg-card)' }}
            onClick={() => openModal('جزئیات فاکتور', <InvoiceDetail invId={inv.id} />)}>
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: inv.type === 'sales' ? 'var(--aw-primary)' : '#8B5CF6' }}>
                  <i className={`fa-solid ${inv.type === 'sales' ? 'fa-file-invoice-dollar' : 'fa-cart-flatbed'} text-[13px]`} />
                </div>
                <div>
                  <div className="text-[13px]" style={{ fontWeight: 700 }}>{inv.customer}</div>
                  <div className="text-[11px] text-[var(--aw-text-muted)]" dir="ltr" style={{ textAlign: 'right' }}>{toFa(inv.number)}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: meta.bg, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-[var(--aw-border-light)]">
              <span className="text-[11px] text-[var(--aw-text-secondary)]"><i className="fa-regular fa-calendar ml-1" />{inv.issueDate}</span>
              <span className="text-[13px]" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{fmtRial(total)} <span className="text-[10px] text-[var(--aw-text-muted)]">ریال</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InvoiceDetail({ invId }: { invId: string }) {
  const { invoices, showToast, closeModal, setInvoices } = useApp();
  const inv = invoices.find(i => i.id === invId);
  if (!inv) return <div className="p-4 text-[13px]">فاکتور یافت نشد.</div>;
  const { subtotal, tax, total } = invoiceTotals(inv);
  const meta = INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.draft;
  const row = 'flex justify-between py-1.5 text-[12px]';
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[15px]" style={{ fontWeight: 800 }}>{inv.customer}</div>
          <div className="text-[12px] text-[var(--aw-text-muted)]" dir="ltr" style={{ textAlign: 'right' }}>{toFa(inv.number)}</div>
        </div>
        <span className="px-2.5 py-1 rounded-[20px] text-[11px]" style={{ background: meta.bg, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
      </div>

      <div className="rounded-[12px] border border-[var(--aw-border)] p-3 mb-3" style={{ background: 'var(--aw-bg-card)' }}>
        <div className={row}><span className="text-[var(--aw-text-secondary)]">نوع فاکتور</span><span style={{ fontWeight: 600 }}>{inv.type === 'sales' ? 'فروش' : 'خرید'}</span></div>
        <div className={row}><span className="text-[var(--aw-text-secondary)]">تاریخ صدور</span><span style={{ fontWeight: 600 }}>{inv.issueDate}</span></div>
        <div className={row}><span className="text-[var(--aw-text-secondary)]">سررسید</span><span style={{ fontWeight: 600 }}>{inv.dueDate}</span></div>
        {inv.customerPhone && <div className={row}><span className="text-[var(--aw-text-secondary)]">تماس</span><span dir="ltr" style={{ fontWeight: 600 }}>{toFa(inv.customerPhone)}</span></div>}
      </div>

      {/* Line items */}
      <div className="text-[12px] mb-1.5 px-1" style={{ fontWeight: 700 }}>اقلام فاکتور</div>
      <div className="rounded-[12px] border border-[var(--aw-border)] overflow-hidden mb-3">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: 'var(--aw-bg-card)' }}>
              <th className="text-right p-2 text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>شرح</th>
              <th className="text-center p-2 text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>تعداد</th>
              <th className="text-left p-2 text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>قیمت واحد</th>
              <th className="text-left p-2 text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>جمع</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i} className="border-t border-[var(--aw-border-light)]">
                <td className="p-2 text-[11px]">{l.desc}</td>
                <td className="p-2 text-[11px] text-center">{toFa(l.qty)}</td>
                <td className="p-2 text-[11px] text-left" dir="ltr">{fmtRial(l.unitPrice)}</td>
                <td className="p-2 text-[11px] text-left" dir="ltr" style={{ fontWeight: 700 }}>{fmtRial(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="rounded-[12px] border border-[var(--aw-border)] p-3 mb-3" style={{ background: 'var(--aw-bg-card)' }}>
        <div className={row}><span className="text-[var(--aw-text-secondary)]">جمع جزء</span><span dir="ltr" style={{ fontWeight: 600 }}>{fmtRial(subtotal)}</span></div>
        {inv.discount > 0 && <div className={row}><span className="text-[var(--aw-text-secondary)]">تخفیف</span><span dir="ltr" style={{ fontWeight: 600, color: 'var(--aw-danger)' }}>−{fmtRial(inv.discount)}</span></div>}
        <div className={row}><span className="text-[var(--aw-text-secondary)]">مالیات ({toFa(inv.taxPct)}٪)</span><span dir="ltr" style={{ fontWeight: 600 }}>{fmtRial(tax)}</span></div>
        <div className="flex justify-between py-2 mt-1 border-t border-[var(--aw-border)] text-[14px]"><span style={{ fontWeight: 800 }}>مبلغ نهایی</span><span dir="ltr" style={{ fontWeight: 800, color: 'var(--aw-primary)' }}>{fmtRial(total)} ریال</span></div>
      </div>

      {inv.note && <div className="text-[11px] text-[var(--aw-text-muted)] mb-3 px-1">یادداشت: {inv.note}</div>}

      <div className="grid grid-cols-2 gap-2">
        <button className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px]" style={{ background: 'var(--aw-primary)', fontWeight: 700 }} onClick={() => { try { (api as any).update('invoices', invId, { status: 'sent' }); } catch (_) {} setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status: 'sent' } : i)); showToast('فاکتور برای مشتری ارسال شد ✅', 'success'); closeModal(); }}>ارسال فاکتور</button>
        <button className="py-2.5 rounded-[10px] cursor-pointer text-[12px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }} onClick={() => { const ok = __printInvoice(inv, subtotal, tax, total); showToast(ok ? 'پنجرهٔ چاپ فاکتور باز شد' : 'اجازهٔ باز کردن پنجرهٔ چاپ داده نشد'); }}>چاپ / PDF</button>
      </div>
    </div>
  );
}

function NewInvoiceForm() {
  const { addInvoice, showToast, closeModal, invoices } = useApp();
  const [type, setType] = useState<'sales' | 'purchase'>('sales');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxPct, setTaxPct] = useState('9');
  const [discount, setDiscount] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'paid'>('pending');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<{ desc: string; qty: string; unitPrice: string }[]>([{ desc: '', qty: '1', unitPrice: '' }]);

  const faToEn = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9.]/g, '');
  const num = (s: string) => parseFloat(faToEn(s)) || 0;

  const subtotal = lines.reduce((s, l) => s + num(l.qty) * num(l.unitPrice), 0);
  const disc = num(discount);
  const tax = Math.round(Math.max(0, subtotal - disc) * num(taxPct) / 100);
  const total = Math.max(0, subtotal - disc) + tax;

  const updateLine = (i: number, key: string, val: string) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  const addLine = () => setLines(prev => [...prev, { desc: '', qty: '1', unitPrice: '' }]);
  const removeLine = (i: number) => setLines(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  const nextNumber = () => {
    const prefix = type === 'sales' ? 'INV-' : 'PUR-';
    const nums = invoices.filter(i => i.number.startsWith(prefix)).map(i => parseInt(i.number.replace(prefix, '')) || 0);
    const max = nums.length ? Math.max(...nums) : (type === 'sales' ? 1405 : 312);
    return prefix + (max + 1);
  };

  const valid = customer.trim() && lines.some(l => l.desc.trim() && num(l.unitPrice) > 0);

  const submit = () => {
    if (!valid) { showToast('نام مشتری و حداقل یک قلم با قیمت لازم است', 'error'); return; }
    const inv: Invoice = {
      id: 'inv_' + Date.now(),
      number: nextNumber(),
      type, customer: customer.trim(), customerPhone: phone.trim() || undefined,
      issueDate: issueDate.trim() || nowDateFa(),
      dueDate: dueDate.trim() || nowDateFa(),
      lines: lines.filter(l => l.desc.trim()).map(l => ({ desc: l.desc.trim(), qty: num(l.qty) || 1, unitPrice: num(l.unitPrice) })),
      taxPct: num(taxPct), discount: disc, status, note: note.trim() || undefined,
    };
    addInvoice(inv);
    showToast(`فاکتور ${toFa(inv.number)} ثبت شد ✅`, 'success');
    closeModal();
  };

  const lbl = 'text-[11px] text-[var(--aw-text-secondary)] mb-1 block';
  const inputCls = 'w-full px-3 py-2 rounded-[10px] text-[13px] border border-[var(--aw-border)] bg-[var(--aw-bg-input)] text-[var(--aw-text-primary)] outline-none';

  return (
    <div className="p-4">
      {/* Type toggle */}
      <div className="flex gap-1 p-[3px] rounded-full border border-[var(--aw-border)] mb-3" style={{ background: 'var(--aw-bg-card)' }}>
        {[{ id: 'sales', label: 'فاکتور فروش' }, { id: 'purchase', label: 'فاکتور خرید' }].map(t => (
          <button key={t.id} className="flex-1 py-2 rounded-full border-none cursor-pointer text-[12px]"
            style={type === t.id ? { background: 'var(--aw-primary)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 600 }}
            onClick={() => setType(t.id as any)}>{t.label}</button>
        ))}
      </div>

      <div className="mb-2">
        <label className={lbl}>{type === 'sales' ? 'نام مشتری' : 'نام تأمین‌کننده'} *</label>
        <input className={inputCls} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="مثلاً شرکت پارس فولاد" />
      </div>
      <div className="mb-2">
        <label className={lbl}>شماره تماس</label>
        <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="۰۲۱…" dir="ltr" style={{ textAlign: 'right' }} />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div><label className={lbl}>تاریخ صدور</label><input className={inputCls} value={issueDate} onChange={e => setIssueDate(e.target.value)} placeholder="۱۴۰۴/۱۲/۰۱" /></div>
        <div><label className={lbl}>سررسید</label><input className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="۱۴۰۴/۱۲/۱۵" /></div>
      </div>

      {/* Line items */}
      <div className="flex justify-between items-center mb-1.5 px-1">
        <span className="text-[12px]" style={{ fontWeight: 700 }}>اقلام فاکتور *</span>
        <button className="text-[11px] cursor-pointer bg-transparent border-none flex items-center gap-1" style={{ color: 'var(--aw-primary)', fontWeight: 700 }} onClick={addLine}><i className="fa-solid fa-plus" /> افزودن ردیف</button>
      </div>
      {lines.map((l, i) => (
        <div key={i} className="rounded-[12px] border border-[var(--aw-border)] p-2.5 mb-2" style={{ background: 'var(--aw-bg-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <input className={inputCls + ' flex-1'} value={l.desc} onChange={e => updateLine(i, 'desc', e.target.value)} placeholder={'شرح قلم ' + toFa(i + 1)} />
            {lines.length > 1 && <button className="w-7 h-7 rounded-[8px] border-none cursor-pointer flex-shrink-0" style={{ background: 'rgba(239,68,68,0.14)', color: '#ef4444' }} onClick={() => removeLine(i)}><i className="fa-solid fa-trash text-[11px]" /></button>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={lbl}>تعداد</label><input className={inputCls} value={l.qty} onChange={e => updateLine(i, 'qty', e.target.value)} dir="ltr" style={{ textAlign: 'center' }} /></div>
            <div className="col-span-2"><label className={lbl}>قیمت واحد (ریال)</label><input className={inputCls} value={l.unitPrice} onChange={e => updateLine(i, 'unitPrice', __grpFa(e.target.value))} placeholder="۰" dir="ltr" style={{ textAlign: 'right' }} /></div>
          </div>
          {num(l.unitPrice) > 0 && <div className="text-[11px] text-[var(--aw-text-muted)] mt-1.5 text-left" dir="ltr">جمع: {fmtRial(num(l.qty) * num(l.unitPrice))} ریال</div>}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2 mb-3 mt-1">
        <div><label className={lbl}>مالیات (٪)</label><input className={inputCls} value={taxPct} onChange={e => setTaxPct(e.target.value)} dir="ltr" style={{ textAlign: 'center' }} /></div>
        <div><label className={lbl}>تخفیف (ریال)</label><input className={inputCls} value={discount} onChange={e => setDiscount(__grpFa(e.target.value))} placeholder="۰" dir="ltr" style={{ textAlign: 'right' }} /></div>
      </div>

      <div className="mb-3">
        <label className={lbl}>وضعیت</label>
        <div className="flex gap-1 p-[3px] rounded-full border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
          {[{ id: 'pending', label: 'در انتظار' }, { id: 'paid', label: 'پرداخت شده' }, { id: 'draft', label: 'پیش‌نویس' }].map(s => (
            <button key={s.id} className="flex-1 py-1.5 rounded-full border-none cursor-pointer text-[11px]"
              style={status === s.id ? { background: 'var(--aw-primary)', color: '#fff', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-muted)', fontWeight: 600 }}
              onClick={() => setStatus(s.id as any)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className={lbl}>یادداشت</label>
        <textarea className={inputCls} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="توضیحات اختیاری…" style={{ resize: 'none' }} />
      </div>

      {/* Live totals */}
      <div className="rounded-[12px] border border-[var(--aw-border)] p-3 mb-3" style={{ background: 'var(--aw-bg-card)' }}>
        <div className="flex justify-between py-1 text-[12px]"><span className="text-[var(--aw-text-secondary)]">جمع جزء</span><span dir="ltr" style={{ fontWeight: 600 }}>{fmtRial(subtotal)}</span></div>
        {disc > 0 && <div className="flex justify-between py-1 text-[12px]"><span className="text-[var(--aw-text-secondary)]">تخفیف</span><span dir="ltr" style={{ fontWeight: 600, color: 'var(--aw-danger)' }}>−{fmtRial(disc)}</span></div>}
        <div className="flex justify-between py-1 text-[12px]"><span className="text-[var(--aw-text-secondary)]">مالیات</span><span dir="ltr" style={{ fontWeight: 600 }}>{fmtRial(tax)}</span></div>
        <div className="flex justify-between py-2 mt-1 border-t border-[var(--aw-border)] text-[14px]"><span style={{ fontWeight: 800 }}>مبلغ نهایی</span><span dir="ltr" style={{ fontWeight: 800, color: 'var(--aw-primary)' }}>{fmtRial(total)} ریال</span></div>
      </div>

      <button className="w-full py-3 rounded-[12px] border-none cursor-pointer text-white text-[13px]" style={{ background: valid ? 'var(--aw-primary)' : 'var(--aw-border)', fontWeight: 700 }} onClick={submit}>
        <i className="fa-solid fa-check ml-1" /> ثبت فاکتور
      </button>
    </div>
  );
}

// ========================
// REPORTS SCREEN
// ========================
function ReportsBody() {
  __useAnalytics();
  const { agents, customers, company, deals, personnel, openModal } = useApp();
  const __crmFunnel = [
    { name: 'سرنخ جدید', value: (customers || []).filter((c: any) => c.status === 'lead').length + (deals || []).filter((d: any) => d.stage === 'lead' || d.stage === 'new').length, fill: '#9B59B6' },
    { name: 'در حال مذاکره', value: (deals || []).filter((d: any) => d.stage === 'negotiation').length, fill: '#f59e0b' },
    { name: 'پیشنهاد ارسال شده', value: (deals || []).filter((d: any) => d.stage === 'proposal').length, fill: '#3b82f6' },
    { name: 'بسته شده', value: (deals || []).filter((d: any) => d.stage === 'closed' || d.stage === 'won').length, fill: '#10b981' },
  ];
  // دادهٔ واقعیِ CRM (بدونِ fallbackِ فیک). قبلاً وقتی خالی بود اعدادِ هاردکد ۴۵/۲۸/۱۸/۱۲ نشان می‌داد
  // که «ویترینی» بود و با دیتای واقعیِ CRM (۰) تناقض داشت — حذف شد؛ خالی، خالی نشان داده می‌شود.
  const CRM_FUNNEL_DATA = __crmFunnel;
  const companyAgents = agents.filter(a => !a.locked && (!a.company || a.company === company));

  const agentChartData = companyAgents.map(a => ({
    name: a.name.split(' ')[0],
    done: a.done,
    pending: a.pending,
  }));

  return (
    <>
      <h3 className="text-base mb-4 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
        <i className="fa-solid fa-chart-bar text-[var(--aw-primary)]" /> گزارش‌ها
      </h3>

      <ReportCard
        icon="fa-solid fa-robot" bg="aw-bg-blue" title="عملکرد عامل‌ها" desc="تحلیل کارایی و بهره‌وری عامل‌های هوشمند"
        onClick={() => openModal('گزارش عملکرد عامل‌ها', <AgentReportDetail />)}
      >
        <div className="w-full h-[160px] mb-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentChartData} barGap={3} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<ChartTooltip />} />
              <Bar key="bar-done-rpt" dataKey="done" name="انجام شده" fill="#00E676" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar key="bar-pending-rpt" dataKey="pending" name="معلق" fill="#22A6F0" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      <ReportCard
        icon="fa-solid fa-wallet" bg="aw-bg-green" title="خلاصه مالی" desc="درآمد، هزینه و سود خالص"
        onClick={() => openModal('گزارش مالی', <FinanceReportDetail />)}
      >
        <div className="w-full h-[160px] mb-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(__ANALYTICS.monthlyRevenue || MONTHLY_REVENUE_DATA).slice(-6)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border-light)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="income" name="درآمد" stroke="#00E676" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" name="هزینه" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ReportMetric label="سود خالص" value="—" valueColor="var(--aw-primary)" />
      </ReportCard>

      <ReportCard
        icon="fa-solid fa-users" bg="aw-bg-purple" title="نمای CRM" desc="وضعیت مشتریان و معاملات"
        onClick={() => openModal('گزارش CRM', <CrmReportDetail />)}
      >
        <div className="flex items-center gap-4">
          <div className="w-[120px] h-[120px] flex-shrink-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CRM_FUNNEL_DATA} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3} dataKey="value">
                  {CRM_FUNNEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {CRM_FUNNEL_DATA.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                <span className="flex-1 text-[var(--aw-text-secondary)]">{d.name}</span>
                <span style={{ fontWeight: 700, color: d.fill }}>{toFa(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </ReportCard>

      <ReportCard
        icon="fa-solid fa-chart-line" bg="aw-bg-orange" title="فعالیت کاربران" desc="بررسی تعاملات و پیام‌ها"
        onClick={() => openModal('فعالیت کاربران', <ActivityReportDetail />)}
      >
        <div className="w-full h-[140px] mb-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(__ANALYTICS.weeklyActivity || WEEKLY_ACTIVITY_DATA)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="day" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<ChartTooltip />} />
              <Bar key="bar-msgs-rpt" dataKey="messages" name="پیام‌ها" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar key="bar-calls-rpt" dataKey="calls" name="تماس‌ها" fill="#2E86FF" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ReportMetric label="پرسنل آنلاین" value={toFa(personnel.filter(p => p.status === 'online').length)} valueColor="var(--aw-online)" />
      </ReportCard>
    </>
  );
}

// Reports screen wrapper (kept for any direct use)
function ReportsScreen() {
  return (
    <motion.div className="flex-1 overflow-y-auto p-4 pb-4 aw-scroll" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <ReportsBody />
    </motion.div>
  );
}

// Invoices screen wrapper (used for the فاکتورها menu)
function InvoicesScreen() {
  return (
    <motion.div className="flex-1 overflow-y-auto p-4 pb-4 aw-scroll" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <h3 className="text-base mb-4 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
        <i className="fa-solid fa-file-invoice-dollar text-[var(--aw-primary)]" /> فاکتورها
      </h3>
      <InvoicesTab />
    </motion.div>
  );
}

function ReportCard({ icon, bg, title, desc, children, onClick }: { icon: string; bg: string; title: string; desc: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <div className="rounded-[10px] p-4 mb-2.5 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }} onClick={onClick}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-base text-white ${bg}`}><i className={icon} /></div>
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{title}</div>
          <div className="text-[12px] text-[var(--aw-text-secondary)]">{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ReportMetric({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)] last:border-none text-[12px]">
      <span className="text-[var(--aw-text-secondary)]">{label}</span>
      <span style={{ fontWeight: 700, color: valueColor }}>{value}</span>
    </div>
  );
}

// ========================
// THEMES (appearance: light/dark + accent palette)
// ========================
export function ThemesContent() {
  const { theme, setTheme, themeAuto, setThemeAuto, agentAccent, setAgentAccent, ownedThemes, buyTheme, openModal, welcomeEnabled, setWelcomeEnabled, welcomeConfig, setWelcomeConfig, setAppStage, closeModal, showToast } = useApp();
  const isDark = theme === 'dark';
  const modes = [
    { key: 'glass', label: 'روشن', icon: 'fa-solid fa-sun', active: !themeAuto && !isDark },
    { key: 'dark', label: 'تیره', icon: 'fa-solid fa-moon', active: !themeAuto && isDark },
    { key: 'auto', label: 'خودکار', icon: 'fa-solid fa-circle-half-stroke', active: themeAuto },
  ];
  return (
    <div className="space-y-5">
      {/* Welcome screen — enable/disable + edit */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="text-[12px]" style={{ fontWeight: 700, color: 'var(--aw-text-secondary)' }}>صفحه ولکام</div>
          <button
            onClick={() => setWelcomeEnabled(!welcomeEnabled)}
            aria-label="فعال‌سازی صفحه ولکام"
            className="relative cursor-pointer border-none p-0"
            style={{ width: 42, height: 24, borderRadius: 999, background: welcomeEnabled ? 'var(--aw-primary)' : 'var(--aw-border)', transition: 'background .2s' }}
          >
            <span style={{ position: 'absolute', top: 3, left: welcomeEnabled ? 3 : 21, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left .2s' }} />
          </button>
        </div>
      </div>

      <div>
        <div className="text-[12px] mb-2 px-1" style={{ fontWeight: 700, color: 'var(--aw-text-secondary)' }}>حالت نمایش</div>
        <div className="grid grid-cols-3 gap-2.5">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => { if (m.key === 'auto') { setThemeAuto(true); } else { setThemeAuto(false); setTheme(m.key as any); } }}
              className="aw-no-pill rounded-[8px] py-2.5 px-2 cursor-pointer flex flex-col items-center gap-1.5 transition-all"
              style={{
                background: m.active ? 'var(--aw-primary-bg)' : 'var(--aw-bg-card)',
                border: m.active ? '2px solid var(--aw-primary)' : '1.5px solid var(--aw-border)',
              }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center text-[22px]"
                style={{ color: 'var(--aw-primary)' }}
              >
                <i className={m.icon} />
              </div>
              <span className="text-[13px]" style={{ fontWeight: 700, color: m.active ? 'var(--aw-primary)' : 'var(--aw-text-primary)' }}>{m.label}</span>
              {m.active && <i className="fa-solid fa-circle-check text-[12px]" style={{ color: 'var(--aw-primary)' }} />}
            </button>
          ))}
        </div>
        {themeAuto && (
          <div className="text-[10px] text-[var(--aw-text-muted)] mt-2 px-1 flex items-center gap-1.5">
            <i className="fa-solid fa-clock text-[10px]" style={{ color: 'var(--aw-primary)' }} />
            بر اساس ساعت دستگاه شما: روز روشن، شب تیره (هم‌اکنون {isDark ? 'تیره' : 'روشن'})
          </div>
        )}
      </div>

      <div>
        <div className="text-[12px] mb-1 px-1" style={{ fontWeight: 700, color: 'var(--aw-text-secondary)' }}>رنگ تم</div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mb-2.5 px-1">با انتخاب رنگ، کل تم برنامه (دکمه‌ها، آیکون‌ها، پترن چت، اسپکتروم و پس‌زمینه) تغییر می‌کند.</div>
        <div className="flex flex-wrap gap-2.5 px-1">
          <button
            onClick={() => setAgentAccent(null)}
            title="پیش‌فرض"
            className="aw-no-pill w-9 h-9 rounded-[8px] cursor-pointer flex items-center justify-center p-0"
            style={{ background: 'var(--aw-bg-card)', border: agentAccent == null ? '2.5px solid var(--aw-primary)' : '2px solid var(--aw-border)', color: 'var(--aw-text-muted)' }}
          >
            <i className="fa-solid fa-ban text-[13px]" />
          </button>
          {ACCENT_PALETTE.map((c, idx) => {
            const unlocked = idx < FREE_COUNT || ownedThemes.includes(c);
            return (
            <button
              key={c}
              onClick={() => {
                if (unlocked) setAgentAccent(c);
                else openModal('خرید تم رنگی', <BuyItemModal kind="theme" label="تم رنگی اختصاصی" price={THEME_PRICE} swatch={c} onConfirm={() => { buyTheme(c, THEME_PRICE); setAgentAccent(c); }} />);
              }}
              className="aw-no-pill w-9 h-9 rounded-[8px] cursor-pointer p-0 flex items-center justify-center relative"
              style={{ background: c, border: agentAccent === c ? '2.5px solid var(--aw-text-primary)' : '2px solid rgba(255,255,255,0.35)', boxShadow: agentAccent === c ? '0 0 0 3px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.15)', opacity: unlocked ? 1 : 0.55 }}
            >
              {agentAccent === c && unlocked && <i className="fa-solid fa-check text-[12px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />}
              {!unlocked && <i className="fa-solid fa-lock text-[10px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }} />}
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========================
// MORE SCREEN (Settings - now used as modal content)
// ========================
export function MoreScreenModal() {
  const { openModal, closeModal, openUnifiedCall, setAdminScreen, showToast } = useApp();

  const handleNav = (action: () => void) => {
    closeModal();
    setTimeout(action, 200);
  };
  const back = () => openModal('تنظیمات', <MoreScreenModal />);
  const openSub = (title: string, content: React.ReactNode) => openModal(title, content, back);

  return (
    <div>
      <SettingsGroup title="نمایش">
        <SettingsItem icon="fa-solid fa-palette" label="تم‌ها" onClick={() => openSub('تم‌ها', <ThemesContent />)} />
      </SettingsGroup>

      <SettingsGroup title="مدیریت">
        <SettingsItem icon="fa-solid fa-building" label="تنظیمات شرکت‌ها" onClick={() => openSub('تنظیمات شرکت‌ها', <CompaniesSettingsContent />)} />
        <SettingsItem icon="fa-solid fa-robot" label="تنظیمات عامل‌ها" onClick={() => openModal('تنظیمات عامل‌ها', <AgentSettingsContent onBack={back} />, back)} />
        <SettingsItem icon="fa-solid fa-user-tie" label="مدیریت پرسنل" onClick={() => openSub('مدیریت پرسنل', <PersonnelSettingsContent />)} />
        <SettingsItem icon="fa-solid fa-chart-bar" label="گزارش‌ها" onClick={() => { closeModal(); setAdminScreen('analyticsScreen'); }} />
      </SettingsGroup>

      <SettingsGroup title="عامل‌های هوشمند (AI)">
        <SettingsItem icon="fa-solid fa-user-plus" label="استخدام ایجنت" onClick={() => openSub('استخدام ایجنت', <HireAgentContent />)} />
        <SettingsItem icon="fa-solid fa-shield-halved" label="پرمیشن و دسترسی" onClick={() => openSub('پرمیشن و دسترسی', <PermissionsContent />)} />
        <SettingsItem icon="fa-solid fa-diagram-project" label="تنظیمات ورک‌فلو" onClick={() => openSub('تنظیمات ورک‌فلو', <WorkflowContent />)} />
        <SettingsItem icon="fa-solid fa-toggle-on" label="فعال/غیرفعال‌سازی ایجنت" onClick={() => openSub('فعال/غیرفعال‌سازی ایجنت', <ToggleAgentContent />)} />
        <SettingsItem icon="fa-solid fa-gauge-high" label="تنظیمات KPI" onClick={() => openSub('تنظیمات KPI', <KpiSettingsContent />)} />
        <SettingsItem icon="fa-solid fa-crown" label="مدیریت پلن‌ها" onClick={() => openSub('مدیریت پلن‌ها', <PlansManagementContent />)} />
      </SettingsGroup>

      <SettingsGroup title="ارتباطات">
        <SettingsItem icon="fa-solid fa-phone-alt" label="تماس‌ها" onClick={() => { closeModal(); openUnifiedCall(); }} />
        <SettingsItem icon="fa-solid fa-bell" label="اعلان‌ها" onClick={() => openSub('اعلان‌ها', <NotificationsContent />)} />
      </SettingsGroup>

      <SettingsGroup title="حساب کاربری">
        <SettingsItem icon="fa-solid fa-user-circle" label="پروفایل من" onClick={() => openSub('پروفایل من', <EuProfileBody />)} />
        <SettingsItem icon="fa-solid fa-cog" label="تنظیمات برنامه" onClick={() => openSub('تنظیمات برنامه', <AppSettingsContent />)} />
        <SettingsItem icon="fa-solid fa-question-circle" label="درباره Neura" onClick={() => openSub('درباره Neura', <AboutContent />)} />
        <SettingsItem icon="fa-solid fa-sign-out-alt" label="خروج" danger onClick={() => openSub('خروج', <LogoutContent />)} />
      </SettingsGroup>
    </div>
  );
}


// ========================
// TASKS SCREEN
// ========================
type TasksTab = 'tasks' | 'calendar' | 'todo' | 'planner';

interface TodoListItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

interface PlannerBlock {
  id: string;
  time: string;
  title: string;
  category: 'meeting' | 'task' | 'break' | 'personal';
  duration: string;
}

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  color: string;
  time?: string;
}

const INITIAL_TODO_ITEMS: TodoListItem[] = [];

const CALENDAR_EVENTS: CalendarEvent[] = [];

const PLANNER_BLOCKS_INIT: PlannerBlock[] = [];

const PLANNER_CATS: Record<string, { label: string; color: string; icon: string }> = {
  meeting: { label: 'جلسه', color: '#8B5CF6', icon: 'fa-solid fa-users' },
  task: { label: 'وظیفه', color: '#3B82F6', icon: 'fa-solid fa-list-check' },
  break: { label: 'استراحت', color: '#10B981', icon: 'fa-solid fa-mug-hot' },
  personal: { label: 'شخصی', color: '#F59E0B', icon: 'fa-solid fa-star' },
};

const TASKS_TABS_LIST: { id: TasksTab; label: string; icon: string }[] = [
  { id: 'tasks', label: 'تسک‌ها', icon: 'fa-solid fa-list-check' },
  { id: 'calendar', label: 'تقویم', icon: 'fa-solid fa-calendar-days' },
  { id: 'todo', label: 'To-Do', icon: 'fa-solid fa-square-check' },
  { id: 'planner', label: 'پلنر', icon: 'fa-solid fa-table-cells-large' },
];

const WEEKDAYS_CAL = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const MONTH_NAME_CAL = (() => { try { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' }).format(new Date()); } catch (_) { return 'ماه جاری'; } })();

function TasksScreen() {
  const { tasks, setTasks, openModal, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<TasksTab>('tasks');
  const [filter, setFilter] = useState<'all' | 'todo' | 'inProgress' | 'done'>('all');
  const [search, setSearch] = useState('');
  const [todoItems, setTodoItems] = useState<TodoListItem[]>(INITIAL_TODO_ITEMS);
  const [newTodo, setNewTodo] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [plannerDay, setPlannerDay] = useState<'today' | 'tomorrow'>('today');
  const [plannerBlocks, setPlannerBlocks] = useState<PlannerBlock[]>(PLANNER_BLOCKS_INIT);
  __usePersistAdmin('admin_todos', todoItems, setTodoItems);
  __usePersistAdmin('admin_planner', plannerBlocks, setPlannerBlocks);

  const filteredTasks = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.title.includes(search) || t.assignee.includes(search) || t.description.includes(search));

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const filters: { id: typeof filter; label: string; count?: number }[] = [
    { id: 'all', label: 'همه', count: tasks.length },
    { id: 'todo', label: 'در انتظار', count: todoCount },
    { id: 'inProgress', label: 'در حال انجام', count: inProgressCount },
    { id: 'done', label: 'انجام شده', count: doneCount },
  ];

  const daysInMonth = 30;
  const calendarDays: (number | null)[] = [];
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  const [xEvents, setXEvents] = React.useState<CalendarEvent[]>([]);
  React.useEffect(() => { (async () => { try { const v: any = await (api as any).myList('admin_events'); if (Array.isArray(v)) setXEvents(v as any); } catch (_) {} })(); }, []);
  const __allCalEv: CalendarEvent[] = [...CALENDAR_EVENTS, ...xEvents];
  const dayEvents = selectedDay ? __allCalEv.filter(e => e.day === selectedDay) : [];

  const todoRemaining = todoItems.filter(t => !t.done).length;
  const todoDoneCount = todoItems.filter(t => t.done).length;

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodoItems(prev => [{ id: 'td' + Date.now(), text: newTodo.trim(), done: false, createdAt: 'الان' }, ...prev]);
    setNewTodo('');
    showToast('آیتم جدید اضافه شد');
  };
  const toggleTodo = (id: string) => setTodoItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id: string) => { setTodoItems(prev => prev.filter(t => t.id !== id)); showToast('حذف شد'); };
  const deletePlannerBlock = (id: string) => { setPlannerBlocks(prev => prev.filter(b => b.id !== id)); showToast('بلاک حذف شد'); };

  const handleAddPlanner = () => {
    openModal('افزودن بلاک جدید', <PlannerAddContent onAdd={(block) => {
      setPlannerBlocks(prev => [...prev, block].sort((a, b) => a.time.localeCompare(b.time)));
    }} />);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar + Stats */}
      <div className="px-4 pt-2 pb-1 flex-shrink-0">
        {/* Main Tabs */}
        <div className="flex gap-1 mb-3 p-1 rounded-[10px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          {TASKS_TABS_LIST.map(tab => (
            <button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border-none cursor-pointer transition-all text-[11px] ${
                activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--aw-text-muted)]'
              }`}
              style={activeTab === tab.id ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 } : { fontWeight: 600 }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'calendar' && (
          <div className="flex items-center justify-between mb-2">
            <button className="bg-transparent border-none text-[var(--aw-text-secondary)] cursor-pointer p-1"><i className="fa-solid fa-chevron-right" /></button>
            <span className="text-sm text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{MONTH_NAME_CAL}</span>
            <button className="bg-transparent border-none text-[var(--aw-text-secondary)] cursor-pointer p-1"><i className="fa-solid fa-chevron-left" /></button>
          </div>
        )}

        {activeTab === 'todo' && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-[12px] p-3 text-center border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="text-lg" style={{ fontWeight: 800, color: '#F59E0B' }}>{toFa(todoRemaining)}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">باقی‌مانده</div>
            </div>
            <div className="rounded-[12px] p-3 text-center border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="text-lg" style={{ fontWeight: 800, color: '#10B981' }}>{toFa(todoDoneCount)}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">انجام‌شده</div>
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="flex gap-2 mb-3">
            {(['today', 'tomorrow'] as const).map(d => (
              <button
                key={d}
                className={`flex-1 py-2.5 rounded-[12px] border text-[12px] cursor-pointer transition-all ${
                  plannerDay === d ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                }`}
                style={plannerDay === d ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 } : { fontWeight: 600 }}
                onClick={() => setPlannerDay(d)}
              >
                <i className={`fa-solid ${d === 'today' ? 'fa-sun' : 'fa-moon'} ml-1`} />
                {d === 'today' ? 'امروز' : 'فردا'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== TASKS TAB ===== */}
      {activeTab === 'tasks' && (
        <>
          <div className="flex gap-1.5 px-4 pb-2 flex-wrap flex-shrink-0">
            {filters.map(f => (
              <button
                key={f.id}
                className={`py-2 px-3 rounded-[20px] border text-[11px] cursor-pointer transition-all ${
                  filter === f.id ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                }`}
                style={filter === f.id ? { background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 } : { fontWeight: 600 }}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.count !== undefined && <span className="mr-1 text-[10px]">({toFa(f.count)})</span>}
              </button>
            ))}
          </div>
          <div className="px-4 pb-2.5 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
              <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
              <input
                className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                placeholder="جستجو در وظایف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer text-sm" onClick={() => setSearch('')}>
                  <i className="fa-solid fa-times" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll relative">
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            )) : (
              <EmptyState icon="fa-solid fa-list-check" text="وظیفه‌ای یافت نشد" />
            )}
          </div>
        </>
      )}

      {/* ===== CALENDAR TAB ===== */}
      {activeTab === 'calendar' && (
        <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS_CAL.map(d => (
                <div key={d} className="text-center text-[11px] text-[var(--aw-text-muted)] py-1" style={{ fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            <motion.div variants={fadeInUp} className="grid grid-cols-7 gap-1 mb-3">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} />;
                const evts = __allCalEv.filter(e => e.day === day);
                const isSel = selectedDay === day;
                const isToday = day === 22;
                return (
                  <button
                    key={day}
                    className={`relative p-1.5 rounded-[10px] border cursor-pointer transition-all min-h-[42px] flex flex-col items-center justify-start gap-0.5 ${
                      isSel ? 'border-[var(--aw-primary)] text-white' : isToday ? 'border-[var(--aw-accent)]' : 'border-transparent hover:border-[var(--aw-border)]'
                    }`}
                    style={{ background: isSel ? 'var(--aw-primary)' : isToday ? 'rgba(139,92,246,0.1)' : 'transparent' }}
                    onClick={() => setSelectedDay(isSel ? null : day)}
                  >
                    <span className={`text-[12px] ${isSel ? 'text-white' : isToday ? 'text-[var(--aw-primary)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: isToday ? 800 : 500 }}>{toFa(day)}</span>
                    {evts.length > 0 && (
                      <div className="flex gap-0.5">
                        {evts.slice(0, 3).map(e => <div key={e.id} className="w-[5px] h-[5px] rounded-full" style={{ background: isSel ? '#fff' : e.color }} />)}
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
            {selectedDay !== null && (
              <motion.div variants={fadeInUp} initial="initial" animate="animate">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-calendar-day text-[var(--aw-primary)]" />
                  <span className="text-[13px]" style={{ fontWeight: 700 }}>رویدادهای {toFa(selectedDay)} {MONTH_NAME_CAL}</span>
                </div>
                {dayEvents.length > 0 ? dayEvents.map(evt => (
                  <div key={evt.id} className="rounded-[12px] p-3 mb-2 border border-[var(--aw-border)] flex items-center gap-3" style={{ background: 'var(--aw-bg-card)' }}>
                    <div className="w-1 h-10 rounded-full" style={{ background: evt.color }} />
                    <div className="flex-1">
                      <div className="text-[13px]" style={{ fontWeight: 600 }}>{evt.title}</div>
                      {evt.time && <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-clock ml-1" />{evt.time}</div>}
                    </div>
                    <div className="w-3 h-3 rounded-full" style={{ background: evt.color }} />
                  </div>
                )) : (
                  <div className="text-center py-6 text-[var(--aw-text-muted)] text-[13px]">
                    <i className="fa-solid fa-calendar-xmark text-2xl mb-2 block opacity-40" />رویدادی ثبت نشده
                  </div>
                )}
              </motion.div>
            )}
            {selectedDay === null && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-clock text-[var(--aw-primary)]" />
                  <span className="text-[13px]" style={{ fontWeight: 700 }}>رویدادهای پیش‌رو</span>
                </div>
                {__allCalEv.filter(e => e.day >= 22).slice(0, 5).map(evt => (
                  <div key={evt.id} className="rounded-[12px] p-3 mb-2 border border-[var(--aw-border)] flex items-center gap-3 cursor-pointer transition-all hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }} onClick={() => setSelectedDay(evt.day)}>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-[14px]" style={{ background: evt.color, fontWeight: 700 }}>{toFa(evt.day)}</div>
                    <div className="flex-1">
                      <div className="text-[13px]" style={{ fontWeight: 600 }}>{evt.title}</div>
                      {evt.time && <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-clock ml-1" />{evt.time}</div>}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* ===== TO-DO TAB ===== */}
      {activeTab === 'todo' && (
        <>
          <div className="px-4 pb-2.5 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-[12px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
              <i className="fa-solid fa-plus text-sm text-[var(--aw-primary)]" />
              <input
                className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                placeholder="آیتم جدید اضافه کنید..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              />
              {newTodo && (
                <button className="bg-transparent border-none text-[var(--aw-primary)] cursor-pointer text-sm" style={{ fontWeight: 700 }} onClick={addTodo}>افزودن</button>
              )}
            </div>
          </div>
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #10B981, #3B82F6)' }} initial={{ width: 0 }} animate={{ width: todoItems.length > 0 ? `${(todoDoneCount / todoItems.length) * 100}%` : '0%' }} transition={{ duration: 0.4 }} />
              </div>
              <span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>{toFa(todoDoneCount)}/{toFa(todoItems.length)}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
            <motion.div variants={staggerContainer} initial="initial" animate="animate">
              {todoItems.length > 0 ? todoItems.map(item => (
                <motion.div key={item.id} variants={fadeInUp} className={`rounded-[12px] p-3 mb-2 border border-[var(--aw-border)] flex items-center gap-3 transition-all ${item.done ? 'opacity-60' : ''}`} style={{ background: 'var(--aw-bg-card)' }}>
                  <button className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all" style={{ borderColor: item.done ? '#10b981' : 'var(--aw-border)', background: item.done ? '#10b981' : 'transparent' }} onClick={() => toggleTodo(item.id)}>
                    {item.done && <i className="fa-solid fa-check text-[10px] text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[13px] ${item.done ? 'line-through text-[var(--aw-text-muted)]' : ''}`} style={{ fontWeight: 500 }}>{item.text}</span>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{item.createdAt}</div>
                  </div>
                  <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer text-sm hover:text-[#ef4444] transition-colors p-1" onClick={() => deleteTodo(item.id)}>
                    <i className="fa-solid fa-trash-can text-[12px]" />
                  </button>
                </motion.div>
              )) : <EmptyState icon="fa-solid fa-square-check" text="لیست خالی است" />}
            </motion.div>
          </div>
        </>
      )}

      {/* ===== PLANNER TAB ===== */}
      {activeTab === 'planner' && (
        <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.div variants={fadeInUp} className="flex gap-2 flex-wrap mb-3">
              {Object.entries(PLANNER_CATS).map(([key, cat]) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-[var(--aw-text-muted)] px-2 py-1 rounded-[20px] border border-[var(--aw-border)]" style={{ fontWeight: 600 }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />{cat.label}
                </span>
              ))}
            </motion.div>
            {plannerBlocks.map((block, idx) => {
              const cat = PLANNER_CATS[block.category];
              return (
                <motion.div key={block.id} variants={fadeInUp} className="flex gap-3 mb-1">
                  <div className="w-12 flex-shrink-0 text-[11px] text-[var(--aw-text-muted)] pt-3 text-left" style={{ fontWeight: 600 }}>{block.time}</div>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full border-2 mt-3.5" style={{ borderColor: cat.color, background: 'var(--aw-bg-app)' }} />
                    {idx < plannerBlocks.length - 1 && <div className="w-0.5 flex-1 min-h-[20px]" style={{ background: 'var(--aw-border)' }} />}
                  </div>
                  <div
                    className="flex-1 rounded-[12px] p-3 mb-1 border cursor-pointer transition-all hover:border-[var(--aw-primary)]"
                    style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)', borderRightWidth: 3, borderRightColor: cat.color }}
                    onClick={() => openModal(block.title, (
                      <div className="space-y-3 text-[13px]">
                        <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">زمان:</span><span>{block.time}</span></div>
                        <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">مدت:</span><span>{block.duration}</span></div>
                        <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">دسته‌بندی:</span><span style={{ color: cat.color }}><i className={`${cat.icon} ml-1`} />{cat.label}</span></div>
                        <button className="w-full mt-2 py-2.5 rounded-[10px] text-[13px] cursor-pointer border border-[#ef4444] text-[#ef4444] bg-transparent" style={{ fontWeight: 600 }} onClick={() => deletePlannerBlock(block.id)}>
                          <i className="fa-solid fa-trash ml-1" />حذف بلاک
                        </button>
                      </div>
                    ))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className={`${cat.icon} text-[12px]`} style={{ color: cat.color }} />
                        <span className="text-[13px]" style={{ fontWeight: 600 }}>{block.title}</span>
                      </div>
                      <span className="text-[10px] text-[var(--aw-text-muted)] px-2 py-0.5 rounded-[20px] border border-[var(--aw-border)]" style={{ fontWeight: 500 }}>{block.duration}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {plannerBlocks.length === 0 && <EmptyState icon="fa-solid fa-table-cells-large" text="بلاکی ثبت نشده" />}
          </motion.div>
        </div>
      )}

      {/* Add button */}
      <button
        className="absolute bottom-20 left-5 w-[52px] h-[52px] rounded-full border-none text-white text-xl cursor-pointer z-40 flex items-center justify-center"
        style={{ background: 'var(--aw-primary, #2E86FF)', boxShadow: 'var(--aw-shadow)' }}
        onClick={() => {
          if (activeTab === 'tasks') openModal('افزودن وظیفه', <TaskAddContent />);
          else if (activeTab === 'calendar') openModal('افزودن رویداد', <CalendarEventAddContent />);
          else if (activeTab === 'planner') handleAddPlanner();
        }}
      >
        <i className="fa-solid fa-plus" />
      </button>
    </div>
  );
}

function CalendarEventAddContent() {
  const { closeModal, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const save = () => { if (!title || !day) return; const _dn = parseInt(String(day).replace(/[\u06F0-\u06F9]/g, (d: string) => String(d.charCodeAt(0) - 0x06F0)).replace(/[\u0660-\u0669]/g, (d: string) => String(d.charCodeAt(0) - 0x0660)).replace(/[^0-9]/g, '')) || 1; try { (api as any).myCreate('admin_events', { id: 'ev' + Date.now(), day: _dn, title, color: 'var(--aw-primary)', time }); } catch (_) {} closeModal(); showToast('رویداد جدید اضافه شد'); };
  return (
    <div>
      <FormGroup label="عنوان رویداد"><FormInput placeholder="عنوان رویداد" value={title} onChange={e => setTitle(e.target.value)} /></FormGroup>
      <FormGroup label="روز ماه"><FormInput placeholder="مثلاً ۱۵" value={day} onChange={e => setDay(e.target.value)} /></FormGroup>
      <FormGroup label="ساعت (اختیاری)"><FormInput placeholder="مثلاً ۱۰:۰۰" value={time} onChange={e => setTime(e.target.value)} /></FormGroup>
      <button className="w-full py-2.5 border-none rounded-[10px] text-[13px] text-white cursor-pointer mt-2" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={save}>
        <i className="fa-solid fa-calendar-plus ml-1" /> ثبت رویداد
      </button>
    </div>
  );
}

function PlannerAddContent({ onAdd }: { onAdd: (block: PlannerBlock) => void }) {
  const { closeModal, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState<'meeting' | 'task' | 'break' | 'personal'>('task');
  const save = () => {
    if (!title || !time) return;
    onAdd({ id: 'pb' + Date.now(), time, title, category, duration: duration || '۳۰ دقیقه' });
    closeModal();
    showToast('بلاک جدید اضافه شد');
  };
  return (
    <div>
      <FormGroup label="عنوان"><FormInput placeholder="عنوان بلاک" value={title} onChange={e => setTitle(e.target.value)} /></FormGroup>
      <FormGroup label="ساعت شروع"><FormInput placeholder="مثلاً ۱۰:۰۰" value={time} onChange={e => setTime(e.target.value)} /></FormGroup>
      <FormGroup label="مدت زمان"><FormInput placeholder="مثلاً ۱ ساعت" value={duration} onChange={e => setDuration(e.target.value)} /></FormGroup>
      <FormGroup label="دسته‌بندی">
        <FormSelect value={category} onChange={e => setCategory(e.target.value as any)} options={[
          { value: 'task', label: 'وظیفه' }, { value: 'meeting', label: 'جلسه' }, { value: 'break', label: 'استراحت' }, { value: 'personal', label: 'شخصی' },
        ]} />
      </FormGroup>
      <button className="w-full py-2.5 border-none rounded-[10px] text-[13px] text-white cursor-pointer mt-2" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={save}>
        <i className="fa-solid fa-plus ml-1" /> افزودن بلاک
      </button>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { openModal, setTasks, showToast } = useApp();
  const statusColor = TASK_STATUS_COLORS[task.status];
  const priorityColor = TASK_PRIORITY_COLORS[task.priority];

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t));
    showToast(newStatus === 'done' ? 'وظیفه تکمیل شد' : 'وظیفه به حالت انتظار بازگشت');
  };

  return (
    <div
      className={`rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)] ${task.status === 'done' ? 'opacity-70' : ''}`}
      style={{ background: 'var(--aw-bg-card)' }}
      onClick={() => openModal(task.title, <TaskDetailContent taskId={task.id} />)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all"
          style={{
            borderColor: task.status === 'done' ? '#10b981' : 'var(--aw-border)',
            background: task.status === 'done' ? '#10b981' : 'transparent',
          }}
          onClick={toggleDone}
        >
          {task.status === 'done' && <i className="fa-solid fa-check text-[10px] text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1.5">
            <span className={`text-[13px] ${task.status === 'done' ? 'line-through text-[var(--aw-text-muted)]' : ''}`} style={{ fontWeight: 600 }}>
              {task.title}
            </span>
          </div>

          <div className="flex gap-1.5 flex-wrap mb-1.5">
            <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: statusColor.bg, color: statusColor.text, fontWeight: 600 }}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
            <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: priorityColor.bg, color: priorityColor.text, fontWeight: 600 }}>
              <i className="fa-solid fa-flag text-[8px]" /> {TASK_PRIORITY_LABELS[task.priority]}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[var(--aw-text-muted)]">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-user text-[9px]" /> {task.assignee}
            </span>
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-calendar text-[9px]" /> {task.dueDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskDetailContent({ taskId }: { taskId: string }) {
  const { tasks, setTasks, closeModal, showToast } = useApp();
  const t = tasks.find(x => x.id === taskId);
  if (!t) return null;

  const update = (field: keyof Task, val: string) => {
    setTasks(prev => prev.map(tk => tk.id === taskId ? { ...tk, [field]: val } : tk));
    try { (api as any).update('tasks', taskId, { [field]: val }); } catch (_) {}
  };

  const handleDelete = () => {
    setTasks(prev => prev.filter(tk => tk.id !== taskId));
    closeModal();
    showToast('وظیفه حذف شد');
  };

  return (
    <div>
      <div className="flex justify-center gap-2 mb-4">
        <span className="px-3 py-1 rounded-[20px] text-[11px]" style={{ background: TASK_STATUS_COLORS[t.status].bg, color: TASK_STATUS_COLORS[t.status].text, fontWeight: 600 }}>
          {TASK_STATUS_LABELS[t.status]}
        </span>
        <span className="px-3 py-1 rounded-[20px] text-[11px]" style={{ background: TASK_PRIORITY_COLORS[t.priority].bg, color: TASK_PRIORITY_COLORS[t.priority].text, fontWeight: 600 }}>
          <i className="fa-solid fa-flag text-[9px]" /> {TASK_PRIORITY_LABELS[t.priority]}
        </span>
      </div>
      <FormGroup label="عنوان"><FormInput value={t.title} onChange={e => update('title', e.target.value)} /></FormGroup>
      <FormGroup label="توضیحات">
        <textarea
          className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y min-h-[60px]"
          style={{ background: 'var(--aw-bg-input)' }}
          value={t.description}
          onChange={e => update('description', e.target.value)}
          rows={3}
        />
      </FormGroup>
      <FormGroup label="مسئول"><FormInput value={t.assignee} onChange={e => update('assignee', e.target.value)} /></FormGroup>
      <FormGroup label="تاریخ سررسید"><FormInput value={t.dueDate} onChange={e => update('dueDate', e.target.value)} /></FormGroup>
      <FormGroup label="وضعیت">
        <FormSelect
          value={t.status}
          onChange={e => update('status', e.target.value as any)}
          options={[
            { value: 'todo', label: 'در انتظار' },
            { value: 'inProgress', label: 'در حال انجام' },
            { value: 'done', label: 'انجام شده' },
          ]}
        />
      </FormGroup>
      <FormGroup label="اولویت">
        <FormSelect
          value={t.priority}
          onChange={e => update('priority', e.target.value as any)}
          options={[
            { value: 'high', label: 'بالا' },
            { value: 'medium', label: 'متوسط' },
            { value: 'low', label: 'پایین' },
          ]}
        />
      </FormGroup>
      <div className="text-[11px] text-[var(--aw-text-muted)] mb-3 px-1">
        <i className="fa-solid fa-clock" /> ایجاد شده: {t.createdAt}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); showToast('تغییرات ذخیره شد'); }}>
          <i className="fa-solid fa-save" /> ذخیره
        </button>
        <button className="py-2.5 px-5 rounded-[10px] text-[13px] cursor-pointer border border-[var(--aw-danger)] text-[var(--aw-danger)] bg-transparent" style={{ fontWeight: 600 }} onClick={handleDelete}>
          <i className="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  );
}

function TaskAddContent() {
  const { setTasks, closeModal, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const save = () => {
    if (!title) return;
    const newTask: Task = {
      id: 't' + Date.now(),
      title,
      description,
      status: 'todo',
      priority,
      assignee: assignee || 'نامشخص',
      dueDate: dueDate || 'بدون سررسید',
      createdAt: 'امروز',
    };
    setTasks(prev => [newTask, ...prev]);
    closeModal();
    showToast('وظیفه جدید اضافه شد');
  };

  return (
    <div>
      <FormGroup label="عنوان وظیفه"><FormInput placeholder="عنوان وظیفه را وارد کنید" value={title} onChange={e => setTitle(e.target.value)} /></FormGroup>
      <FormGroup label="توضیحات">
        <textarea
          className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y min-h-[60px] placeholder:text-[var(--aw-text-muted)]"
          style={{ background: 'var(--aw-bg-input)' }}
          placeholder="توضیحات وظیفه"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </FormGroup>
      <FormGroup label="مسئول"><FormInput placeholder="نام مسئول" value={assignee} onChange={e => setAssignee(e.target.value)} /></FormGroup>
      <FormGroup label="ساعت موعد"><TimePicker className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" value={dueDate} onChange={(v: string) => setDueDate(v)} /></FormGroup>
      <FormGroup label="اولویت">
        <FormSelect
          value={priority}
          onChange={e => setPriority(e.target.value as any)}
          options={[
            { value: 'high', label: 'بالا' },
            { value: 'medium', label: 'متوسط' },
            { value: 'low', label: 'پایین' },
          ]}
        />
      </FormGroup>
      <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={save}>
        <i className="fa-solid fa-plus" /> ثبت وظیفه
      </button>
    </div>
  );
}

export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

export function SettingsItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-[10px] mb-1 cursor-pointer transition-all border border-[var(--aw-border)] hover:border-[var(--aw-primary)]"
      style={{ background: 'var(--aw-bg-card)' }}
      onClick={onClick}
    >
      <i className={`${icon} text-base w-5 text-center`} style={{ color: danger ? 'var(--aw-danger)' : 'var(--aw-primary)' }} />
      <span className={`flex-1 text-[13px] ${danger ? 'text-[var(--aw-danger)]' : ''}`} style={{ fontWeight: 500 }}>{label}</span>
      <i className="fa-solid fa-chevron-left text-[12px] text-[var(--aw-text-muted)]" />
    </div>
  );
}

// ========================
// MODAL CONTENTS
// ========================
function NotifItem({ notif: n, isRead, onMarkRead, onDelete }: { notif: any; isRead?: boolean; onMarkRead?: (id: string) => void; onDelete?: (id: string) => void }) {
  const { closeModal, openChat, setAdminScreen, setCrmTab, setFinTab, agents } = useApp();
  const handleClick = () => {
    closeModal();
    if (n.type === 'chat') {
      const a = agents.find((x: any) => x.id === n.target);
      if (a && !a.locked) setTimeout(() => openChat(n.target, 'agent'), 250);
    } else if (n.type === 'finance') {
      setAdminScreen('financeScreen');
      if (n.target === 'pending') setFinTab('invoices');
    } else if (n.type === 'crm') {
      setAdminScreen('crmScreen');
      if (n.target === 'leads') setCrmTab('leads');
    } else if (n.type === 'reports') {
      setAdminScreen('analyticsScreen');
    }
  };

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-[10px] mb-1.5 cursor-pointer border transition-all hover:border-[var(--aw-primary)] ${isRead ? 'border-transparent opacity-60' : 'border-[var(--aw-border)]'}`} style={{ background: 'var(--aw-bg-card)' }} onClick={handleClick}>
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(8px)' }}>
        {NOTIF_ICON_SRC[n.icon]
          ? <img src={NOTIF_ICON_SRC[n.icon]} alt="" className="nav-icon-img" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          : <i className={`${n.icon} text-sm`} style={{ color: 'var(--aw-primary)' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {!isRead && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--aw-primary, #2E86FF)' }} />}
          <div className="text-[13px] truncate" style={{ fontWeight: 600 }}>{n.title}</div>
        </div>
        <div className="text-[11px] text-[var(--aw-text-secondary)]">{n.desc}</div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{n.time}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-[var(--aw-primary)] inline-block" style={{ fontWeight: 600 }}>{n.cta} ←</span>
          <div className="flex-1" />
          {!isRead && onMarkRead && (
            <button
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-all hover:opacity-80"
              style={{ background: 'var(--aw-bg-hover)', color: 'var(--aw-success)', fontWeight: 600 }}
              onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
            >
              <i className="fa-solid fa-check text-[9px]" />
              خوانده شد
            </button>
          )}
          {onDelete && (
            <button
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-all hover:opacity-80"
              style={{ background: 'var(--aw-bg-hover)', color: 'var(--aw-danger)', fontWeight: 600 }}
              onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
            >
              <i className="fa-solid fa-trash text-[9px]" />
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationsContent() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<string>('all');
  const __appNotif = useApp() as any;
  const __coNotif = __appNotif.company; const __roleNotif = __appNotif.role;
  const [__notifs, setNotifs] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const v: any = __roleNotif === 'user' ? await (api as any).myList('notifications') : await (api as any).list('notifications', __coNotif); if (Array.isArray(v)) setNotifs(v.slice().reverse()); } catch (_) {} })(); }, [__coNotif, __roleNotif]);
  const NOTIFICATIONS = __notifs;

  const handleMarkRead = (id: string) => setReadIds(prev => new Set(prev).add(id));
  const handleDelete = (id: string) => setDeletedIds(prev => new Set(prev).add(id));
  const handleMarkAllRead = () => setReadIds(new Set(NOTIFICATIONS.map(n => n.id)));

  const NOTIF_CATS = [
    { key: 'agents', label: 'عامل‌ها', icon: 'fa-solid fa-robot' },
    { key: 'personnel', label: 'پرسنل', icon: 'fa-solid fa-users' },
    { key: 'finance', label: 'مالی', icon: 'fa-solid fa-sack-dollar' },
    { key: 'crm', label: 'مشتریان', icon: 'fa-solid fa-user-group' },
    { key: 'system', label: 'عمومی', icon: 'fa-solid fa-circle-info' },
  ];
  const catOf = (n: any) => n.category || 'system';

  const visibleNotifs = NOTIFICATIONS.filter(n => !deletedIds.has(n.id));
  const unreadCount = visibleNotifs.filter(n => !readIds.has(n.id)).length;
  // Only show category chips that actually have visible notifications
  const activeCats = NOTIF_CATS.filter(c => visibleNotifs.some(n => catOf(n) === c.key));
  const shown = cat === 'all' ? visibleNotifs : visibleNotifs.filter(n => catOf(n) === cat);
  const chipStyle = (on: boolean): React.CSSProperties => ({
    background: on ? 'var(--aw-primary, #2E86FF)' : 'var(--aw-eu-nav-bg)',
    color: on ? '#fff' : 'var(--aw-text-secondary)',
    border: '1px solid ' + (on ? 'transparent' : 'var(--aw-eu-nav-border)'),
    fontWeight: 600,
  });

  const renderGroup = (c: { key: string; label: string; icon: string }) => {
    const items = shown.filter(n => catOf(n) === c.key);
    if (items.length === 0) return null;
    return (
      <div key={c.key} className="mb-3">
        <div className="flex items-center gap-2 px-1 mb-1.5">
          <i className={`${c.icon} text-[11px] text-[var(--aw-primary)]`} />
          <span className="text-[12px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 700 }}>{c.label}</span>
          <span className="text-[10px] text-[var(--aw-text-muted)]">({toFa(items.length)})</span>
          <div className="flex-1 h-px" style={{ background: 'var(--aw-border)' }} />
        </div>
        <AnimatePresence>
          {items.map(n => (
            <motion.div key={n.id} initial={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.25 }}>
              <NotifItem notif={n} isRead={readIds.has(n.id)} onMarkRead={handleMarkRead} onDelete={handleDelete} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div>
      {visibleNotifs.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] text-[var(--aw-text-muted)]">{toFa(unreadCount)} اعلان خوانده‌نشده</span>
          {unreadCount > 0 && (
            <button
              className="text-[11px] px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--aw-bg-hover)', color: 'var(--aw-primary)', fontWeight: 600 }}
              onClick={handleMarkAllRead}
            >
              <i className="fa-solid fa-check-double ml-1 text-[10px]" />
              خواندن همه
            </button>
          )}
        </div>
      )}
      {/* Category filter chips */}
      {visibleNotifs.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto aw-noscroll pb-0.5">
          <button onClick={() => setCat('all')} className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] cursor-pointer whitespace-nowrap transition-all" style={chipStyle(cat === 'all')}>
            <i className="fa-solid fa-layer-group text-[10px]" />همه
          </button>
          {activeCats.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)} className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] cursor-pointer whitespace-nowrap transition-all" style={chipStyle(cat === c.key)}>
              <i className={`${c.icon} text-[10px]`} />{c.label}
              <span className="text-[9px] opacity-80">({toFa(visibleNotifs.filter(n => catOf(n) === c.key).length)})</span>
            </button>
          ))}
        </div>
      )}
      {/* Grouped by category (all view) or a flat group for the picked category */}
      {cat === 'all'
        ? NOTIF_CATS.map(renderGroup)
        : NOTIF_CATS.filter(c => c.key === cat).map(renderGroup)}
      {visibleNotifs.length === 0 && (
        <div className="text-center py-10 text-[var(--aw-text-muted)]">
          <i className="fa-solid fa-bell-slash text-3xl mb-3 block opacity-40" />
          <div className="text-[13px]">اعلانی وجود ندارد</div>
        </div>
      )}
    </div>
  );
}

function SearchContent() {
  const [query, setQuery] = useState('');
  const { agents, personnel, customers, deals, closeModal, openChat, openModal } = useApp();

  const results: { name: string; sub: string; icon: string; bg: string; init: string; action: () => void }[] = [];

  if (query.trim()) {
    agents.filter(a => a.name.includes(query) || a.role.includes(query)).forEach(a => {
      results.push({
        name: a.name, sub: a.role, icon: 'fa-solid fa-robot', bg: a.bg, init: a.init,
        action: () => { closeModal(); if (!a.locked) setTimeout(() => openChat(a.id, 'agent'), 200); }
      });
    });
    personnel.filter(p => p.name.includes(query) || p.role.includes(query)).forEach(p => {
      results.push({
        name: p.name, sub: p.role, icon: 'fa-solid fa-user-tie', bg: p.bg, init: p.init,
        action: () => { closeModal(); setTimeout(() => openChat(p.id, 'personnel'), 200); }
      });
    });
    customers.filter(c => c.name.includes(query) || c.contact.includes(query)).forEach(c => {
      results.push({
        name: c.name, sub: c.contact, icon: 'fa-solid fa-user', bg: 'aw-bg-cyan', init: c.name[0],
        action: () => { closeModal(); setTimeout(() => openModal(c.name, <CustomerDetailContent customerId={c.id} />), 200); }
      });
    });
    deals.filter(d => d.title.includes(query) || d.customer.includes(query)).forEach(d => {
      results.push({
        name: d.title, sub: d.customer, icon: 'fa-solid fa-handshake', bg: 'aw-bg-green', init: d.title[0],
        action: () => { closeModal(); setTimeout(() => openModal(d.title, <DealDetailContent dealId={d.id} />), 200); }
      });
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
        <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
        <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]" placeholder="جستجو در همه بخش‌ها..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        {query && (
          <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer text-sm" onClick={() => setQuery('')}>
            <i className="fa-solid fa-times" />
          </button>
        )}
      </div>
      <div className="mt-3">
        {results.length > 0 ? results.map((r, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-[10px] mb-1 cursor-pointer border border-[var(--aw-border)] hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }} onClick={r.action}>
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] ${r.bg}`} style={{ fontWeight: 700 }}>{r.init}</div>
            <div className="flex-1">
              <span className="text-[13px]" style={{ fontWeight: 500 }}>{r.name}</span>
              <span className="text-[11px] text-[var(--aw-text-muted)] mr-2">— {r.sub}</span>
            </div>
          </div>
        )) : query ? <div className="text-center py-8 text-[var(--aw-text-muted)] text-[13px]">نتیجه‌ای یافت نشد</div> : (
          <div className="text-center py-8 text-[var(--aw-text-muted)] text-[13px]">عبارت مورد نظر را تایپ کنید...</div>
        )}
      </div>
    </div>
  );
}

export function SubscribeContent({ agentId }: { agentId: string }) {
  const { agents, setAgents, closeModal, showToast, buyAgent } = useApp();
  const a = agents.find(x => x.id === agentId);
  if (!a) return null;
  // subprice: قیمتِ واقعی از AGENT_MARKETPLACE (نه «۴۹,۰۰۰»ِ ثابتِ غلط)
  const __mktPrice = ((AGENT_MARKETPLACE as any[]).find((m: any) => m.name === a.name) as any)?.price || '';

  const activate = () => {
    buyAgent(agentId);
    setAgents(prev => prev.map(ag => ag.id === agentId ? { ...ag, locked: false, instructions: ag.instructions || 'دستورالعمل پیش‌فرض عامل ' + ag.name } : ag));
    closeModal();
    showToast(a.name + ' فعال شد!');
  };

  return (
    <div>
      <div className="text-center mb-5">
        <div className="mx-auto mb-2.5 w-16" style={{ display: 'flex', justifyContent: 'center' }}><AgentCircle agent={a} size={64} radius={999} fontSize={26} /></div>
        <h3 className="text-base">{a.name}</h3>
        <p className="text-[12px] text-[var(--aw-text-secondary)]">{a.role}</p>
      </div>
      <div className="rounded-[10px] p-4 mb-4 text-center border" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
        {__mktPrice
          ? <div className="text-[20px] text-[var(--aw-primary)]" style={{ fontWeight: 800 }}>{__mktPrice}</div>
          : <div className="text-[15px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>فعال‌سازیِ ایجنت</div>}
      </div>
      <ul className="list-none p-0 mb-4">
        {['پاسخ‌دهی ۲۴ ساعته', 'یکپارچه‌سازی با سیستم‌ها', 'گزارش‌گیری پیشرفته'].map(f => (
          <li key={f} className="py-1.5 text-[12px] flex items-center gap-1.5">
            <i className="fa-solid fa-check-circle text-[var(--aw-secondary)]" /> {f}
          </li>
        ))}
      </ul>
      <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={activate}>
        <i className="fa-solid fa-shopping-cart" /> خرید اشتراک
      </button>
    </div>
  );
}

export function CustomerDetailContent({ customerId }: { customerId: string }) {
  const { customers, setCustomers, upsertCustomer, dropCustomer, closeModal, showToast, startCall, openChat } = useApp();
  const c = customers.find(x => x.id === customerId);
  if (!c) return null;

  const update = (field: keyof Customer, val: string) => {
    const nc: any = { ...c, [field]: val };
    setCustomers(prev => prev.map(cu => cu.id === customerId ? nc : cu));
    upsertCustomer(nc);
  };

  const handleDelete = () => {
    dropCustomer(customerId);
    closeModal();
    showToast(c.name + ' حذف شد');
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className="flex justify-center mx-auto mb-2.5"><LetterAvatar name={c.name} size={56} radius={16} /></div>
        <h3 className="text-base">{c.name}</h3>
        <p className="text-[12px] text-[var(--aw-text-secondary)]">{STATUS_LABELS[c.status]}</p>
      </div>
      <FormGroup label="نام مخاطب"><FormInput value={c.contact} onChange={e => update('contact', e.target.value)} /></FormGroup>
      <FormGroup label="تلفن"><FormInput value={c.phone} onChange={e => update('phone', e.target.value)} /></FormGroup>
      <FormGroup label="ایمیل"><FormInput value={c.email} onChange={e => update('email', e.target.value)} /></FormGroup>
      <FormGroup label="وضعیت">
        <FormSelect value={c.status} onChange={e => update('status', e.target.value as any)} options={[{ value: 'active', label: 'فعال' }, { value: 'lead', label: 'سرنخ' }, { value: 'inactive', label: 'غیرفعال' }]} />
      </FormGroup>
      <div className="flex gap-2 mb-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-eu-primary, #7B62FC)', fontWeight: 600 }}
          onClick={() => { closeModal(); setTimeout(() => openChat(customerId, 'customer'), 200); }}>
          <i className="fa-solid fa-comment" /> چت
        </button>
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-secondary)', fontWeight: 600 }}
          onClick={() => { closeModal(); startCall(c.name, 'مشتری', 'aw-bg-cyan', c.name[0], ''); }}>
          <i className="fa-solid fa-phone" /> تماس
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); showToast('تغییرات ذخیره شد'); }}>
          <i className="fa-solid fa-save" /> ذخیره
        </button>
      </div>
      <button className="w-full py-2 px-5 rounded-[10px] text-[12px] cursor-pointer border border-[var(--aw-danger)] text-[var(--aw-danger)] bg-transparent" style={{ fontWeight: 600 }} onClick={handleDelete}>
        <i className="fa-solid fa-trash" /> حذف مشتری
      </button>
    </div>
  );
}

function DealDetailContent({ dealId }: { dealId: string }) {
  const { deals, setDeals, closeModal, showToast } = useApp();
  const d = deals.find(x => x.id === dealId);
  if (!d) return null;

  const update = (field: keyof Deal, val: string) => {
    setDeals(prev => prev.map(de => de.id === dealId ? { ...de, [field]: val } : de));
    try { (api as any).update('deals', dealId, { [field]: val }); } catch (_) {}
  };

  const handleDelete = () => {
    setDeals(prev => prev.filter(de => de.id !== dealId));
    closeModal();
    showToast('معامله حذف شد');
  };

  return (
    <div>
      <FormGroup label="عنوان"><FormInput value={d.title} onChange={e => update('title', e.target.value)} /></FormGroup>
      <FormGroup label="مشتری"><FormInput value={d.customer} onChange={e => update('customer', e.target.value)} /></FormGroup>
      <FormGroup label="ارزش"><FormInput value={d.value} onChange={e => update('value', e.target.value)} /></FormGroup>
      <FormGroup label="احتمال"><FormInput value={d.probability} onChange={e => update('probability', e.target.value)} /></FormGroup>
      <FormGroup label="مرحله">
        <FormSelect value={d.stage} onChange={e => update('stage', e.target.value as any)} options={[{ value: 'negotiation', label: 'مذاکره' }, { value: 'proposal', label: 'پیشنهاد' }, { value: 'closed', label: 'بسته شده' }]} />
      </FormGroup>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); showToast('تغییرات ذخیره شد'); }}>ذخیره</button>
        <button className="py-2.5 px-5 rounded-[10px] text-[13px] cursor-pointer border border-[var(--aw-danger)] text-[var(--aw-danger)] bg-transparent" style={{ fontWeight: 600 }} onClick={handleDelete}>
          <i className="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  );
}

function GlassSelect({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const cur = options.find(o => o.value === value);
  const glass = { background: 'color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 14%, var(--aw-bg-card))', borderColor: 'color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 40%, transparent)', color: 'var(--aw-eu-primary, var(--aw-primary))' };
  return (
    <div ref={ref} className="flex-1 relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="aw-no-pill w-full rounded-full border cursor-pointer px-3.5 py-2.5 text-[12px] flex items-center justify-between gap-2"
        style={{ ...glass, fontFamily: "'Kamand','Vazirmatn',sans-serif", fontWeight: 700, backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        <span>{cur?.label}</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[9px] opacity-70`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className="absolute z-[60] left-0 right-0 mt-1.5 rounded-[16px] overflow-hidden p-1"
            style={{ background: 'color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 12%, var(--aw-bg-modal))', border: '1px solid color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 30%, var(--aw-border))', backdropFilter: 'blur(24px) saturate(1.5)', WebkitBackdropFilter: 'blur(24px) saturate(1.5)', boxShadow: '0 12px 30px rgba(0,0,0,0.28)' }}>
            {options.map(o => {
              const on = o.value === value;
              return (
                <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                  className="aw-no-pill w-full text-right rounded-[11px] px-3 py-2 text-[12px] cursor-pointer border-none flex items-center justify-between gap-2"
                  style={on ? { background: 'color-mix(in srgb, var(--aw-eu-primary, var(--aw-primary)) 26%, transparent)', color: 'var(--aw-eu-primary, var(--aw-primary))', fontWeight: 700 } : { background: 'transparent', color: 'var(--aw-text-primary)', fontWeight: 600 }}>
                  <span>{o.label}</span>
                  {on && <i className="fa-solid fa-check text-[10px]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewChatContent() {
  const { chatTab, setChatTab, agents, customers, setCustomers, upsertCustomer, personnel, setPersonnel, company, closeModal, showToast, openChat } = useApp();
  // Three list sections: کارکنان (personnel), مخاطبان (contacts), عامل‌ها (agents)
  const initList: 'personnel' | 'customers' | 'agents' =
    chatTab === 'personnel' ? 'personnel' : chatTab === 'agents' ? 'agents' : 'customers';
  const [listTab, setListTab] = useState<'personnel' | 'customers' | 'agents'>(initList);
  const [activeSection, setActiveSection] = useState<'add' | 'select'>('add');
  const [agentTab, setAgentTab] = useState<'mine' | 'others'>('mine');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const listTabs = [
    { id: 'personnel' as const, label: 'کارکنان', icon: 'fa-solid fa-id-badge' },
    { id: 'customers' as const, label: 'مخاطبان', icon: 'fa-solid fa-address-book' },
    { id: 'agents' as const, label: 'عامل‌ها', icon: 'fa-solid fa-robot' },
  ];

  // Agents split: mine vs other companies'
  const myAgents = agents.filter(a => (!a.company || a.company === company) && !a.locked);
  const otherAgents = agents.filter(a => a.company && a.company !== company);

  const sectionTabs = listTab === 'personnel'
    ? [
        { id: 'add' as const, label: 'افزودن پرسنل جدید', icon: 'fa-solid fa-user-plus' },
        { id: 'select' as const, label: 'انتخاب از لیست', icon: 'fa-solid fa-list' },
      ]
    : [
        { id: 'add' as const, label: 'افزودن مخاطب جدید', icon: 'fa-solid fa-user-plus' },
        { id: 'select' as const, label: 'انتخاب از لیست', icon: 'fa-solid fa-list' },
      ];

  const startAgentChat = (id: string) => { closeModal(); setChatTab('agents'); setTimeout(() => openChat(id, 'agent'), 100); };

  const saveAndChat = () => {
    if (!name.trim()) return;
    if (listTab === 'personnel') {
      const newId = 'p' + Date.now();
      const newPerson = {
        id: newId,
        name: name.trim(),
        role: role.trim() || 'کارمند',
        status: 'online' as const,
        bg: 'aw-bg-indigo',
        init: name.trim()[0],
        lastMsg: '',
        lastTime: 'الان',
        unread: 0,
        voip: phone.trim(),
      };
      setPersonnel(prev => [...prev, newPerson]);
      setChatTab('personnel');
      closeModal();
      showToast('پرسنل جدید اضافه شد');
      setTimeout(() => openChat(newId, 'personnel'), 100);
    } else {
      const newId = 'c' + Date.now();
      const newCustomer = {
        id: newId,
        name: name.trim(),
        contact: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        status: 'active' as const,
        value: '۰',
        lastContact: 'امروز',
      };
      upsertCustomer(newCustomer);
      setChatTab('customers');
      closeModal();
      showToast('مخاطب جدید اضافه شد');
      setTimeout(() => openChat(newId, 'customer'), 100);
    }
  };

  const existingList = listTab === 'personnel' ? personnel : customers;

  const agentRow = (a: any, badge?: string) => (
    <div
      key={a.id}
      className="flex items-center gap-3 p-3 rounded-[12px] cursor-pointer transition-all mb-1 border border-transparent hover:bg-[var(--aw-bg-card-hover)] hover:border-[var(--aw-primary)]"
      onClick={() => startAgentChat(a.id)}
    >
      <AgentCircle agent={a} size={40} radius={12} fontSize={15} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] truncate" style={{ fontWeight: 600 }}>{a.name}</div>
        <div className="text-[11px] text-[var(--aw-text-muted)] truncate">{badge ? badge + ' · ' : ''}{a.role}</div>
      </div>
      <i className="fa-solid fa-comment-dots text-[var(--aw-primary)] text-sm" />
    </div>
  );

  return (
    <div>
      {/* Category dropdown (right) + action dropdown (left) on one row */}
      <div className="flex items-center gap-2 mb-3">
        <GlassSelect value={listTab} options={listTabs.map(t => ({ value: t.id, label: t.label }))} onChange={v => { setListTab(v as any); setActiveSection('select'); }} />
        {listTab === 'agents'
          ? <GlassSelect value={agentTab} options={[{ value: 'mine', label: 'عامل‌های من' }, { value: 'others', label: 'عامل‌های دیگر' }]} onChange={v => setAgentTab(v as any)} />
          : <GlassSelect value={activeSection} options={sectionTabs.map(t => ({ value: t.id, label: t.label }))} onChange={v => setActiveSection(v as any)} />}
      </div>

      {listTab === 'agents' ? (
        <div>
          <div className="max-h-[340px] overflow-y-auto aw-scroll">
            {agentTab === 'mine' ? (
              <>
                {myAgents.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-[var(--aw-text-muted)]">عاملی وجود ندارد</div>
                )}
                {myAgents.map(a => agentRow(a))}
              </>
            ) : (
              <>
                {otherAgents.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-[var(--aw-text-muted)]">عاملی از شرکت‌های دیگر در دسترس نیست</div>
                )}
                {otherAgents.map(a => agentRow(a, COMPANIES[a.company || '']?.name))}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {activeSection === 'add' ? (
            <div>
              <FormGroup label="نام">
                <FormInput placeholder={listTab === 'personnel' ? 'نام کارمند را وارد کنید' : 'نام مخاطب را وارد کنید'} value={name} onChange={e => setName(e.target.value)} />
              </FormGroup>
              {listTab === 'personnel' && (
                <FormGroup label="سمت">
                  <FormInput placeholder="سمت یا نقش" value={role} onChange={e => setRole(e.target.value)} />
                </FormGroup>
              )}
              <FormGroup label="شماره تماس">
                <FormInput placeholder="شماره تماس" value={phone} onChange={e => setPhone(e.target.value)} />
              </FormGroup>
              {listTab !== 'personnel' && (
                <FormGroup label="ایمیل">
                  <FormInput placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)} />
                </FormGroup>
              )}
              <button
                className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }}
                disabled={!name.trim()}
                onClick={saveAndChat}
              >
                <i className="fa-solid fa-plus ml-1.5" />
                افزودن و شروع گفتگو
              </button>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto aw-scroll">
              {existingList.length === 0 && (
                <div className="text-center py-8 text-[var(--aw-text-muted)]">
                  <i className="fa-solid fa-inbox text-[32px] opacity-30 block mb-3" />
                  <p className="text-[13px]">لیست خالی است</p>
                </div>
              )}
              {existingList.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-[12px] cursor-pointer transition-all mb-1 border border-transparent hover:bg-[var(--aw-bg-card-hover)] hover:border-[var(--aw-primary)]"
                  onClick={() => {
                    closeModal();
                    openChat(item.id, listTab === 'personnel' ? 'personnel' : 'customer');
                  }}
                >
                  <LetterAvatar name={item.name} init={item.init} size={40} radius={12} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]" style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="text-[11px] text-[var(--aw-text-muted)]">{item.role || item.contact || ''}</div>
                  </div>
                  <i className="fa-solid fa-comment-dots text-[var(--aw-primary)] text-sm" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CrmAddContent() {
  const { crmTab, customers, setCustomers, upsertCustomer, deals, setDeals, closeModal, showToast, company } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // Deal fields
  const [dealTitle, setDealTitle] = useState('');
  const [dealCustomer, setDealCustomer] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [dealStage, setDealStage] = useState<'negotiation' | 'proposal' | 'closed'>('negotiation');

  const saveCustomer = () => {
    if (!name) return;
    upsertCustomer({ id: 'c' + Date.now(), name, contact: name, phone, email, status: crmTab === 'leads' ? 'lead' as const : 'active' as const, value: '۰', lastContact: 'امروز' });
    closeModal();
    showToast((crmTab === 'leads' ? 'سرنخ' : 'مشتری') + ' جدید اضافه شد');
  };

  const saveDeal = () => {
    if (!dealTitle) return;
    const _dl: any = { id: 'd' + Date.now(), title: dealTitle, customer: dealCustomer, value: dealValue, stage: dealStage, probability: dealStage === 'closed' ? '۱۰۰٪' : '۵۰٪', company };
    try { (api as any).create('deals', _dl); } catch (_) {}
    setDeals(prev => [...prev, _dl]);
    closeModal();
    showToast('معامله جدید اضافه شد', 'success');
  };

  if (crmTab === 'deals') {
    return (
      <div>
        <FormGroup label="عنوان معامله"><FormInput placeholder="عنوان معامله" value={dealTitle} onChange={e => setDealTitle(e.target.value)} /></FormGroup>
        <FormGroup label="مشتری">
          <FormSelect value={dealCustomer} onChange={e => setDealCustomer(e.target.value)} options={[{ value: '', label: 'انتخاب مشتری...' }, ...customers.map(c => ({ value: c.name, label: c.name }))]} />
        </FormGroup>
        <FormGroup label="ارزش (ریال)"><FormInput placeholder="مبلغ" value={dealValue} onChange={e => setDealValue(e.target.value)} /></FormGroup>
        <FormGroup label="مرحله">
          <FormSelect value={dealStage} onChange={e => setDealStage(e.target.value as any)} options={[{ value: 'negotiation', label: 'مذاکره' }, { value: 'proposal', label: 'پیشنهاد' }, { value: 'closed', label: 'بسته شده' }]} />
        </FormGroup>
        <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={saveDeal}>ذخیره معامله</button>
      </div>
    );
  }

  return (
    <div>
      <FormGroup label="نام"><FormInput placeholder="نام را وارد کنید" value={name} onChange={e => setName(e.target.value)} /></FormGroup>
      <FormGroup label="شماره تماس"><FormInput placeholder="شماره تماس" value={phone} onChange={e => setPhone(e.target.value)} /></FormGroup>
      <FormGroup label="ایمیل"><FormInput placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)} /></FormGroup>
      <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={saveCustomer}>ذخیره</button>
    </div>
  );
}

function FinDetailContent({ itemId }: { itemId: string }) {
  const { financeData, setFinanceData, closeModal, showToast } = useApp();
  const f = [...financeData.income, ...financeData.expense].find(x => x.id === itemId);
  if (!f) return null;

  const markPaid = () => {
    setFinanceData(prev => ({
      income: prev.income.map(fi => fi.id === itemId ? { ...fi, status: 'paid' as const } : fi),
      expense: prev.expense.map(fi => fi.id === itemId ? { ...fi, status: 'paid' as const } : fi),
    }));
    showToast('وضعیت به پرداخت شده تغییر یافت');
    closeModal();
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-[28px]" style={{ fontWeight: 800, color: f.status === 'paid' ? 'var(--aw-secondary)' : 'var(--aw-accent)' }}>{f.amount}</div>
        <div className="text-[12px] text-[var(--aw-text-muted)]">ریال</div>
      </div>
      <FormGroup label="شرح"><div className="w-full p-2.5 rounded-[10px] text-[13px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>{f.desc}</div></FormGroup>
      <FormGroup label="تاریخ"><div className="w-full p-2.5 rounded-[10px] text-[13px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>{f.date}</div></FormGroup>
      <FormGroup label="دسته‌بندی"><div className="w-full p-2.5 rounded-[10px] text-[13px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>{f.category}</div></FormGroup>
      <FormGroup label="وضعیت">
        <div className="w-full p-2.5 rounded-[10px] text-[13px] border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}>
          <span className="px-2 py-0.5 rounded-[20px] text-[10px]" style={{ background: f.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: f.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
            {f.status === 'paid' ? 'پرداخت شده' : 'معوق'}
          </span>
        </div>
      </FormGroup>
      <div className="flex gap-2">
        {f.status === 'pending' && (
          <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-secondary)', fontWeight: 600 }} onClick={markPaid}>
            <i className="fa-solid fa-check" /> تایید پرداخت
          </button>
        )}
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={closeModal}>بستن</button>
      </div>
    </div>
  );
}

function FinAddContent({ type }: { type: 'income' | 'expense' }) {
  const { setFinanceData, closeModal, showToast } = useApp();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const save = () => {
    if (!desc || !amount) return;
    const newItem: FinanceItem = {
      id: 'f' + Date.now(),
      desc,
      amount,
      date: 'امروز',
      status: 'pending',
      category: category || (type === 'income' ? 'فروش' : 'عمومی'),
    };
    setFinanceData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem],
    }));
    closeModal();
    showToast((type === 'income' ? 'درآمد' : 'هزینه') + ' جدید ثبت شد');
  };

  return (
    <div>
      <FormGroup label="شرح"><FormInput placeholder="شرح تراکنش" value={desc} onChange={e => setDesc(e.target.value)} /></FormGroup>
      <FormGroup label="مبلغ (ریال)"><FormInput placeholder="مبلغ" value={amount} onChange={e => setAmount(e.target.value)} /></FormGroup>
      <FormGroup label="دسته‌بندی"><FormInput placeholder="دسته‌بندی" value={category} onChange={e => setCategory(e.target.value)} /></FormGroup>
      <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={save}>ثبت</button>
    </div>
  );
}

function CompanyDetailSettings({ companyKey, onBack }: { companyKey: string; onBack: () => void }) {
  const { companies, company, setCompany, updateCompany, removeCompany, showToast } = useApp();
  const c = companies[companyKey];
  const [name, setName] = useState(c?.name || '');
  const [type, setType] = useState(c?.type || 'تولیدی');
  const [phone, setPhone] = useState(c?.phone || '');
  const [address, setAddress] = useState(c?.address || '');
  const [logo, setLogo] = useState<string | null>(c?.logo || null);
  const [accent, setAccent] = useState<string | null>(c?.accent || null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith('image/')) { showToast('فقط فایل تصویری مجاز است'); return; }
    if (f.size > 2 * 1024 * 1024) { showToast('حجم تصویر کمتر از ۲ مگابایت'); return; }
    const r = new FileReader(); r.onload = () => setLogo(String(r.result)); r.readAsDataURL(f); e.target.value = '';
  };
  const [confirmDel, setConfirmDel] = useState(false);
  if (!c) return <div className="p-4 text-[13px] text-[var(--aw-text-muted)]">شرکت یافت نشد</div>;
  const active = companyKey === company;
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };
  const save = () => { if (!name.trim()) { showToast('نام شرکت را وارد کنید'); return; } updateCompany(companyKey, { name: name.trim(), type, phone, address, logo: logo || undefined, accent: accent || undefined }); showToast('تغییرات شرکت ذخیره شد ✅', 'success'); onBack(); };
  return (
    <div className="flex flex-col gap-3 p-1">
      <button onClick={onBack} className="self-start flex items-center gap-1.5 text-[12px] text-[var(--aw-eu-primary)] bg-transparent border-none cursor-pointer" style={{ fontWeight: 600 }}>
        <i className="fa-solid fa-arrow-right text-[11px]" /> بازگشت به فهرست
      </button>
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--aw-primary-bg)' }}>
        <button onClick={() => logoInputRef.current?.click()} className="w-12 h-12 rounded-[10px] overflow-hidden flex items-center justify-center text-white flex-shrink-0 cursor-pointer relative border-none" style={{ background: logo ? 'transparent' : 'var(--aw-primary)' }} title="تغییر لوگو">
          {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-building text-[20px]" />}
          <span className="absolute bottom-0 left-0 right-0 text-[8px] text-white text-center" style={{ background: 'rgba(0,0,0,0.45)' }}><i className="fa-solid fa-camera" /></span>
        </button>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] truncate" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{name || c.name}</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">{type}</div>
        </div>
        {active
          ? <span className="text-[9px] px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--aw-primary)', fontWeight: 700 }}>فعال</span>
          : <button onClick={() => { setCompany(companyKey); showToast('فضای کاری: ' + (name || c.name)); }} className="text-[10px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white" style={{ background: 'var(--aw-primary)', fontWeight: 700 }}>فعال‌سازی</button>}
      </div>
      <FormGroup label="نام شرکت *"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></FormGroup>
      <FormGroup label="نوع فعالیت">
        <select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
          {['تولیدی', 'صنعتی', 'بازرگانی', 'خدمات', 'کافه و رستوران', 'فناوری', 'پخش و توزیع', 'استارتاپ'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </FormGroup>
      <FormGroup label="شماره تماس"><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="۰۲۱..." /></FormGroup>
      <FormGroup label="آدرس"><textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="آدرس دفتر مرکزی..." /></FormGroup>
      <FormGroup label="رنگ تم شرکت">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAccent(null)} title="پیش‌فرض" className="w-8 h-8 rounded-full cursor-pointer flex items-center justify-center p-0"
            style={{ border: accent === null ? '2px solid var(--aw-primary)' : '1px solid var(--aw-border)', background: 'var(--aw-bg-input)', color: 'var(--aw-text-muted)' }}>
            <i className="fa-solid fa-ban text-[12px]" />
          </button>
          {ACCENT_PALETTE.map(cc => (
            <button key={cc} onClick={() => setAccent(cc)} className="w-8 h-8 rounded-full cursor-pointer p-0 flex items-center justify-center"
              style={{ background: cc, border: accent === cc ? '2px solid var(--aw-text-primary)' : '1px solid rgba(0,0,0,0.15)', boxShadow: accent === cc ? '0 0 0 2px var(--aw-bg-modal), 0 0 0 4px ' + cc : 'none' }}>
              {accent === cc && <i className="fa-solid fa-check text-white text-[11px]" />}
            </button>
          ))}
        </div>
      </FormGroup>
      <button onClick={save} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>
        <i className="fa-solid fa-check-circle ml-1.5" />ذخیره تغییرات
      </button>
      {Object.keys(companies).length > 1 && (
        confirmDel ? (
          <div className="mt-1 p-3 rounded-[10px]" style={{ background: 'var(--aw-danger-bg, rgba(239,68,68,0.1))', border: '1px solid var(--aw-danger)' }}>
            <div className="text-[12px] text-center mb-3" style={{ color: 'var(--aw-text-primary)', fontWeight: 600 }}>
              حذف شرکت «{name || c.name}»؟ این عمل قابل بازگشت نیست.
            </div>
            <div className="flex gap-2">
              <button onClick={() => { removeCompany(companyKey); showToast(`شرکت «${name || c.name}» حذف شد`, 'success'); onBack(); }}
                className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-danger)', fontWeight: 700 }}>
                بله، حذف کن
              </button>
              <button onClick={() => setConfirmDel(false)}
                className="flex-1 py-2.5 rounded-[10px] cursor-pointer text-[13px] border border-[var(--aw-border)]" style={{ background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 600 }}>
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-danger)', color: 'var(--aw-danger)', fontWeight: 700 }}>
            <i className="fa-solid fa-trash-can" />حذف این شرکت
          </button>
        )
      )}
    </div>
  );
}

function CompaniesSettingsContent() {
  const { companies, company, openModal, showToast } = useApp();
  const reopenSelf = () => openModal('تنظیمات شرکت‌ها', <CompaniesSettingsContent />);
  return (
    <div className="flex flex-col gap-2 p-1">
      {Object.entries(companies).map(([k, v]) => {
        const active = k === company;
        return (
          <button key={k} onClick={() => openModal('تنظیمات: ' + v.name, <CompanyDetailSettings companyKey={k} onBack={reopenSelf} />, reopenSelf)}
            className="w-full flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border text-right transition-colors"
            style={{ background: active ? 'var(--aw-primary-bg)' : 'var(--aw-bg-card)', borderColor: active ? 'var(--aw-primary)' : 'var(--aw-border)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: active ? 'var(--aw-primary)' : 'var(--aw-bg-input)', color: active ? '#fff' : 'var(--aw-text-secondary)' }}>
              <i className="fa-solid fa-building text-[14px]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{v.name}</div>
              <div className="text-[11px] text-[var(--aw-text-muted)]">{v.type}</div>
            </div>
            {active && <span className="text-[9px] px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: 'var(--aw-primary)', fontWeight: 700 }}>فعال</span>}
            <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)] flex-shrink-0" />
          </button>
        );
      })}
      <button onClick={() => openModal('افزودن شرکت', <AddCompanyContent />, reopenSelf)}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-[10px] cursor-pointer border border-dashed text-[13px] mt-1"
        style={{ borderColor: 'var(--aw-border)', background: 'transparent', color: 'var(--aw-eu-primary)', fontWeight: 700 }}>
        <i className="fa-solid fa-plus" />افزودن شرکت جدید
      </button>
    </div>
  );
}

function AddCompanyContent() {
  const { addCompany, closeModal, showToast } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState('تولیدی');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [accent, setAccent] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith('image/')) { showToast('فقط فایل تصویری مجاز است'); return; }
    if (f.size > 2 * 1024 * 1024) { showToast('حجم تصویر کمتر از ۲ مگابایت'); return; }
    const r = new FileReader(); r.onload = () => setLogo(String(r.result)); r.readAsDataURL(f); e.target.value = '';
  };
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };
  const submit = () => {
    if (!name.trim()) { showToast('نام شرکت را وارد کنید'); return; }
    addCompany(name.trim(), type, { phone, address, logo: logo || undefined, accent: accent || undefined });
    closeModal();
    showToast(`شرکت «${name.trim()}» افزوده و انتخاب شد ✅`, 'success');
  };
  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--aw-primary-bg)' }}>
        <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--aw-primary)' }}>
          <i className="fa-solid fa-building text-[18px]" />
        </div>
        <div>
          <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>افزودن فضای کاری جدید</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">یک شرکت جدید بسازید و به آن جابه‌جا شوید</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 mb-1">
        <button onClick={() => logoInputRef.current?.click()} className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer relative" style={{ background: logo ? 'transparent' : 'var(--aw-bg-input)', border: '2px dashed var(--aw-border)' }}>
          {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-image text-[22px] text-[var(--aw-text-muted)]" />}
          <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white py-0.5 text-center" style={{ background: 'rgba(0,0,0,0.45)' }}><i className="fa-solid fa-camera" /></span>
        </button>
        <span className="text-[10px] text-[var(--aw-text-muted)]">آپلود لوگو / عکس شرکت</span>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
      </div>
      <FormGroup label="نام شرکت *"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="مثلاً شرکت گاما تجارت" /></FormGroup>
      <FormGroup label="نوع فعالیت">
        <select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
          {['تولیدی', 'صنعتی', 'بازرگانی', 'خدمات', 'کافه و رستوران', 'فناوری', 'پخش و توزیع', 'استارتاپ'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </FormGroup>
      <FormGroup label="شماره تماس"><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="۰۲۱..." /></FormGroup>
      <FormGroup label="آدرس"><textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="آدرس دفتر مرکزی..." /></FormGroup>
      <FormGroup label="رنگ تم شرکت">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAccent(null)} title="پیش‌فرض" className="w-8 h-8 rounded-full cursor-pointer flex items-center justify-center p-0"
            style={{ border: accent === null ? '2px solid var(--aw-primary)' : '1px solid var(--aw-border)', background: 'var(--aw-bg-input)', color: 'var(--aw-text-muted)' }}>
            <i className="fa-solid fa-ban text-[12px]" />
          </button>
          {ACCENT_PALETTE.map(c => (
            <button key={c} onClick={() => setAccent(c)} className="w-8 h-8 rounded-full cursor-pointer p-0 flex items-center justify-center"
              style={{ background: c, border: accent === c ? '2px solid var(--aw-text-primary)' : '1px solid rgba(0,0,0,0.15)', boxShadow: accent === c ? '0 0 0 2px var(--aw-bg-modal), 0 0 0 4px ' + c : 'none' }}>
              {accent === c && <i className="fa-solid fa-check text-white text-[11px]" />}
            </button>
          ))}
        </div>
      </FormGroup>
      <button onClick={submit} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'var(--aw-primary)', fontWeight: 700, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>
        <i className="fa-solid fa-circle-plus ml-1.5" />ثبت شرکت
      </button>
    </div>
  );
}

export function AgentSettingsContent({ onBack }: { onBack?: () => void } = {}) {
  const { agents, company, openModal, closeModal, defaultAgent, setDefaultAgent, showToast } = useApp();
  const companyAgents = agents
    .filter(a => !a.company || a.company === company)
    .sort((a, b) => (b.id === defaultAgent ? 1 : 0) - (a.id === defaultAgent ? 1 : 0));
  const [selected, setSelected] = useState<string | null>(null);
  const reopenSelf = () => openModal('تنظیمات عامل‌ها', <AgentSettingsContent onBack={onBack} />, onBack);
  const canSave = !!selected && selected !== defaultAgent;
  // The 6 fixed role categories — match by canonical team, then role keyword / id
  const ROLE_CATS = [
    { key: 'secretary', label: 'منشی', icon: 'fa-solid fa-calendar-days', kw: 'منشی', ids: ['secretary', 'm1'] },
    { key: 'marketing', label: 'بازاریاب', icon: 'fa-solid fa-bullhorn', kw: 'بازاریاب', ids: ['marketing', 'm2'] },
    { key: 'procurement', label: 'خرید/تدارکات', icon: 'fa-solid fa-boxes-stacked', kw: 'تدارکات', ids: ['procurement', 'm6'] },
    { key: 'finance', label: 'مالی/اداری', icon: 'fa-solid fa-sack-dollar', kw: 'مالی', ids: ['finance', 'm3'] },
    { key: 'sales', label: 'فروشنده/صندوقدار', icon: 'fa-solid fa-cart-shopping', kw: 'فروش', ids: ['sales', 'm7'] },
    { key: 'dine', label: 'داین', icon: 'fa-solid fa-utensils', kw: 'رستوران', ids: ['dine', 'm8'] },
    { key: 'assistant', label: 'دستیار شخصی', icon: 'fa-solid fa-wand-magic-sparkles', kw: 'دستیار', ids: ['assistant', 'm0'] },
  ];
  const catKey = (a: any): string | null => {
    const team = (a as any).team;
    if (team && ROLE_CATS.some(c => c.key === team)) return team;
    const c = ROLE_CATS.find(c => (a.role || '').includes(c.kw) || c.ids.some(id => (a.id || '').includes(id)));
    return c ? c.key : null;
  };
  const roleGroups: Record<string, typeof companyAgents> = {};
  companyAgents.forEach(a => { const k = catKey(a); if (k) (roleGroups[k] = roleGroups[k] || []).push(a); });

  const renderAgentRow = (a: typeof companyAgents[number]) => {
    const checked = selected ? selected === a.id : defaultAgent === a.id;
    return (
      <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-[10px] mb-1 cursor-pointer border border-[var(--aw-border)] hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }}
        onClick={() => { closeModal(); setTimeout(() => openModal('تنظیمات: ' + a.name, <CustomizeAgentContent agentId={a.id} />, reopenSelf), 200); }}>
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(prev => prev === a.id ? null : a.id); }}
          title="انتخاب به‌عنوان عامل پیش‌فرض"
          className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer flex-none border-none p-0"
          style={{ boxShadow: checked ? 'inset 0 0 0 2px var(--aw-primary)' : 'inset 0 0 0 2px var(--aw-border)', background: checked ? 'var(--aw-primary)' : 'transparent' }}
        >
          {checked && <i className="fa-solid fa-check text-white text-[10px]" />}
        </button>
        <AgentCircle agent={a} size={32} radius={8} fontSize={13} />
        <span className="flex-1 text-[13px]" style={{ fontWeight: 500 }}>{a.name}</span>
        {defaultAgent === a.id && <span className="text-[9px] px-2 py-0.5 rounded-full text-white flex-none" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}>پیش‌فرض</span>}
        {a.locked && <span className="text-[10px] text-black px-2 py-0.5 rounded-md" style={{ background: 'var(--aw-accent)', fontWeight: 700 }}><i className="fa-solid fa-lock" /></span>}
        <i className="fa-solid fa-chevron-left text-[12px] text-[var(--aw-text-muted)] flex-none" />
      </div>
    );
  };

  return (
    <div>
      {ROLE_CATS.filter(c => roleGroups[c.key]?.length).map(c => (
        <div key={c.key} className="mb-3">
          <div className="flex items-center gap-2 px-1 mb-1.5">
            <i className={`${c.icon} text-[11px] text-[var(--aw-primary)]`} />
            <span className="text-[12px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 700 }}>{c.label}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)]">({toFa(roleGroups[c.key].length)})</span>
            <div className="flex-1 h-px" style={{ background: 'var(--aw-border)' }} />
          </div>
          {roleGroups[c.key].map(renderAgentRow)}
        </div>
      ))}
      {canSave && (
        <button
          onClick={() => { setDefaultAgent(selected as string); const ag = companyAgents.find(x => x.id === selected); showToast('عامل پیش‌فرض ذخیره شد' + (ag ? ': ' + ag.name : '')); }}
          className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer mt-3"
          style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }}
        >
          <i className="fa-solid fa-check-circle ml-1.5" />
          ذخیره عامل پیش‌فرض
        </button>
      )}
    </div>
  );
}

function SingleAgentSettings({ agentId, onBack }: { agentId: string; onBack?: () => void }) {
  const { agents, setAgents, closeModal, showToast, openModal, defaultAgent, setDefaultAgent, assistantId, setAssistantId, role } = useApp();
  const isUser = role === 'user'; // singleagent: per-user
  const a = agents.find(x => x.id === agentId);
  const [confirmDel, setConfirmDel] = useState(false);
  useEffect(() => {
    if (!isUser) return;
    (async () => { try { const r: any = await (api as any).agentPrefs(agentId); const pf = (r && r.prefs) ? r.prefs : {}; if (pf.name) setAgents(prev => prev.map(ag => ag.id === agentId ? { ...ag, name: pf.name, init: (pf.name || ag.init || 'د').charAt(0) } : ag)); } catch (_) {} })();
  }, [agentId]);
  if (!a) return null;

  const update = (field: string, val: any) => {
    setAgents(prev => prev.map(ag => ag.id === agentId ? { ...ag, [field]: val } : ag));
    if (isUser) { if (field === 'name') (api as any).saveAgentPrefs(agentId, { name: val, init: (val || '').charAt(0) }).catch(() => {}); }
    else { (api as any).updateAgent(agentId, { [field]: val }).catch(() => {}); }
  };
  const reopenSelf = () => openModal('تنظیمات: ' + a.name, <SingleAgentSettings agentId={agentId} onBack={onBack} />, onBack);

  return (
    <div>
      <div className="text-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-[26px] mx-auto mb-2.5 ${a.bg}`} style={{ fontWeight: 700 }}>{a.init}</div>
        <h3 className="text-base">{a.name}</h3>
        <p className="text-[12px] text-[var(--aw-text-secondary)]">{a.role}</p>
      </div>
      <button
        onClick={() => { closeModal(); setTimeout(() => openModal('شخصی‌سازی: ' + a.name, <CustomizeAgentContent agentId={agentId} />, reopenSelf), 200); }}
        className="w-full flex items-center gap-3 p-3 rounded-[10px] mb-3 cursor-pointer border-none text-right"
        style={{ background: 'linear-gradient(135deg, #22A6F015, #1E6BFF15)', border: '1px solid #22A6F044' }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22A6F0, #1E6BFF)' }}>
          <i className="fa-solid fa-wand-magic-sparkles text-[13px] text-white" />
        </div>
        <div className="flex-1">
          <div className="text-[12px]" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>شخصی‌سازی ایجنت</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">عکس، جنسیت، صدا، سن، لحن، شرایط ارجاع</div>
        </div>
        <i className="fa-solid fa-chevron-left text-[11px] text-[var(--aw-text-muted)]" />
      </button>
      <FormGroup label="نام عامل"><FormInput value={a.name} onChange={e => update('name', e.target.value)} /></FormGroup>
      {!isUser && (<>
      <FormGroup label="نقش"><FormInput value={a.role} onChange={e => update('role', e.target.value)} /></FormGroup>
      <FormGroup label="شماره داخلی VoIP"><FormInput value={a.voip} onChange={e => update('voip', e.target.value)} /></FormGroup>
      <FormGroup label="دستورالعمل‌ها (Instructions)">
        <textarea className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y min-h-[80px]" style={{ background: 'var(--aw-bg-input)' }} value={a.instructions} onChange={e => update('instructions', e.target.value)} rows={4} />
      </FormGroup>
      <FormGroup label="وضعیت">
        <FormSelect value={String(a.locked)} onChange={e => update('locked', e.target.value === 'true')} options={[{ value: 'false', label: 'فعال' }, { value: 'true', label: 'قفل (نیاز به اشتراک)' }]} />
      </FormGroup>
      </>)}
      {isUser && (
        <div className="p-2.5 rounded-xl mb-2 flex items-center gap-2" style={{ background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)' }}>
          <i className="fa-solid fa-circle-info text-[11px]" style={{ color: 'var(--aw-primary)' }} />
          <span className="text-[10px] text-[var(--aw-text-secondary)]">نقش، دستورالعمل و وضعیت توسط مدیر سامانه تنظیم می‌شوند. برای عکس، جنسیت، صدا و لحن از «شخصی‌سازی ایجنت» استفاده کنید.</span>
        </div>
      )}
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { if (isUser) (api as any).saveAgentPrefs(agentId, { name: a.name, init: (a.name || '').charAt(0) }).catch(() => {}); closeModal(); showToast('تنظیمات ' + a.name + ' ذخیره شد'); }}>ذخیره و بستن</button>
        {!confirmDel && (
          <button onClick={() => setConfirmDel(true)} className="py-2.5 px-4 flex items-center justify-center gap-1.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent flex-shrink-0" style={{ border: '1px solid var(--aw-danger, #ef4444)', color: 'var(--aw-danger, #ef4444)', fontWeight: 700 }}>
            <i className="fa-solid fa-trash-can" />حذف
          </button>
        )}
      </div>
      {confirmDel && (
        <div className="mt-3 p-3 rounded-[10px]" style={{ background: 'var(--aw-danger-bg, rgba(239,68,68,0.1))', border: '1px solid var(--aw-danger, #ef4444)' }}>
          <div className="text-[12px] text-center mb-3" style={{ color: 'var(--aw-text-primary)', fontWeight: 600 }}>حذف عامل «{a.name}»؟ این عمل قابل بازگشت نیست.</div>
          <div className="flex gap-2">
            <button onClick={() => {
                try { (api as any).removeOwnedAgent(agentId); } catch (_e) {} setAgents(prev => prev.filter(ag => ag.id !== agentId));
                if (defaultAgent === agentId) setDefaultAgent('');
                if (assistantId === agentId) setAssistantId('assistant');
                closeModal(); showToast(`عامل «${a.name}» حذف شد`, 'success');
              }} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-danger, #ef4444)', fontWeight: 700 }}>بله، حذف کن</button>
            <button onClick={() => setConfirmDel(false)} className="flex-1 py-2.5 rounded-[10px] cursor-pointer text-[13px] border border-[var(--aw-border)]" style={{ background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 600 }}>انصراف</button>
          </div>
        </div>
      )}
    </div>
  );
}

const PERSONNEL_BG_OPTIONS = ['aw-bg-sky', 'aw-bg-emerald', 'aw-bg-amber', 'aw-bg-rose', 'aw-bg-purple', 'aw-bg-cyan', 'aw-bg-pink', 'aw-bg-indigo'];

function PersonnelSettingsContent() {
  const { personnel, setPersonnel, openModal, closeModal, showToast, companies } = useApp();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const companyKeys = Object.keys(companies || COMPANIES);
  const shownPersonnel = personnel.filter(p => companyFilter === 'all' || (p.company || '') === companyFilter);

  const addNew = () => {
    // personnelname: افزودنِ پرسنل فقط با جستجوی شمارهٔ شاهکاری؛ نام خودکار و غیرقابل ویرایش.
    openModal('افزودن پرسنل جدید', <PhonePersonnelForm onAdd={(nm: string, ph: string) => {
      const id = 'p' + Date.now();
      const newPerson: Personnel = {
        id, name: nm, role: 'کارمند', status: 'offline',
        bg: PERSONNEL_BG_OPTIONS[personnel.length % PERSONNEL_BG_OPTIONS.length],
        init: (nm && nm.charAt(0)) || 'پ', lastMsg: '', lastTime: 'اکنون', unread: 0,
        voip: String(300 + personnel.length + 1),
        email: '', phone: ph, permissions: ['dashboard'],
      };
      setPersonnel(prev => [...prev, newPerson]);
      showToast('پرسنل اضافه شد');
      closeModal();
      setTimeout(() => openModal('تنظیمات: ' + nm, <SinglePersonnelSettings personnelId={id} />), 200);
    }} />);
  };

  const removePerson = (id: string, name: string) => {
    setPersonnel(prev => prev.filter(p => p.id !== id));
    setConfirmDel(null);
    showToast(`${name} حذف شد`);
  };

  return (
    <div>
      <button onClick={addNew}
        className="w-full mb-3 py-3 px-4 rounded-[10px] border-none text-white cursor-pointer flex items-center justify-center gap-2 text-[13px]"
        style={{ background: 'linear-gradient(135deg, var(--aw-primary), var(--aw-primary-dark))', fontWeight: 700 }}>
        <i className="fa-solid fa-user-plus text-[13px]" /> افزودن پرسنل جدید
      </button>

      {companyKeys.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto aw-noscroll mb-2.5 pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCompanyFilter('all')} className="text-[11px] px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap flex-shrink-0" style={companyFilter === 'all' ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'var(--aw-primary)', fontWeight: 700 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 600 }}>همه شرکت‌ها</button>
          {companyKeys.map(k => (
            <button key={k} onClick={() => setCompanyFilter(k)} className="text-[11px] px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap flex-shrink-0" style={companyFilter === k ? { background: 'var(--aw-primary)', color: '#fff', borderColor: 'var(--aw-primary)', fontWeight: 700 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 600 }}>{(companies || COMPANIES)[k].name}</button>
          ))}
        </div>
      )}

      {shownPersonnel.map(p => (
        <div key={p.id} className="rounded-[10px] mb-1.5 border border-[var(--aw-border)] hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }}>
          <div className="flex items-center gap-3 p-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] ${p.bg}`} style={{ fontWeight: 700 }}>{p.init}</div>
            <div className="flex-1 min-w-0 cursor-pointer"
              onClick={() => { closeModal(); setTimeout(() => openModal('تنظیمات: ' + p.name, <SinglePersonnelSettings personnelId={p.id} />), 200); }}>
              <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{p.role}{p.company && COMPANIES[p.company] ? ' · ' + COMPANIES[p.company].name : ''} · {toFa((p.permissions || []).length)} سطح دسترسی</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.status === 'online' ? 'var(--aw-online)' : 'var(--aw-offline)' }} />
            <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-primary)]"
              onClick={() => { closeModal(); setTimeout(() => openModal('تنظیمات: ' + p.name, <SinglePersonnelSettings personnelId={p.id} />), 200); }}
              title="ویرایش">
              <i className="fa-solid fa-pen text-[11px]" />
            </button>
            <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[#EF4444]"
              onClick={() => setConfirmDel(confirmDel === p.id ? null : p.id)}
              title="حذف">
              <i className="fa-solid fa-trash text-[11px]" />
            </button>
          </div>
          <AnimatePresence>
            {confirmDel === p.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="px-3 pb-3 flex items-center gap-2 border-t border-[var(--aw-border)] pt-2">
                <span className="flex-1 text-[11px] text-[var(--aw-text-secondary)]">آیا از حذف {p.name} مطمئن هستید؟</span>
                <button className="px-3 py-1.5 rounded-lg border-none text-white cursor-pointer text-[11px]" style={{ background: '#EF4444', fontWeight: 600 }}
                  onClick={() => removePerson(p.id, p.name)}>حذف</button>
                <button className="px-3 py-1.5 rounded-lg border border-[var(--aw-border)] bg-transparent cursor-pointer text-[11px] text-[var(--aw-text-secondary)]"
                  onClick={() => setConfirmDel(null)}>انصراف</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function SinglePersonnelSettings({ personnelId }: { personnelId: string }) {
  const { personnel, setPersonnel, closeModal, showToast } = useApp();
  const p = personnel.find(x => x.id === personnelId);
  if (!p) return null;

  const update = (field: string, val: any) => {
    setPersonnel(prev => prev.map(pe => pe.id === personnelId ? { ...pe, [field]: val } : pe));
    try { (api as any).update('personnel', personnelId, { [field]: val }); } catch (_) {}
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-[26px] mx-auto mb-2.5 ${p.bg}`} style={{ fontWeight: 700 }}>{p.init}</div>
        <h3 className="text-base">{p.name}</h3>
        <p className="text-[12px] text-[var(--aw-text-secondary)]">{p.role}</p>
      </div>
      <FormGroup label="نقش"><FormInput value={p.role} onChange={e => update('role', e.target.value)} /></FormGroup>
      <FormGroup label="شماره موبایل / کد ملی"><FormInput value={p.phone || ''} onChange={e => update('phone', e.target.value)} /></FormGroup>

      {/* Access permissions */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] text-[var(--aw-text-secondary)] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <i className="fa-solid fa-shield-halved text-[11px] text-[var(--aw-primary)]" />
            سطح دسترسی
          </label>
          <div className="flex items-center gap-1.5">
            <button className="text-[10px] px-2 py-1 rounded-md border border-[var(--aw-border)] bg-transparent cursor-pointer text-[var(--aw-text-secondary)]"
              onClick={() => update('permissions', PERSONNEL_PERMISSIONS.map(x => x.id))}>انتخاب همه</button>
            <button className="text-[10px] px-2 py-1 rounded-md border border-[var(--aw-border)] bg-transparent cursor-pointer text-[var(--aw-text-secondary)]"
              onClick={() => update('permissions', [])}>حذف همه</button>
          </div>
        </div>
        <div className="rounded-[10px] border border-[var(--aw-border)] overflow-hidden" style={{ background: 'var(--aw-bg-card)' }}>
          {PERSONNEL_PERMISSIONS.map((perm, i) => {
            const checked = (p.permissions || []).includes(perm.id);
            return (
              <div key={perm.id}
                className={`flex items-center gap-3 p-3 cursor-pointer ${i < PERSONNEL_PERMISSIONS.length - 1 ? 'border-b border-[var(--aw-border)]' : ''}`}
                onClick={() => {
                  const current = p.permissions || [];
                  update('permissions', checked ? current.filter(x => x !== perm.id) : [...current, perm.id]);
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: perm.color + '20' }}>
                  <i className={`${perm.icon} text-[12px]`} style={{ color: perm.color }} />
                </div>
                <span className="flex-1 text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 500 }}>{perm.label}</span>
                <div className="w-9 h-5 rounded-full relative transition-colors" style={{ background: checked ? perm.color : 'var(--aw-border)' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ [checked ? 'left' : 'right']: '2px' } as any} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1.5 flex items-center gap-1">
          <i className="fa-solid fa-circle-info text-[9px]" />
          {toFa((p.permissions || []).length)} از {toFa(PERSONNEL_PERMISSIONS.length)} دسترسی فعال است
        </div>
      </div>

      <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); showToast('تنظیمات ' + p.name + ' ذخیره شد'); }}>ذخیره و بستن</button>
    </div>
  );
}

export function ProfileContent() {
  const { role, agentTeam, userProfile, euProfile, setUserProfile, setEuProfile, closeModal, showToast, agents, customers, isAgentOwned } = useApp();
  // «عامل فعال» = ایجنت‌هایی که کاربر واقعاً مالکشان است (طبقِ منطقِ مالکیتِ اپ)، نه طولِ خامِ ownedAgents
  // که بذرِ دمو همهٔ ۱۲ ایجنت را شاملش می‌کرد و «۱۲»یِ فیک نشان می‌داد.
  const activeAgentCount = (agents || []).filter((a: any) => isAgentOwned(a.id)).length;
  const useEu = role === 'user' || agentTeam === 'assistant';
  const prof = useEu ? euProfile : userProfile;
  const setProfFn = useEu ? setEuProfile : setUserProfile;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verifyStep, setVerifyStep] = useState<0 | 1 | 2 | 3>(0); // 0=hidden, 1=phone, 2=code, 3=success
  const [verifyCode, setVerifyCode] = useState('');
  const [usernameDraft, setUsernameDraft] = useState(prof.username);
  const [phoneDraft, setPhoneDraft] = useState(prof.phone);

  const onAvatarPick = (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('فقط فایل تصویری مجاز است'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('حجم تصویر باید کمتر از ۲ مگابایت باشد'); return; }
    const reader = new FileReader();
    reader.onload = () => { const __img = String(reader.result); setProfFn(p => ({ ...p, avatarImage: __img })); try { (api as any).updateMe({ prefs: { avatarImage: __img } }).catch(() => {}); } catch (_e) {} }; // __avatarPersist
    reader.readAsDataURL(file);
  };

  const removeAvatarImage = () => { setProfFn(p => ({ ...p, avatarImage: undefined })); try { (api as any).updateMe({ prefs: { avatarImage: '' } }).catch(() => {}); } catch (_e) {} };

  const startVerify = () => { setVerifyStep(1); setVerifyCode(''); setPhoneDraft(prof.phone); };
  const __fa2en = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, '');
  const sendCode = async () => {
    const digits = __fa2en(phoneDraft);
    if (!/^09\d{9}$/.test(digits)) { showToast('شماره موبایل معتبر وارد کنید (۰۹xxxxxxxxx)'); return; }
    const nid = (typeof window !== 'undefined' && window.prompt) ? (window.prompt('کد ملیِ ۱۰ رقمی:') || '') : '';
    if (!nid.trim()) return;
    const jbd = (typeof window !== 'undefined' && window.prompt) ? (window.prompt('تاریخِ تولدِ شمسی (مثال: ۱۳۷۰۰۱۰۱):') || '') : '';
    if (!jbd.trim()) return;
    try {
      const r: any = await (api as any).shahkarVerify(digits, nid.trim(), jbd.trim());
      if (r && r.ok) {
        if (!r.otpSent) { showToast('سرویسِ پیامک پیکربندی نشده؛ با پشتیبانی تماس بگیرید'); return; }
        setProfFn(p => ({ ...p, phone: digits }));
        setVerifyStep(2);
        showToast('هویت تأیید شد؛ کدِ پیامک‌شده را وارد کنید');
      }
    } catch (e: any) {
      const mp: any = { national_id_taken: 'این کد ملی قبلاً ثبت شده', shahkar_not_matched: 'این شماره به نامِ این کد ملی نیست', bad_national_id: 'کد ملی نامعتبر است', bad_birthdate: 'تاریخِ تولد را کامل وارد کنید', shahkar_not_configured: 'سرویسِ احراز هویت فعال نیست' };
      showToast(mp[e && e.message] || 'خطا در احرازِ هویت');
    }
  };
  const confirmCode = async () => {
    const code = __fa2en(verifyCode);
    if (code.length < 4) { showToast('کدِ پیامک‌شده را وارد کنید'); return; }
    const digits = __fa2en(phoneDraft);
    try {
      const r: any = await (api as any).otpVerify(digits, code);
      if (r && r.token) {
        try { const me: any = await (api as any).me(); const ok = !!(me && me.user && me.user.identityVerified);
          setProfFn(p => ({ ...p, verified: ok, name: (me && me.user && me.user.name) || p.name }));
          if (ok) { setVerifyStep(3); showToast('احراز هویت با موفقیت انجام شد'); }
          else showToast('احراز روی این حساب اعمال نشد؛ با پشتیبانی تماس بگیرید');
        } catch (_) { setVerifyStep(3); showToast('احراز هویت انجام شد'); }
      } else showToast('کدِ تأیید نادرست است');
    } catch (e: any) { showToast('کدِ تأیید نادرست است'); }
  };

  return (
    <div>
      {/* Avatar with edit overlay */}
      <div className="text-center mb-4">
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-[32px] overflow-hidden"
            style={{ background: prof.avatarImage ? 'transparent' : 'linear-gradient(135deg, var(--aw-primary), var(--aw-primary-dark))', fontWeight: 700 }}>
            {prof.avatarImage
              ? <img src={prof.avatarImage} alt={prof.name} className="w-full h-full object-cover" />
              : prof.avatar}
          </div>
          <button
            className="absolute bottom-0 left-0 w-8 h-8 rounded-full border-2 border-[var(--aw-bg-card)] cursor-pointer flex items-center justify-center text-white"
            style={{ background: 'var(--aw-primary, #2E86FF)' }}
            onClick={() => fileInputRef.current?.click()}
            title="تغییر آواتار"
          >
            <i className="fa-solid fa-camera text-[12px]" />
          </button>
          {prof.avatarImage && (
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-[var(--aw-bg-card)] cursor-pointer flex items-center justify-center text-white bg-red-500"
              onClick={removeAvatarImage}
              title="حذف تصویر"
            >
              <i className="fa-solid fa-trash text-[11px]" />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onAvatarPick(f); e.currentTarget.value = ''; }} />
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="text-lg">{prof.name}</div>
          {prof.verified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 700 }}>
              <i className="fa-solid fa-circle-check text-[10px]" /> احراز شده
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 700 }}>
              <i className="fa-solid fa-circle-exclamation text-[10px]" /> احراز نشده
            </span>
          )}
        </div>
        <div className="text-[12px] text-[var(--aw-text-secondary)] mt-1">{prof.role}</div>
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center"><div className="text-xl text-[var(--aw-secondary)]" style={{ fontWeight: 800 }}>{toFa(activeAgentCount)}</div><div className="text-[10px] text-[var(--aw-text-muted)]">عامل فعال</div></div>
          <div className="text-center"><div className="text-xl text-[var(--aw-primary)]" style={{ fontWeight: 800 }}>{toFa(customers.length)}</div><div className="text-[10px] text-[var(--aw-text-muted)]">مشتری</div></div>
        </div>
      </div>

      {/* Verification flow */}
      {!prof.verified && (
        <div className="mb-4 rounded-[12px] border p-3"
          style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.30)' }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-shield-halved text-[14px]" style={{ color: '#EF4444' }} />
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>احراز هویت لازم است</span>
          </div>
          <div className="text-[11.5px] text-[var(--aw-text-secondary)] leading-6 mb-2.5">
            برای استفاده از تمامی امکانات، هویت خود را با کد پیامکی تأیید کنید.
          </div>

          {verifyStep === 0 && (
            <button className="w-full py-2 px-4 border-none rounded-[10px] text-[12px] text-white cursor-pointer"
              style={{ background: '#EF4444', fontWeight: 700 }} onClick={startVerify}>
              شروع احراز هویت
            </button>
          )}

          {verifyStep === 1 && (
            <div>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">شماره موبایل</div>
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-[10px] border border-[var(--aw-border)]"
                style={{ background: 'var(--aw-bg-input)' }}>
                <i className="fa-solid fa-mobile-screen text-[12px] text-[var(--aw-text-muted)]" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--aw-text-primary)]"
                  style={{ fontWeight: 600, direction: 'ltr', textAlign: 'right' }}
                  inputMode="tel"
                  placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  value={phoneDraft}
                  onChange={e => setPhoneDraft(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-4 border-none rounded-[10px] text-[12px] text-white cursor-pointer"
                  style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 700 }} onClick={sendCode}>
                  <i className="fa-solid fa-paper-plane text-[10px] ml-1" /> ارسال کد
                </button>
                <button className="px-4 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[12px] cursor-pointer text-[var(--aw-text-secondary)]"
                  onClick={() => setVerifyStep(0)}>انصراف</button>
              </div>
            </div>
          )}

          {verifyStep === 2 && (
            <div>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">کد ۴ رقمی پیامک شده را وارد کنید</div>
              <input
                className="w-full text-center tracking-[8px] py-2.5 rounded-[10px] border border-[var(--aw-border)] text-[18px] text-[var(--aw-text-primary)] outline-none mb-2"
                style={{ background: 'var(--aw-bg-input)', fontWeight: 700, letterSpacing: '8px' }}
                placeholder="----"
                maxLength={4}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 4))}
              />
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-4 border-none rounded-[10px] text-[12px] text-white cursor-pointer"
                  style={{ background: '#10B981', fontWeight: 700 }} onClick={confirmCode}>
                  <i className="fa-solid fa-check text-[10px] ml-1" /> تأیید کد
                </button>
                <button className="px-4 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[12px] cursor-pointer text-[var(--aw-text-secondary)]"
                  onClick={() => setVerifyStep(1)}>بازگشت</button>
              </div>
            </div>
          )}
        </div>
      )}

      {verifyStep === 3 && (
        <div className="mb-4 rounded-[12px] border p-3 flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.35)' }}>
          <i className="fa-solid fa-circle-check text-[16px]" style={{ color: '#10B981' }} />
          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>هویت شما با موفقیت احراز شد.</span>
        </div>
      )}

      {/* Read-only name */}
      <FormGroup label="نام">
        <FormInput value={prof.name} readOnly />
      </FormGroup>

      {/* Username (editable) */}
      <FormGroup label="نام کاربری">
        <FormInput
          value={usernameDraft}
          onChange={e => setUsernameDraft(e.target.value.replace(/\s+/g, '_'))}
          placeholder="مثلاً: ali_neura"
        />
      </FormGroup>

      <FormGroup label="ایمیل">
        <FormInput value={prof.email} onChange={e => setProfFn(p => ({ ...p, email: e.target.value }))} />
      </FormGroup>

      {/* Read-only phone */}
      <FormGroup label="تلفن">
        <FormInput value={prof.phone} readOnly />
      </FormGroup>

      <FormGroup label="بیوگرافی">
        <textarea className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y min-h-[80px]" style={{ background: 'var(--aw-bg-input)' }} value={prof.bio} onChange={e => setProfFn(p => ({ ...p, bio: e.target.value }))} rows={3} />
      </FormGroup>

      <button className="w-full py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer"
        style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }}
        onClick={() => {
          const trimmed = usernameDraft.trim();
          if (!trimmed) { showToast('نام کاربری نمی‌تواند خالی باشد'); return; }
          setProfFn(p => ({ ...p, username: trimmed })); try { (api as any).myBulkSave('user_profile', [{ username: trimmed }]); } catch (_) {}
          /* profilesave */ (api as any).updateMe({ name: prof.name, email: (prof.email || '').trim(), prefs: { bio: (prof.bio || '') } }).catch(() => {});
          closeModal();
          showToast('پروفایل با موفقیت ذخیره شد');
        }}>
        ذخیره تغییرات
      </button>
    </div>
  );
}

// ========================
// AI Agent Management Content Modals
// ========================
const AGENT_MARKETPLACE = [
  { id: 'm0', name: 'دستیار شخصی', role: 'دستیار هوشمند شخصی شما', price: '۱.۵M ت / ماه', icon: 'fa-solid fa-user-astronaut', color: '#6366F1', rating: 4.9, hires: 3200 },
  { id: 'm1', name: 'منشی', role: 'مدیریت تقویم، جلسات و تماس‌ها', price: '۱.۲M ت / ماه', icon: 'fa-solid fa-headset', color: '#3B82F6', rating: 4.9, hires: 1240 },
  { id: 'm2', name: 'بازاریاب', role: 'کمپین، تحلیل لید و سئو محتوا', price: '۲.۵M ت / ماه', icon: 'fa-solid fa-bullhorn', color: '#22A6F0', rating: 4.7, hires: 890 },
  { id: 'm6', name: 'خرید / تدارکات', role: 'مدیریت موجودی و سفارش خرید', price: '۱.۵M ت / ماه', icon: 'fa-solid fa-truck-field', color: '#F97316', rating: 4.7, hires: 430 },
  { id: 'm7', name: 'فروشنده / صندوقدار', role: 'ثبت فروش، صدور فاکتور و صندوق', price: '۱.۸M ت / ماه', icon: 'fa-solid fa-cash-register', color: '#10B981', rating: 4.8, hires: 760 },
  { id: 'm8', name: 'داین', role: 'مدیریتِ کاملِ رستوران و کافه: منو، پذیرش، آشپزخانه، صندوق و انبار', price: '۲.۹M ت / ماه', icon: 'fa-solid fa-utensils', color: '#14b8a6', rating: 4.9, hires: 210 },
];

function HireAgentContent() {
  const { showToast, closeModal, agents, setAgents, company, purchaseAgent, ownedAgents } = useApp();
  const [search, setSearch] = useState('');
  const [payFor, setPayFor] = useState<typeof AGENT_MARKETPLACE[number] | null>(null);
  const [paying, setPaying] = useState(false);
  const filtered = AGENT_MARKETPLACE.filter(a => !search || a.name.includes(search) || a.role.includes(search));
  const BG_BY_COLOR: Record<string, string> = { '#3B82F6': 'aw-bg-blue', '#22A6F0': 'aw-bg-blue', '#10B981': 'aw-bg-green', '#F59E0B': 'aw-bg-orange', '#8B5CF6': 'aw-bg-purple', '#F97316': 'aw-bg-orange' };
  const TEAM_BY_MARKET: Record<string, string> = { m0: 'assistant', m1: 'secretary', m2: 'marketing', m6: 'procurement', m7: 'sales', m8: 'dine' };
  const confirmHire = (m: typeof AGENT_MARKETPLACE[number]) => {
    setPaying(true);
    setTimeout(() => {
      // multiagent: per-user instance hire — اولی = ایجنتِ پایهٔ تیم، بعدی‌ها baseId#2, #3, …
      const parsePrice = (s: string) => { const en = (s || '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))); const mM = en.match(/([0-9.]+)\s*M/i); const kM = en.match(/([0-9.]+)\s*K/i); if (mM) return Math.round(parseFloat(mM[1]) * 1000000); if (kM) return Math.round(parseFloat(kM[1]) * 1000); const n = parseFloat(en.replace(/[^0-9.]/g, '')); return n || 0; };
      const teamId = TEAM_BY_MARKET[m.id] || 'secretary';
      const baseKey = company + '::' + teamId;
      const cnt = (ownedAgents || []).filter((k: string) => k === baseKey || k.startsWith(baseKey + '#')).length;
      const _price = parsePrice((m as any).price);
      if (cnt === 0) {
        purchaseAgent(teamId, { name: m.name, price: _price });
        showToast(`${m.name} با موفقیت استخدام شد ✅`, 'success');
      } else {
        const _n = cnt + 1;
        const instId = teamId + '#' + _n;
        const instName = m.name + ' ' + toFa(String(_n));
        purchaseAgent(instId, { name: instName, price: _price });
        try { (api as any).saveAgentPrefs(instId, { name: instName, role: m.role }); } catch (_) {}
        showToast(`${instName} با موفقیت استخدام شد ✅`, 'success');
      }
      setPaying(false);
      closeModal();
    }, 1100);
  };
  if (payFor) {
    const m = payFor;
    return (
      <div>
        <div className="flex items-center gap-3 p-3.5 rounded-2xl mb-4" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` }}>
            <i className={`${m.icon} text-[20px]`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px]" style={{ fontWeight: 700 }}>{m.name}</div>
            <div className="text-[11px] text-[var(--aw-text-muted)]">{m.role}</div>
          </div>
          <span className="text-[13px]" style={{ color: m.color, fontWeight: 800 }}>{m.price}</span>
        </div>
        <div className="rounded-2xl p-3.5 mb-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <div className="flex items-center justify-between text-[12px] mb-2"><span className="text-[var(--aw-text-muted)]">اشتراک ماهانه</span><span style={{ fontWeight: 700 }}>{m.price}</span></div>
          <div className="flex items-center justify-between text-[12px] mb-2"><span className="text-[var(--aw-text-muted)]">مالیات بر ارزش افزوده</span><span style={{ fontWeight: 700 }}>۰ تومان</span></div>
          <div className="h-px my-2" style={{ background: 'var(--aw-border)' }} />
          <div className="flex items-center justify-between text-[13px]"><span style={{ fontWeight: 700 }}>مبلغ قابل پرداخت</span><span style={{ color: m.color, fontWeight: 800 }}>{m.price}</span></div>
        </div>
        <button
          onClick={() => !paying && confirmHire(m)}
          disabled={paying}
          className="w-full py-3 rounded-2xl border-none cursor-pointer text-white text-[13px] flex items-center justify-center gap-2"
          style={{ background: m.color, fontWeight: 700, opacity: paying ? 0.7 : 1 }}
        >
          {paying ? (<><i className="fa-solid fa-spinner fa-spin" /> در حال پرداخت…</>) : (<><i className="fa-solid fa-credit-card" /> پرداخت و استخدام</>)}
        </button>
        <button onClick={() => !paying && setPayFor(null)} className="w-full py-2.5 mt-2 rounded-2xl border-none cursor-pointer text-[12px]" style={{ background: 'transparent', color: 'var(--aw-text-muted)' }}>بازگشت</button>
        <div className="text-center text-[10.5px] text-[var(--aw-text-muted)] mt-2.5">پرداخت امن از طریق درگاه بانکی · لغو در هر زمان</div>
      </div>
    );
  }
  return (
    <div>
      <div className="p-3 rounded-[10px] mb-3 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #22A6F022, #1E6BFF22)', border: '1px solid #22A6F044' }}>
        <i className="fa-solid fa-store text-[18px]" style={{ color: '#22A6F0' }} />
        <div className="flex-1">
          <div className="text-[12px]" style={{ fontWeight: 700 }}>مارکت‌پلیس ایجنت‌های Neura</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">عامل هوشمند مناسب کسب‌وکار خود را انتخاب و استخدام کنید</div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] mb-3" style={{ background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)' }}>
        <i className="fa-solid fa-magnifying-glass text-[11px] text-[var(--aw-text-muted)]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در ایجنت‌ها..." className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]" />
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map(a => (
          <div key={a.id} className="p-3 rounded-[10px] flex items-center gap-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}cc)` }}>
              <i className={`${a.icon} text-[18px]`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px]" style={{ fontWeight: 700 }}>{a.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">{a.role}</div>
              <div className="flex items-center gap-2 text-[10px]">
                <span style={{ color: '#FFD700' }}><i className="fa-solid fa-star text-[9px] ml-0.5" />{a.rating}</span>
                <span className="text-[var(--aw-text-muted)]">·</span>
                <span className="text-[var(--aw-text-muted)]">{a.hires.toLocaleString('fa-IR')} استخدام</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px]" style={{ color: a.color, fontWeight: 700 }}>{a.price}</span>
              <button className="px-3 py-1 rounded-md border-none cursor-pointer text-[10px] text-white" style={{ background: a.color, fontWeight: 600 }} onClick={() => setPayFor(a)}>استخدام</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomizeAgentContent({ agentId }: { agentId?: string } = {}) {
  const { agents, setAgents, company, showToast, closeModal, setTeamAccent, openModal, ownedAvatars, buyAvatar, ownedThemes, buyTheme, walletBalance, defaultAgent, setDefaultAgent, assistantId, setAssistantId } = useApp();
  const companyAgents = agents.filter(a => !a.company || a.company === company);
  const [selected, setSelected] = useState(agentId || companyAgents[0]?.id || '');
  const [confirmDel, setConfirmDel] = useState(false);
  const a = companyAgents.find(x => x.id === selected);
  const [tone, setTone] = useState('صمیمی');
  const [lang, setLang] = useState('فارسی');
  const [gender, setGender] = useState('زن');
  const VOICES_BY_GENDER: Record<string, string[]> = {
    'زن': ['زن - گرم', 'زن - رسمی', 'زن - جوان'],
    'مرد': ['مرد - عمیق', 'مرد - دوستانه', 'مرد - جوان'],
  };
  const [voice, setVoice] = useState(VOICES_BY_GENDER['زن'][0]);
  const onGenderChange = (g: string) => {
    setGender(g);
    setVoice(VOICES_BY_GENDER[g][0]);
    showToast(`صدا به «${VOICES_BY_GENDER[g][0]}» تنظیم شد`, 'info');
  };
  const [age, setAge] = useState('جوان');
  const FEMALE_AVATARS = ['fw1','fw2','fw3','fw4','fw5','fw6','fw7','fw8','fw9','fw10','fw11'].map(n => `/src/avatars/${n}.png`);
  const MALE_AVATARS = ['m1','m2','m3','m4','m5','m6','m7'].map(n => `/src/avatars/${n}.png`);
  const avatarList = gender === 'مرد' ? MALE_AVATARS : FEMALE_AVATARS;
  const [avatarPreset, setAvatarPreset] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { /* avatarresize */
      const img = new Image();
      img.onload = () => {
        const max = 256; let w = img.width, h = img.height;
        const sc = Math.min(1, max / Math.max(w, h)); w = Math.round(w * sc); h = Math.round(h * sc);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        if (!ctx) { setAvatarPreset(reader.result as string); showToast('عکس انتخاب شد', 'success'); return; }
        ctx.drawImage(img, 0, 0, w, h);
        setAvatarPreset(cv.toDataURL('image/jpeg', 0.85));
        showToast('عکس انتخاب شد', 'success');
      };
      img.onerror = () => { setAvatarPreset(reader.result as string); showToast('عکس انتخاب شد', 'success'); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const [welcome, setWelcome] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [voip, setVoip] = useState('');
  const [instructions, setInstructions] = useState('');
  const [locked, setLocked] = useState(false);
  const [accent, setAccent] = useState<string | null>(null);
  const [buyAv, setBuyAv] = useState<string | null>(null);
  const [buyTh, setBuyTh] = useState<string | null>(null);
  // Load the selected agent's saved settings whenever the agent changes
  useEffect(() => {
    if (!a) return;
    setGender(a.gender === 'm' ? 'مرد' : 'زن');
    setTone(a.tone ?? 'صمیمی');
    setLang(a.lang ?? 'فارسی');
    setAge(a.age ?? 'جوان');
    setVoice(a.voice ?? VOICES_BY_GENDER[a.gender === 'm' ? 'مرد' : 'زن'][0]);
    setAvatarPreset(a.avatar ?? null);
    setWelcome(a.welcomeMsg ?? `سلام! من ${a.name} هستم. چطور می‌تونم کمکتون کنم؟`);
    setAgentName(a.name);
    setAgentRole(a.role);
    setVoip(a.voip ?? '');
    setInstructions(a.instructions ?? '');
    setLocked(!!a.locked);
    setAccent(a.accent ?? null);
    if (a.handoff && typeof a.handoff === 'object') setHandoff((h: any) => ({ ...h, ...a.handoff }));
    if ((a as any).handoff && typeof (a as any).handoff === 'object') setHandoff((a as any).handoff);
  }, [selected]);
  const [handoff, setHandoff] = useState<Record<string, boolean>>({
    angry: true,
    complex: true,
    finance: true,
    legal: false,
    userRequest: true,
    repeat: false,
  });
  const HANDOFF_RULES = [
    { id: 'angry', label: 'تعامل عصبانی یا ناراضی', icon: 'fa-solid fa-face-angry', color: '#EF4444' },
    { id: 'complex', label: 'سوال خارج از دانش ایجنت', icon: 'fa-solid fa-circle-question', color: '#F59E0B' },
    { id: 'finance', label: 'مطرح شدن موضوعات مالی', icon: 'fa-solid fa-sack-dollar', color: '#22A6F0' },
    { id: 'legal', label: 'موضوعات حقوقی و قراردادی', icon: 'fa-solid fa-gavel', color: '#1E6BFF' },
    { id: 'userRequest', label: 'درخواست طرف مقابل برای صحبت با انسان', icon: 'fa-solid fa-hand', color: '#10B981' },
    { id: 'repeat', label: 'تکرار سوال بیش از ۳ بار', icon: 'fa-solid fa-repeat', color: '#3B82F6' },
  ];
  return (
    <div>
      {!agentId && (
        <FormGroup label="انتخاب ایجنت">
          <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }}>
            {companyAgents.map(ag => <option key={ag.id} value={ag.id}>{ag.name} — {ag.role}</option>)}
          </select>
        </FormGroup>
      )}
      {a && (
        <>
          <FormGroup label="نام ایجنت">
            <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="نام ایجنت" className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }} />
          </FormGroup>
          <FormGroup label="تغییر عکس پروفایل">
            <div className="flex flex-col items-center gap-1.5 mb-3">
              <div className="relative">
                {avatarPreset
                  ? <div className="w-20 h-20 rounded-full overflow-hidden" style={{ border: '2px solid var(--aw-border)' }}><img src={avatarPreset} alt="" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 18%' }} draggable={false} /></div>
                  : <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-[26px] ${a.bg}`} style={{ fontWeight: 700 }}>{a.init}</div>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFile} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handlePhotoFile} />
              <button onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[10px] border cursor-pointer" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-primary)' }}>
                <i className="fa-solid fa-images text-[14px]" style={{ color: 'var(--aw-primary)' }} />
                <span className="text-[11px]" style={{ fontWeight: 600 }}>گالری</span>
              </button>
              <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[10px] border cursor-pointer" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)', color: 'var(--aw-text-primary)' }}>
                <i className="fa-solid fa-camera-retro text-[14px]" style={{ color: 'var(--aw-primary)' }} />
                <span className="text-[11px]" style={{ fontWeight: 600 }}>دوربین</span>
              </button>
              <button onClick={() => setShowAvatarPicker(v => !v)} className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[10px] border cursor-pointer" style={{ background: showAvatarPicker ? 'var(--aw-primary)' : 'var(--aw-bg-card)', borderColor: showAvatarPicker ? 'var(--aw-primary)' : 'var(--aw-border)', color: showAvatarPicker ? '#fff' : 'var(--aw-text-primary)' }}>
                <i className="fa-solid fa-user-astronaut text-[14px]" style={{ color: showAvatarPicker ? '#fff' : 'var(--aw-primary)' }} />
                <span className="text-[11px]" style={{ fontWeight: 600 }}>آواتار</span>
              </button>
            </div>
            {showAvatarPicker && (
              <div className="mt-2 p-2.5 rounded-[10px]" style={{ background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)' }}>
                <div className="flex gap-1.5 mb-2.5">
                  {[{ v: 'زن', i: 'fa-solid fa-venus' }, { v: 'مرد', i: 'fa-solid fa-mars' }].map(g => (
                    <button key={g.v} onClick={() => onGenderChange(g.v)} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg border-none cursor-pointer" style={gender === g.v ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 700 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>
                      <i className={`${g.i} text-[10px]`} />{g.v === 'زن' ? 'خانم' : 'آقا'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {avatarList.map((src, idx) => {
                    const unlocked = idx < FREE_COUNT || ownedAvatars.includes(src);
                    return (
                    <button key={src} onClick={() => {
                      if (unlocked) { setAvatarPreset(src); showToast('آواتار انتخاب شد', 'success'); }
                      else setBuyAv(src);
                    }} className="w-full aspect-square rounded-full overflow-hidden cursor-pointer p-0 relative" style={{ border: avatarPreset === src ? '2.5px solid var(--aw-primary)' : '2px solid var(--aw-border)', boxShadow: avatarPreset === src ? '0 0 0 3px var(--aw-primary-bg)' : 'none', background: 'var(--aw-bg-card)' }}>
                      <img src={src} alt="" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 18%', filter: unlocked ? 'none' : 'grayscale(1) brightness(0.65)' }} draggable={false} />
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.32)' }}>
                          <i className="fa-solid fa-lock text-white text-[14px]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
                        </div>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
          </FormGroup>
          <FormGroup label="رنگ تم این ایجنت (جدا از تم اصلی)">
            <div className="text-[10px] text-[var(--aw-text-muted)] mb-2">رنگ مخصوص این ایجنت؛ وقتی این ایجنت فعال است، تم اصلی برنامه را موقتاً بازنویسی می‌کند.</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setAccent(null); setTeamAccent(null); }}
                title="پیش‌فرض (پیروی از تم اصلی)"
                className="w-8 h-8 rounded-full cursor-pointer flex items-center justify-center p-0"
                style={{ background: 'var(--aw-bg-card)', border: accent == null ? '2.5px solid var(--aw-primary)' : '2px solid var(--aw-border)', color: 'var(--aw-text-muted)' }}
              >
                <i className="fa-solid fa-ban text-[12px]" />
              </button>
              {ACCENT_PALETTE.map((c, idx) => {
                const unlocked = true; /* freecolors: همهٔ رنگ‌های شخصی‌سازیِ ایجنت آزاد */
                return (
                <button
                  key={c}
                  onClick={() => {
                    if (unlocked) { setAccent(c); setTeamAccent(c); }
                    else setBuyTh(c);
                  }}
                  className="w-8 h-8 rounded-full cursor-pointer p-0 flex items-center justify-center relative"
                  style={{ background: c, border: accent === c ? '2.5px solid var(--aw-text-primary)' : '2px solid rgba(255,255,255,0.35)', boxShadow: accent === c ? '0 0 0 3px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.15)', opacity: unlocked ? 1 : 0.55 }}
                >
                  {accent === c && unlocked && <i className="fa-solid fa-check text-[11px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />}
                  {!unlocked && <i className="fa-solid fa-lock text-[9px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }} />}
                </button>
                );
              })}
            </div>
          </FormGroup>
          <FormGroup label="جنسیت ایجنت (تعیین صدا)">
            <div className="flex gap-1.5 flex-wrap">
              {[{ v: 'زن', i: 'fa-solid fa-venus' }, { v: 'مرد', i: 'fa-solid fa-mars' }].map(g => (
                <button key={g.v} onClick={() => onGenderChange(g.v)} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border-none cursor-pointer" style={gender === g.v ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>
                  <i className={`${g.i} text-[10px]`} />{g.v}
                </button>
              ))}
            </div>
            <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)' }}>
              <i className="fa-solid fa-volume-high text-[11px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[10px] text-[var(--aw-text-secondary)]">صدای فعلی:</span>
              <span className="text-[11px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>{voice}</span>
              <button onClick={() => { __speak('سلام، این یک نمونهٔ صدای عاملِ هوشمندِ نورا است.'); showToast('در حال پخش نمونه صدا', 'info'); }} className="mr-auto px-2 py-0.5 rounded-md border-none cursor-pointer text-[10px] text-white" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }}>
                <i className="fa-solid fa-play text-[9px] ml-1" />نمونه
              </button>
            </div>
          </FormGroup>
          <FormGroup label="سن و سال">
            <div className="flex gap-1.5 flex-wrap">
              {['جوان', 'میانسال', 'مسن'].map(s => (
                <button key={s} onClick={() => setAge(s)} className="text-[11px] px-3 py-1.5 rounded-full border-none cursor-pointer" style={age === s ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>{s}</button>
              ))}
            </div>
          </FormGroup>
          <FormGroup label="لحن گفتگو">
            <div className="flex gap-1.5 flex-wrap">
              {['محاوره‌ای کنترل‌شده', 'صمیمی', 'رسمی'].map(t => (
                <button key={t} onClick={() => setTone(t)} className="text-[11px] px-3 py-1.5 rounded-full border-none cursor-pointer" style={tone === t ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>{t}</button>
              ))}
            </div>
          </FormGroup>
          <FormGroup label="زبان">
            <div className="flex gap-1.5 flex-wrap">
              {['فارسی', 'انگلیسی', 'عربی', 'دو زبانه'].map(l => (
                <button key={l} onClick={() => setLang(l)} className="text-[11px] px-3 py-1.5 rounded-full border-none cursor-pointer" style={lang === l ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>{l}</button>
              ))}
            </div>
          </FormGroup>
          <FormGroup label={`صدای ایجنت (${gender})`}>
            <div className="flex gap-1.5 flex-wrap">
              {VOICES_BY_GENDER[gender].map(v => (
                <button key={v} onClick={() => setVoice(v)} className="text-[11px] px-3 py-1.5 rounded-full border-none cursor-pointer" style={voice === v ? { background: 'var(--aw-primary, #2E86FF)', color: '#fff', fontWeight: 600 } : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>{v}</button>
              ))}
            </div>
          </FormGroup>
          <FormGroup label="پیام خوش‌آمد">
            <textarea value={welcome} onChange={e => setWelcome(e.target.value)} rows={3} className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y" style={{ background: 'var(--aw-bg-input)' }} />
          </FormGroup>
          <FormGroup label="شماره داخلی VoIP">
            <input value={voip} onChange={e => setVoip(e.target.value)} placeholder="مثلاً ۲۰۱" className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }} />
          </FormGroup>
          <FormGroup label="دستورالعمل‌ها (Instructions)">
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} className="w-full p-2.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none resize-y min-h-[80px]" style={{ background: 'var(--aw-bg-input)' }} />
          </FormGroup>
          <FormGroup label="وضعیت">
            <select value={String(locked)} onChange={e => setLocked(e.target.value === 'true')} className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)' }}>
              <option value="false">فعال</option>
              <option value="true">قفل (نیاز به اشتراک)</option>
            </select>
          </FormGroup>
          <FormGroup label="شرایط ارجاع به اپراتور انسانی">
            <div className="p-2.5 rounded-[10px] mb-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #22A6F015, #1E6BFF15)', border: '1px solid #22A6F033' }}>
              <i className="fa-solid fa-headset text-[12px]" style={{ color: '#22A6F0' }} />
              <span className="text-[10px] text-[var(--aw-text-secondary)]">در صورت فعال بودن، گفتگو به‌صورت خودکار به اپراتور انسانی منتقل می‌شود</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {HANDOFF_RULES.map(r => (
                <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${r.color}1A` }}>
                    <i className={`${r.icon} text-[12px]`} style={{ color: r.color }} />
                  </div>
                  <span className="flex-1 text-[12px]" style={{ fontWeight: 600 }}>{r.label}</span>
                  <button onClick={() => setHandoff(prev => ({ ...prev, [r.id]: !prev[r.id] }))} className="relative w-9 h-5 rounded-full border-none cursor-pointer transition-all" style={{ background: handoff[r.id] ? '#10B981' : 'var(--aw-bg-input)' }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: '#fff', [handoff[r.id] ? 'left' : 'right']: 2 }} />
                  </button>
                </div>
              ))}
            </div>
          </FormGroup>
        </>
      )}
      <div className="flex gap-2 items-stretch">
      <button className="flex-1 py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[13px]" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={async () => { /* agentsave: async */
        if (a) {
          setAgents(prev => prev.map(ag => ag.id === a.id ? {
            ...ag,
            name: agentName.trim() || ag.name,
            init: (agentName.trim() || ag.name).charAt(0),
            voip, instructions, locked,
            gender: gender === 'مرد' ? 'm' : 'f',
            tone, lang, age, voice,
            avatar: avatarPreset ?? undefined,
            accent: accent ?? undefined,
            welcomeMsg: welcome,
          } : ag));
          try {
            (api as any).updateAgent(a.id, {
              name: agentName.trim() || a.name,
              role: agentRole.trim() || a.role,
              instructions, voip, locked,
              welcomeMsg: welcome,
              tone, lang, age,
              accent: accent || undefined,
              gender: gender === 'مرد' ? 'm' : 'f',
              persona: { tone, gender: gender === 'مرد' ? 'm' : 'f', age, lang, accent: accent || undefined },
              handoff,
            });
          } catch (_) {}
        }
        if (a) { const _nm = agentName.trim() || a.name; const _saved: any = { name: _nm, role: agentRole.trim() || a.role, gender: gender === 'مرد' ? 'm' : 'f', tone, lang, age, voice, ttsVoice: voice, accent: accent || undefined, bg: accent || undefined, avatar: avatarPreset ?? undefined, welcomeMsg: welcome, handoff }; try { if ((a.id === 'assistant' || a.team === 'assistant')) localStorage.setItem('aw-eu-assistant-name', _nm); } catch (_e) {} try { await (api as any).saveAgentPrefs(a.id, _saved); const _ag: any = await (api as any).agents(); if (Array.isArray(_ag) && _ag.length) setAgents(_ag.map((x: any) => x.id === a.id ? { ...x, ..._saved, accent: (accent || x.accent), avatar: (avatarPreset ?? x.avatar) } : x) as any); } catch (_) {} } showToast('شخصی‌سازی ذخیره شد', 'success');
        closeModal();
      }}>ذخیره تنظیمات</button>
      {a && !confirmDel && (
        <button onClick={() => setConfirmDel(true)} className="py-2.5 px-4 flex items-center justify-center gap-1.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent flex-shrink-0" style={{ border: '1px solid var(--aw-danger, #ef4444)', color: 'var(--aw-danger, #ef4444)', fontWeight: 700 }}>
          <i className="fa-solid fa-trash-can" />حذف
        </button>
      )}
      </div>
      {a && confirmDel && (
        <div className="mt-3 p-3 rounded-[10px]" style={{ background: 'var(--aw-danger-bg, rgba(239,68,68,0.1))', border: '1px solid var(--aw-danger, #ef4444)' }}>
          <div className="text-[12px] text-center mb-3" style={{ color: 'var(--aw-text-primary)', fontWeight: 600 }}>حذف عامل «{a.name}»؟ این عمل قابل بازگشت نیست.</div>
          <div className="flex gap-2">
            <button onClick={() => {
                try { (api as any).removeOwnedAgent(a.id); } catch (_e) {} setAgents(prev => prev.filter(ag => ag.id !== a.id));
                if (defaultAgent === a.id) setDefaultAgent('');
                if (assistantId === a.id) setAssistantId('assistant');
                closeModal(); showToast(`عامل «${a.name}» حذف شد`, 'success');
              }} className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-danger, #ef4444)', fontWeight: 700 }}>بله، حذف کن</button>
            <button onClick={() => setConfirmDel(false)} className="flex-1 py-2.5 rounded-[10px] cursor-pointer text-[13px] border border-[var(--aw-border)]" style={{ background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 600 }}>انصراف</button>
          </div>
        </div>
      )}

      {(buyAv || buyTh) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }} onClick={() => { setBuyAv(null); setBuyTh(null); }}>
          <div className="w-full max-w-[320px] rounded-2xl p-5 flex flex-col items-center" style={{ background: 'var(--aw-bg-modal, var(--aw-bg-card))', border: '1px solid var(--aw-border)' }} onClick={e => e.stopPropagation()}>
            {buyAv && <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-[var(--aw-border)]"><img src={buyAv} alt="" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center 18%' }} /></div>}
            {buyTh && <div className="w-20 h-20 rounded-2xl mb-3" style={{ background: buyTh, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }} />}
            <div className="text-[15px] mb-1" style={{ fontWeight: 800 }}>{buyAv ? 'آواتار اختصاصی' : 'تم رنگی اختصاصی'}</div>
            <div className="text-[12px] text-[var(--aw-text-muted)] mb-4 text-center">برای استفاده باید این مورد را خریداری کنید</div>
            <div className="w-full rounded-2xl border border-[var(--aw-border)] p-3.5 mb-3" style={{ background: 'var(--aw-bg-card)' }}>
              <div className="flex justify-between items-center mb-1.5 text-[13px]"><span className="text-[var(--aw-text-secondary)]">قیمت</span><span style={{ fontWeight: 800, color: 'var(--aw-primary)', direction: 'ltr' }}>{toFa((buyAv ? AVATAR_PRICE : THEME_PRICE).toLocaleString('en-US'))} تومان</span></div>
              <div className="flex justify-between items-center text-[12px]"><span className="text-[var(--aw-text-secondary)]">موجودی تنخواه</span><span style={{ fontWeight: 700, color: walletBalance >= (buyAv ? AVATAR_PRICE : THEME_PRICE) ? 'var(--aw-text-primary)' : 'var(--aw-danger)', direction: 'ltr' }}>{toFa(walletBalance.toLocaleString('en-US'))} تومان</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: walletBalance >= (buyAv ? AVATAR_PRICE : THEME_PRICE) ? 'var(--aw-primary)' : 'var(--aw-border)', fontWeight: 700 }}
                onClick={() => {
                  const price = buyAv ? AVATAR_PRICE : THEME_PRICE;
                  if (walletBalance < price) { showToast('موجودی تنخواه کافی نیست', 'error'); return; }
                  if (buyAv) { buyAvatar(buyAv, AVATAR_PRICE); setAvatarPreset(buyAv); showToast('آواتار خریداری و انتخاب شد ✅', 'success'); }
                  else if (buyTh) { buyTheme(buyTh, THEME_PRICE); setAccent(buyTh); setTeamAccent(buyTh); showToast('تم رنگی خریداری و انتخاب شد ✅', 'success'); }
                  setBuyAv(null); setBuyTh(null);
                }}>
                <i className="fa-solid fa-bag-shopping ml-1.5" /> پرداخت و خرید
              </button>
              <button className="py-2.5 rounded-[10px] cursor-pointer text-[13px] bg-transparent" style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 700 }} onClick={() => { setBuyAv(null); setBuyTh(null); }}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionsContent() {
  const { agents, company, showToast, closeModal } = useApp();
  const companyAgents = agents.filter(a => !a.company || a.company === company);
  const PERMISSIONS = [
    { id: 'chat', label: 'گفتگو با مشتری', icon: 'fa-solid fa-comments' },
    { id: 'call', label: 'تماس صوتی/تصویری', icon: 'fa-solid fa-phone' },
    { id: 'invoice', label: 'صدور فاکتور', icon: 'fa-solid fa-file-invoice' },
    { id: 'refund', label: 'تایید مرجوعی', icon: 'fa-solid fa-rotate-left' },
    { id: 'discount', label: 'اعمال تخفیف', icon: 'fa-solid fa-tag' },
    { id: 'data', label: 'دسترسی به داده مشتریان', icon: 'fa-solid fa-database' },
    { id: 'finance', label: 'مشاهده گزارش مالی', icon: 'fa-solid fa-coins' },
  ];
  const [perms, setPerms] = useState<Record<string, boolean>>(Object.fromEntries(PERMISSIONS.map(p => [p.id, true])));
  useEffect(() => { if (!company) return; (async () => { try { const _c: any = await (api as any).list('config', company); const _r = (_c || []).find((x: any) => x.id === 'perms_' + company); if (_r && _r.perms) setPerms(_r.perms); } catch (_) {} })(); }, [company]);
  return (
    <div>
      <div className="p-3 rounded-[10px] mb-3" style={{ background: '#F59E0B15', border: '1px solid #F59E0B33' }}>
        <div className="text-[11px] flex items-center gap-1.5" style={{ color: '#F59E0B', fontWeight: 600 }}>
          <i className="fa-solid fa-shield-halved" />تنظیماتِ دسترسیِ هر نقش ذخیره می‌شود
        </div>
      </div>
      <div className="text-[11px] text-[var(--aw-text-muted)] mb-2">{companyAgents.length.toLocaleString('fa-IR')} ایجنت فعال در سازمان شما</div>
      <div className="flex flex-col gap-1.5">
        {PERMISSIONS.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--aw-bg-input)' }}>
              <i className={`${p.icon} text-[13px]`} style={{ color: 'var(--aw-primary)' }} />
            </div>
            <span className="flex-1 text-[12px]" style={{ fontWeight: 600 }}>{p.label}</span>
            <button onClick={() => setPerms(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="relative w-10 h-5 rounded-full border-none cursor-pointer transition-all" style={{ background: perms[p.id] ? '#10B981' : 'var(--aw-bg-input)' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: '#fff', [perms[p.id] ? 'left' : 'right']: 2 }} />
            </button>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-4" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { (api as any).create('config', { id: 'perms_' + company, company, perms }).catch(() => {}); showToast('دسترسی‌ها به‌روزرسانی شد', 'success'); closeModal(); }}>اعمال تغییرات</button>
    </div>
  );
}

function WorkflowContent() {
  const { showToast, closeModal, company } = useApp();
  const [workflows, setWorkflows] = useState([]);
  useEffect(() => { if (!company) return; (async () => { try { const _c: any = await (api as any).list('config', company); const _r = (_c || []).find((x: any) => x.id === 'workflow_' + company); if (_r && Array.isArray(_r.workflows)) setWorkflows(_r.workflows); } catch (_) {} })(); }, [company]);
  return (
    <div>
      <div className="p-3 rounded-[10px] mb-3 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #3B82F622, #1E40AF22)', border: '1px solid #3B82F644' }}>
        <i className="fa-solid fa-diagram-project text-[16px]" style={{ color: '#3B82F6' }} />
        <div className="flex-1">
          <div className="text-[12px]" style={{ fontWeight: 700 }}>ورک‌فلوهای خودکار</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">اتوماسیون فرآیندها با ترکیب تریگر و اکشن</div>
        </div>
        <button className="px-2.5 py-1 rounded-md border-none cursor-pointer text-[10px] text-white" style={{ background: '#3B82F6', fontWeight: 600 }} onClick={() => showToast('سازندهٔ ورک‌فلو به‌زودی افزوده می‌شود', 'info')}>+ جدید</button>
      </div>
      <div className="flex flex-col gap-2">
        {workflows.map(w => (
          <div key={w.id} className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: w.active ? '#10B981' : '#6B7280' }} />
              <span className="text-[12px] flex-1" style={{ fontWeight: 700 }}>{w.name}</span>
              <button onClick={() => setWorkflows(prev => prev.map(x => x.id === w.id ? { ...x, active: !x.active } : x))} className="relative w-9 h-5 rounded-full border-none cursor-pointer" style={{ background: w.active ? '#10B981' : 'var(--aw-bg-input)' }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full" style={{ background: '#fff', [w.active ? 'left' : 'right']: 2 }} />
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
              <span><i className="fa-solid fa-bolt text-[9px] ml-1" style={{ color: w.color }} />تریگر: {w.trigger}</span>
              <span><i className="fa-solid fa-list-ol text-[9px] ml-1" />{w.steps.toLocaleString('fa-IR')} مرحله</span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-4" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { (api as any).create('config', { id: 'workflow_' + company, company, workflows }).catch(() => {}); showToast('تنظیمات ورک‌فلو ذخیره شد', 'success'); closeModal(); }}>ذخیره</button>
    </div>
  );
}

function ToggleAgentContent() {
  const { agents, company, showToast, setAgents } = useApp();
  const companyAgents = agents.filter(a => !a.company || a.company === company);
  const [states, setStates] = useState<Record<string, boolean>>(Object.fromEntries(companyAgents.map(a => [a.id, !a.locked])));
  const activeCount = Object.values(states).filter(Boolean).length;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-[10px] text-center" style={{ background: 'linear-gradient(135deg, #10B98122, transparent)', border: '1px solid #10B98144' }}>
          <div className="text-[18px]" style={{ color: '#10B981', fontWeight: 700 }}>{activeCount.toLocaleString('fa-IR')}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">فعال</div>
        </div>
        <div className="p-3 rounded-[10px] text-center" style={{ background: 'linear-gradient(135deg, #6B728022, transparent)', border: '1px solid #6B728044' }}>
          <div className="text-[18px]" style={{ color: '#6B7280', fontWeight: 700 }}>{(companyAgents.length - activeCount).toLocaleString('fa-IR')}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">غیرفعال</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {companyAgents.map(a => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] ${a.bg}`} style={{ fontWeight: 700, opacity: states[a.id] ? 1 : 0.4 }}>{a.init}</div>
            <div className="flex-1">
              <div className="text-[12px]" style={{ fontWeight: 700, opacity: states[a.id] ? 1 : 0.5 }}>{a.name}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{a.role}</div>
            </div>
            <button onClick={() => { const _act = !states[a.id]; /* toggleagent */ setStates(prev => ({ ...prev, [a.id]: _act })); (api as any).saveAgentPrefs(a.id, { locked: !_act }).catch(() => {}); setAgents((prev: any[]) => prev.map((x: any) => x.id === a.id ? { ...x, locked: !_act } : x)); showToast(`${a.name} ${_act ? 'فعال' : 'غیرفعال'} شد`, 'info'); }} className="relative w-10 h-5 rounded-full border-none cursor-pointer" style={{ background: states[a.id] ? '#10B981' : 'var(--aw-bg-input)' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full" style={{ background: '#fff', [states[a.id] ? 'left' : 'right']: 2 }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiSettingsContent() {
  const { showToast, closeModal, company } = useApp();
  const [kpis, setKpis] = useState([]);
  useEffect(() => { if (!company) return; (async () => { try { const _c: any = await (api as any).list('config', company); const _r = (_c || []).find((x: any) => x.id === 'kpi_' + company); if (_r && Array.isArray(_r.kpis)) setKpis(_r.kpis); } catch (_) {} })(); }, [company]);
  return (
    <div>
      <div className="p-3 rounded-[10px] mb-3" style={{ background: 'linear-gradient(135deg, #22A6F022, #1E6BFF22)', border: '1px solid #22A6F044' }}>
        <div className="text-[12px]" style={{ fontWeight: 700 }}><i className="fa-solid fa-gauge-high ml-1.5" />شاخص‌های کلیدی عملکرد (KPI)</div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">هدفِ هر شاخص را تعیین و ذخیره کنید</div>
      </div>
      <div className="flex flex-col gap-2">
        {kpis.map(k => (
          <div key={k.id} className="p-3 rounded-[10px] flex items-center gap-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${k.color}22` }}>
              <i className={`${k.icon} text-[14px]`} style={{ color: k.color }} />
            </div>
            <div className="flex-1">
              <div className="text-[12px] mb-1" style={{ fontWeight: 600 }}>{k.name}</div>
              <div className="flex items-center gap-1.5">
                <input inputMode="numeric" value={k.target ? __grpFa(k.target) : ''} onChange={e => setKpis(prev => prev.map(x => x.id === k.id ? { ...x, target: Number(String(e.target.value).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')) || 0 } : x))} className="w-20 py-1 px-2 rounded-md border text-[11px] text-[var(--aw-text-primary)] outline-none" style={{ background: 'var(--aw-bg-input)', borderColor: 'var(--aw-border)' }} />
                <span className="text-[10px] text-[var(--aw-text-muted)]">{k.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-4" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { (api as any).create('config', { id: 'kpi_' + company, company, kpis }).catch(() => {}); showToast('اهداف KPI ذخیره شد', 'success'); closeModal(); }}>ذخیره اهداف</button>
    </div>
  );
}

function PlansManagementContent() {
  const { showToast, closeModal } = useApp();
  const [__bizPlans, __setBizPlans] = useState<any[] | null>(null);
  const [__sub, __setSub] = useState<any>(null);
  useEffect(() => { (async () => {
    try { const st: any = await (api as any).getSettings(); if (st && Array.isArray(st.neuraBizPlans) && st.neuraBizPlans.length) __setBizPlans(st.neuraBizPlans); } catch (_e) {}
    try { const w: any = await (api as any).getWallet(); if (w) __setSub(w.subscription || null); } catch (_e) {}
  })(); }, []);
  const PLANS = [
    { id: 'p1', name: 'استارتر', price: '۹۰۰K', period: 'ماهانه', color: '#3B82F6', features: ['۲ ایجنت فعال', '۵۰۰ گفتگو در ماه', 'گزارش پایه', 'پشتیبانی ایمیلی'], current: false },
    { id: 'p2', name: 'حرفه‌ای', price: '۲.۵M', period: 'ماهانه', color: '#10B981', features: ['۱۰ ایجنت فعال', 'گفتگوی نامحدود', 'تحلیل پیشرفته AI', 'API + Webhook', 'پشتیبانی ۲۴/۷'], current: true, badge: 'پلن فعلی' },
    { id: 'p3', name: 'سازمانی', price: '۸M', period: 'ماهانه', color: '#FFD700', features: ['ایجنت نامحدود', 'مدل اختصاصی', 'SLA ۹۹.۹٪', 'استقرار اختصاصی', 'مدیر حساب اختصاصی'], current: false, badge: 'محبوب‌ترین' },
  ];
  return (
    <div>
      <div className="p-3 rounded-[10px] mb-3 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #FFD70022, #F59E0B22)', border: '1px solid #FFD70044' }}>
        <i className="fa-solid fa-crown text-[18px]" style={{ color: '#FFD700' }} />
        <div className="flex-1">
          <div className="text-[12px]" style={{ fontWeight: 700 }}>پلن فعلی: {__sub ? __sub.plan : 'بدونِ اشتراکِ فعال'}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">{__sub ? ('تمدید بعدی: ' + (__sub.expiresAt ? new Date(__sub.expiresAt).toLocaleDateString('fa-IR') : '—') + ' — ' + (Number(__sub.price) || 0).toLocaleString('fa-IR') + ' ت') : 'برای فعال‌سازی، یک پلن را انتخاب کنید'}</div>
        </div>
        <button className="px-2.5 py-1 rounded-md border-none cursor-pointer text-[10px]" style={{ background: '#FFD70022', color: '#F59E0B', fontWeight: 600 }} onClick={async () => { if (!__sub) { showToast('اشتراکِ فعالی برای تمدید نیست', 'error'); return; } try { await (api as any).walletSubscribe(__sub.plan, Number(__sub.price) || 0, { planId: __sub.planId, months: 1 }); showToast('پلن تمدید شد ✅', 'success'); } catch (e: any) { showToast(e && e.message === 'insufficient_funds' ? 'موجودی کیف‌پول کافی نیست' : 'خطا در تمدید پلن', 'error'); } }}>تمدید</button>
      </div>
      <div className="flex flex-col gap-2.5">
        {(__bizPlans && __bizPlans.length ? __bizPlans : PLANS).map((p: any) => ({ ...p, current: __sub ? (p.id === __sub.planId || p.name === __sub.plan) : false })).map((p: any) => (
          <div key={p.id} className="p-3 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: p.current ? `2px solid ${p.color}` : '1px solid var(--aw-border)', position: 'relative' }}>
            {p.badge && <span className="absolute -top-2 right-3 text-[9px] px-2 py-0.5 rounded-md text-white" style={{ background: p.color, fontWeight: 700 }}>{p.badge}</span>}
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[14px]" style={{ color: p.color, fontWeight: 700 }}>{p.name}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{p.period}</div>
              </div>
              <div className="text-left">
                <div className="text-[18px]" style={{ fontWeight: 700 }}>{p.price}<span className="text-[10px] text-[var(--aw-text-muted)] mr-1">ت</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mb-2.5">
              {p.features.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--aw-text-secondary)]">
                  <i className="fa-solid fa-check text-[9px]" style={{ color: p.color }} />{f}
                </div>
              ))}
            </div>
            <button disabled={p.current} className="w-full py-2 rounded-lg border-none cursor-pointer text-[11px]" style={p.current ? { background: 'var(--aw-bg-input)', color: 'var(--aw-text-muted)', fontWeight: 600 } : { background: p.color, color: '#fff', fontWeight: 700 }} onClick={async () => { const __pr = __planPrice(p.price); try { await (api as any).walletSubscribe(p.name, __pr, { planId: p.id, months: 1 }); showToast(`پلن ${p.name} فعال شد ✅`, 'success'); closeModal(); } catch (e: any) { showToast(e && e.message === 'insufficient_funds' ? 'موجودی کیف‌پول کافی نیست' : 'خطا در فعال‌سازی پلن', 'error'); } }}>
              {p.current ? 'پلن فعلی شما' : 'ارتقا به این پلن'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppSettingsContent() {
  const { showToast, closeModal, theme, setTheme, agents, company, defaultAgent, setDefaultAgent } = useApp();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const companyAgents = agents.filter(a => !a.company || a.company === company);

  const themeOptions: { id: 'dark' | 'light' | 'bw' | 'glass'; icon: string; label: string }[] = [
    { id: 'glass', icon: 'fa-solid fa-sun', label: 'روشن' },
    { id: 'dark', icon: 'fa-solid fa-moon', label: 'تیره' },
    { id: 'bw', icon: 'fa-solid fa-circle-half-stroke', label: 'سیاه‌سفید' },
  ];

  const settingsItems = [
    { icon: 'fa-solid fa-language', label: 'زبان', desc: 'فارسی', toggle: false },
    { icon: 'fa-solid fa-bell', label: 'اعلان‌ها', desc: notifEnabled ? 'فعال' : 'غیرفعال', toggle: true, checked: notifEnabled, onChange: () => { setNotifEnabled(!notifEnabled); showToast(!notifEnabled ? 'اعلان‌ها فعال شد' : 'اعلان‌ها غیرفعال شد'); } },
    { icon: 'fa-solid fa-volume-up', label: 'صدای اعلان', desc: soundEnabled ? 'فعال' : 'غیرفعال', toggle: true, checked: soundEnabled, onChange: () => { setSoundEnabled(!soundEnabled); showToast(!soundEnabled ? 'صدا فعال شد' : 'صدا غیرفعال شد'); } },
    { icon: 'fa-solid fa-database', label: 'پاک‌سازی کش', desc: 'پاک کردن داده‌های موقت', toggle: false, onClick: () => { showToast('کش پاک‌سازی شد'); closeModal(); } },
  ];

  return (
    <div>
      {/* Theme Selector */}
      <div className="mb-4">
        <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>تم برنامه</div>
        <div className="grid grid-cols-2 gap-2">
          {themeOptions.map(t => (
            <button
              key={t.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-[10px] border cursor-pointer transition-all ${
                theme === t.id
                  ? 'border-[var(--aw-primary)] text-[var(--aw-primary)]'
                  : 'border-[var(--aw-border)] text-[var(--aw-text-secondary)]'
              }`}
              style={{
                background: theme === t.id ? 'var(--aw-primary-bg)' : 'var(--aw-bg-card)',
                fontWeight: theme === t.id ? 700 : 500,
              }}
              onClick={() => {
                setTheme(t.id);
                showToast('تم «' + t.label + '» فعال شد');
              }}
            >
              <i className={`${t.icon} text-lg`} />
              <span className="text-[11px]">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Default Agent Selector */}
      <div className="mb-4">
        <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1" style={{ fontWeight: 600 }}>عامل پیش‌فرض</div>
        <div className="flex flex-col gap-1.5">
          {companyAgents.map(a => {
            const isSelected = defaultAgent === a.id || (!defaultAgent && a === companyAgents[0]);
            return (
              <button
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-[10px] border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[var(--aw-primary)] text-[var(--aw-text-primary)]'
                    : 'border-[var(--aw-border)] text-[var(--aw-text-secondary)]'
                }`}
                style={{
                  background: isSelected ? 'var(--aw-primary-bg)' : 'var(--aw-bg-card)',
                  fontWeight: isSelected ? 700 : 500,
                }}
                onClick={() => {
                  setDefaultAgent(a.id);
                  showToast('عامل پیش‌فرض: ' + a.name);
                }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] ${a.bg}`} style={{ fontWeight: 700 }}>{a.init}</div>
                <div className="flex-1 text-right">
                  <div className="text-[13px]">{a.name}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{a.role}</div>
                </div>
                {isSelected && <i className="fa-solid fa-check-circle text-[var(--aw-primary)]" />}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1.5 px-1">
          <i className="fa-solid fa-info-circle ml-1" />
          صفحه‌ی خوشامدگویی با آواتار، تم و اسپکتروم این عامل نمایش داده می‌شود و با زدن دکمه‌ی ورود، پنل همین عامل باز می‌شود
        </div>
      </div>

      {/* Other settings */}
      {settingsItems.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-[10px] mb-1.5 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}
          onClick={item.onClick}>
          <i className={`${item.icon} text-base w-5 text-center text-[var(--aw-primary)]`} />
          <div className="flex-1">
            <div className="text-[13px]" style={{ fontWeight: 500 }}>{item.label}</div>
            <div className="text-[11px] text-[var(--aw-text-muted)]">{item.desc}</div>
          </div>
          {item.toggle && (
            <button
              className="w-11 h-6 rounded-full border-none cursor-pointer transition-all flex items-center px-0.5"
              style={{ background: item.checked ? 'var(--aw-primary)' : 'var(--aw-bg-input)' }}
              onClick={(e) => { e.stopPropagation(); item.onChange?.(); }}
            >
              <div className="w-5 h-5 rounded-full bg-white transition-all" style={{ transform: item.checked ? 'translateX(0)' : 'translateX(20px)' }} />
            </button>
          )}
          {!item.toggle && item.onClick && (
            <i className="fa-solid fa-chevron-left text-[12px] text-[var(--aw-text-muted)]" />
          )}
        </div>
      ))}
    </div>
  );
}

function AboutContent() {
  return (
    <div className="text-center">
      <img
        src="/src/assets/neura-logo-blue.png"
        alt="Neura"
        className="neura-logo h-14 w-auto object-contain mx-auto mb-4"
        style={{ filter: 'var(--aw-logo-filter)' }}
      />
      <h3 className="text-lg mb-1">Neura</h3>
      <p className="text-[12px] text-[var(--aw-text-secondary)] mb-4">نسخه ۱.۰.۰</p>
      <p className="text-[13px] text-[var(--aw-text-secondary)] mb-4">
        سیستم مدیریت هوشمند کسب‌وکار با عامل‌های AI
      </p>
      <div className="space-y-2 text-[12px] text-[var(--aw-text-muted)]">
        <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)]">
          <span>فریمورک</span>
          <span style={{ fontWeight: 600 }}>React + Tailwind CSS</span>
        </div>
        <div className="flex justify-between py-2 border-b border-[var(--aw-border-light)]">
          <span>طراحی</span>
          <span style={{ fontWeight: 600 }}>RTL / فارسی</span>
        </div>
        <div className="flex justify-between py-2">
          <span>فونت</span>
          <span style={{ fontWeight: 600 }}>Vazirmatn</span>
        </div>
      </div>
    </div>
  );
}

function LogoutContent() {
  const { closeModal, showToast, logout } = useApp();
  return (
    <div>
      <div className="text-center mb-4">
        <i className="fa-solid fa-sign-out-alt text-[40px] text-[var(--aw-danger)] mb-3 block" />
        <p className="text-[14px]">آیا مطمئن هستید که می‌خواهید خارج شوید؟</p>
        <p className="text-[12px] text-[var(--aw-text-muted)] mt-1">تمام داده‌های ذخیره نشده از بین خواهد رفت</p>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 px-5 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-danger)', fontWeight: 600 }} onClick={() => { closeModal(); showToast('با موفقیت خارج شدید'); logout(); }}>بله، خروج</button>
        <button className="flex-1 py-2.5 px-5 rounded-[10px] text-[13px] cursor-pointer border border-[var(--aw-border)] text-[var(--aw-text-secondary)]" style={{ background: 'transparent', fontWeight: 600 }} onClick={closeModal}>انصراف</button>
      </div>
    </div>
  );
}

function AgentReportDetail() {
  const { agents, closeModal, openChat, company } = useApp();
  const companyAgents = agents.filter(a => !a.locked && (!a.company || a.company === company));
  return (
    <div>
      {companyAgents.map(a => (
        <div key={a.id} className="flex items-center gap-2.5 py-2.5 border-b border-[var(--aw-border-light)] last:border-none">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm ${a.bg}`} style={{ fontWeight: 700 }}>{a.init}</div>
          <div className="flex-1">
            <div className="text-[13px]" style={{ fontWeight: 600 }}>{a.name}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">{a.role}</div>
          </div>
          <div className="text-left text-[11px]">
            <div className="text-[var(--aw-secondary)]">{toFa(a.done)} انجام</div>
            <div className="text-[var(--aw-accent)]">{toFa(a.pending)} معلق</div>
          </div>
          <button className="py-1.5 px-2.5 rounded-[10px] text-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-secondary)] cursor-pointer" style={{ fontWeight: 600 }}
            onClick={() => { closeModal(); setTimeout(() => openChat(a.id, 'agent'), 200); }}>چت</button>
        </div>
      ))}
    </div>
  );
}

function FinanceReportDetail() {
  const { closeModal, setAdminScreen } = useApp();
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <FinSumCard value="۱,۰۰۰,۰۰۰,۰۰۰" label="درآمد" color="var(--aw-secondary)" />
        <FinSumCard value="۳۵۰,۰۰۰,۰۰۰" label="هزینه" color="var(--aw-danger)" />
      </div>
      <ReportMetric label="سود خالص" value="—" valueColor="var(--aw-primary)" />
      <ReportMetric label="نسبت سود" value="—" valueColor="var(--aw-secondary)" />
      <button className="w-full py-2.5 px-5 mt-3 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); setAdminScreen('financeScreen'); }}>رفتن به ماژول مالی</button>
    </div>
  );
}

function CrmReportDetail() {
  const { customers, deals, closeModal, setAdminScreen } = useApp();
  return (
    <div>
      <ReportMetric label="مشتریان فعال" value={toFa(customers.filter(c => c.status === 'active').length)} valueColor="var(--aw-secondary)" />
      <ReportMetric label="سرنخ‌ها" value={toFa(customers.filter(c => c.status === 'lead').length)} valueColor="var(--aw-accent)" />
      <ReportMetric label="معاملات بسته" value={toFa(deals.filter(d => d.stage === 'closed').length)} valueColor="var(--aw-primary)" />
      <ReportMetric label="معاملات باز" value={toFa(deals.filter(d => d.stage !== 'closed').length)} />
      <ReportMetric label="کل ارزش معاملات" value="—" valueColor="var(--aw-secondary)" />
      <button className="w-full py-2.5 px-5 mt-3 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={() => { closeModal(); setAdminScreen('crmScreen'); }}>رفتن به CRM</button>
    </div>
  );
}

function ActivityReportDetail() {
  const { personnel, closeModal } = useApp();
  return (
    <div>
      <ReportMetric label="کل پیام‌ها (امروز)" value={toFa(47)} />
      <ReportMetric label="تماس‌های داخلی" value={toFa(12)} />
      <ReportMetric label="تماس‌های خارجی" value={toFa(8)} />
      <ReportMetric label="پرسنل آنلاین" value={toFa(personnel.filter(p => p.status === 'online').length)} valueColor="var(--aw-online)" />
      <ReportMetric label="متوسط زمان پاسخ" value="۲ دقیقه" />
      <ReportMetric label="رضایت مشتریان" value="—" valueColor="var(--aw-secondary)" />
      <button className="w-full py-2.5 px-5 mt-3 border-none rounded-[10px] text-[13px] text-white cursor-pointer" style={{ background: 'var(--aw-primary, #2E86FF)', fontWeight: 600 }} onClick={closeModal}>بستن</button>
    </div>
  );
}

// ========================
// FORM COMPONENTS
// ========================
export function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[var(--aw-text-secondary)] mb-1.5" style={{ fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none focus:border-[var(--aw-primary)]"
      style={{ background: 'var(--aw-bg-input)' }}
    />
  );
}

export function FormSelect({ value, onChange, options }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full py-2.5 px-3.5 rounded-[10px] border border-[var(--aw-border)] text-[13px] text-[var(--aw-text-primary)] outline-none appearance-none"
      style={{ background: 'var(--aw-bg-input)' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}


// ========================
// ADMIN AVATAR + AGENT SELECTOR (mobile) — mirrors the personal panel shell
// ========================
const AGENT_PORTRAIT: Record<string, string> = {
  secretary: '/src/assets/avatar-secretary.png',
  marketing: '/src/assets/avatar-marketing.png',
  finance: '/src/assets/avatar-finance.png',
};
const AGENT_HUMAN_NAME: Record<string, string> = {};
// Map each team to its marketplace template so an emptied team can still show a demo agent + hire CTA.
const TEAM_MARKET_ID: Record<string, string> = { assistant: 'm0', secretary: 'm1', marketing: 'm2', procurement: 'm6', sales: 'm7', dine: 'm8' };
function HireAgentContent2({ agentId, name, role, onDone }: { agentId: string; name: string; role: string; onDone: () => void }) {
  const { closeModal, showToast } = useApp();
  const [paying, setPaying] = useState(false);
  const features = ['گفتگوی نامحدود با ایجنت', 'دسترسی کامل به همه امکانات', 'اتصال به ابزارها و ورک‌فلوها', 'پشتیبانی و به‌روزرسانی'];
  const pay = () => {
    setPaying(true);
    setTimeout(() => { onDone(); showToast(name + ' با موفقیت استخدام شد ✅'); closeModal(); }, 1100);
  };
  return (
    <div className="px-1">
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 18%, transparent)', border: '1px solid color-mix(in srgb, var(--aw-eu-primary, #7b62fc) 45%, transparent)' }}>
          <i className="fa-solid fa-briefcase text-[24px]" style={{ color: 'var(--aw-eu-primary, #7b62fc)' }} />
        </div>
        <div className="text-[16px]" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>{name}</div>
        <div className="text-[12px] text-[var(--aw-text-muted)] mt-0.5">{role}</div>
      </div>

      <div className="rounded-[10px] p-3.5 mb-4" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5 text-[12.5px]" style={{ color: 'var(--aw-text-secondary)' }}>
            <i className="fa-solid fa-circle-check text-[13px]" style={{ color: 'var(--aw-eu-primary, #7b62fc)' }} />
            {f}
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between mb-4 px-1">
        <span className="text-[12px] text-[var(--aw-text-muted)]">اشتراک ماهانه</span>
        <span className="text-[20px]" style={{ fontWeight: 800, color: 'var(--aw-text-primary)' }}>۲٬۹۰۰٬۰۰۰ <span className="text-[12px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>تومان / ماه</span></span>
      </div>

      <button
        disabled={paying}
        onClick={pay}
        className="w-full py-3 border-none rounded-[12px] text-[14px] text-white cursor-pointer flex items-center justify-center gap-2"
        style={{ background: 'var(--aw-eu-primary, #7b62fc)', fontWeight: 700, opacity: paying ? 0.7 : 1 }}
      >
        {paying ? (<><i className="fa-solid fa-spinner fa-spin" /> در حال پرداخت…</>) : (<><i className="fa-solid fa-credit-card" /> پرداخت و استخدام</>)}
      </button>
      <div className="text-center text-[10.5px] text-[var(--aw-text-muted)] mt-2.5">پرداخت امن از طریق درگاه بانکی · لغو در هر زمان</div>
    </div>
  );
}

function AdminAvatarBlock() {
  const { agentTeam, setAgentTeam, setAdminScreen, agents, company, agentAccent, setTeamAccent, openModal, closeModal, openChat, isAgentOwned, purchaseAgent, setTeamAgentId, ownedAgents } = useApp();
  const [open, setOpen] = useState(false);
  const [groupIdx, setGroupIdx] = useState(0);
  const teamOrder: TeamKey[] = ['secretary', 'marketing', 'finance', 'procurement', 'sales', 'dine'];
  const active = agentTeam ? TEAM_CONFIGS[agentTeam] : null;
  // All agents belonging to the current team (base + any hired into it), for this company
  const group = agents.filter(a => (!a.company || a.company === company) && (a.team || a.id) === agentTeam);
  useEffect(() => { setGroupIdx(0); }, [agentTeam]);
  const safeIdx = group.length ? Math.min(groupIdx, group.length - 1) : 0;
  const teamAgent = group[safeIdx];
  const marketTemplate = !teamAgent ? AGENT_MARKETPLACE.find(m => m.id === TEAM_MARKET_ID[agentTeam || '']) : null;
  const displayName = teamAgent?.name || marketTemplate?.name || AGENT_HUMAN_NAME[agentTeam || ''] || 'دستیار';
  const portraitSrc = teamAgent?.avatar || AGENT_PORTRAIT[agentTeam || ''] || '/src/assets/avatar-portrait.png';
  // Publish the displayed agent's per-agent accent (overrides the global theme)
  useEffect(() => { setTeamAccent(teamAgent?.accent || null); }, [teamAgent?.accent, teamAgent?.id]);
  // Publish which agent is currently shown so AdminPanel's demo lock matches it
  useEffect(() => { setTeamAgentId(teamAgent?.id || null); }, [teamAgent?.id]);

  // Empty team (all agents deleted) → demo mode; hire opens the marketplace to re-add one.
  const owned = teamAgent ? isAgentOwned(teamAgent.id) : false;
  const openHire = () => {
    // hirescope: team-scoped fallback — همیشه فقط ایجنتِ همین تیم (مثلِ مالی/اداری)، نه لیستِ کلِ مارکت.
    if (teamAgent) { openModal('استخدام ایجنت', <HireAgentContent2 agentId={teamAgent.id} name={teamAgent.name} role={teamAgent.role} onDone={() => purchaseAgent(teamAgent.id, { name: teamAgent.name })} />, () => closeModal()); return; }
    const tid = agentTeam || '';
    if (!tid) { openModal('استخدام ایجنت', <HireAgentContent />, () => closeModal()); return; }
    const nm = marketTemplate?.name || AGENT_HUMAN_NAME[tid] || TEAM_CONFIGS[tid as TeamKey]?.name || 'ایجنت';
    const rl = marketTemplate?.role || TEAM_CONFIGS[tid as TeamKey]?.desc || '';
    // idِ تیم == idِ ایجنتِ پایه؛ استخدام یعنی مالک‌شدنِ همان ایجنتِ پایهٔ تیم (persist سمتِ سرور).
    openModal('استخدام ایجنت', <HireAgentContent2 agentId={tid} name={nm} role={rl} onDone={() => purchaseAgent(tid, { name: nm })} />, () => closeModal());
  };

  const pick = (key: TeamKey) => {
    const cfg = TEAM_CONFIGS[key];
    setAgentTeam(key);
    if (cfg?.navItems?.[0]) setAdminScreen(cfg.navItems[0].id);
    setOpen(false);
  };

  return (
    <div className="md:hidden flex flex-col items-center relative pb-3" style={{ zIndex: 30 }} data-chat-top-anchor>
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: -40, bottom: 0, background: 'linear-gradient(180deg, color-mix(in srgb, var(--aw-primary) 18%, transparent) 0%, color-mix(in srgb, var(--aw-primary) 11%, transparent) 48%, color-mix(in srgb, var(--aw-primary) 4%, transparent) 78%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="flex flex-col items-center w-full" style={{ position: 'relative', zIndex: 1 }}>
      <EuAvatar
        palette="cyan"
        accent={teamAgent?.accent || agentAccent}
        portrait={portraitSrc}
        name={displayName}
        nameOptions={group.map(a => ({ id: a.id, name: a.name }))}
        activeNameId={teamAgent?.id}
        onPickName={(id) => { const i = group.findIndex(a => a.id === id); if (i >= 0) setGroupIdx(i); }}
        onAddName={owned ? () => { /* hireanother: onAddName — استخدامِ نمونهٔ بعدی از مسیرِ پرداخت */
          const teamId = (agentTeam as string) || (teamAgent?.team as string) || teamAgent?.id || '';
          if (!teamId) return;
          const baseKey = company + '::' + teamId;
          const cnt = (ownedAgents || []).filter((k: string) => k === baseKey || k.startsWith(baseKey + '#')).length;
          const baseName = teamAgent?.name || 'ایجنت';
          const _n = cnt + 1;
          const instId = teamId + '#' + _n;
          const instName = baseName + ' ' + toFa(String(_n));
          const _role = teamAgent?.role || '';
          // به‌جای افزودنِ درجا، صفحهٔ پرداخت باز شود؛ پس از پرداخت مالک می‌شود.
          openModal('استخدام ایجنت', <HireAgentContent2 agentId={instId} name={instName} role={_role} onDone={() => { purchaseAgent(instId, { name: instName }); try { (api as any).saveAgentPrefs(instId, { name: instName, role: _role }); } catch (_) {} }} />, () => closeModal());
        } : undefined}
        cornerSlot={<AgentSelector />}
        swipeCount={group.length}
        swipeIndex={safeIdx}
        onSwipeLeft={() => group.length > 1 && setGroupIdx(i => (i + 1) % group.length)}
        onSwipeRight={() => group.length > 1 && setGroupIdx(i => (i - 1 + group.length) % group.length)}
        onLongPress={() => teamAgent && openModal('شخصی‌سازی ایجنت', <CustomizeAgentContent agentId={teamAgent.id} />, () => closeModal())}
        demo={!owned}
        onHire={openHire}
        onChatClick={() => { if (!teamAgent) return; if (owned) openChat(teamAgent.id, 'agent'); else openHire(); }}
      />
      </div>
    </div>
  );
}

// ========================
// ADMIN PANEL MAIN
// ========================
export default function AdminPanel() {
  const { adminScreen, agents, company, companies, defaultAgent, assistantId, startCall, showToast, agentTeam, chat, closeChat, briefingSeen, setBriefingSeen, agentAccent, teamAccent, isAgentOwned, teamAgentId } = useApp();
  const companyAccent = companies?.[company]?.accent || null;
  const showBriefing = !briefingSeen;
  // Active personal-assistant accent — themes the whole embedded EU panel.
  const asstAccActive = agentTeam === 'assistant'
    ? ((agents.find(a => a.id === assistantId) || agents.find(a => a.id === 'assistant'))?.accent || null)
    : null;
  // Current team agent demo state — grayscale the whole workspace until purchased.
  // Use the agent actually shown in the avatar (teamAgentId) so the lock matches it;
  // fall back to the first agent of the team before the avatar has published.
  const _curTeamAgent = (teamAgentId && agents.find(a => a.id === teamAgentId))
    || agents.find(a => (!a.company || a.company === company) && (a.team || a.id) === agentTeam);
  const isDemo = !showBriefing && !isAgentOwned(_curTeamAgent?.id);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Inject a per-agent accent stylesheet that re-themes the whole admin panel
  // (CSS vars, glass blobs, chat pattern) for the currently displayed agent.
  // Effective panel accent: the CURRENT agent's OWN explicit accent wins; if the
  // agent has none, fall through company accent to the global Settings→theme color
  // (agentAccent). Derived from the shown agent directly so a no-accent agent can
  // never inherit a stale teamAccent from a previously-viewed agent.
  const curAgentOwnAccent = _curTeamAgent?.accent || null;
  useEffect(() => {
    const ID = 'aw-agent-accent';
    let el = document.getElementById(ID) as HTMLStyleElement | null;
    const eff = teamAccent || curAgentOwnAccent || companyAccent || agentAccent;
    if (!eff) { if (el) el.textContent = ''; return; }
    if (!el) { el = document.createElement('style'); el.id = ID; document.head.appendChild(el); }
    el.textContent = buildAccentCSS(eff);
  }, [agentAccent, curAgentOwnAccent, companyAccent, teamAccent]);

  // Theme the embedded personal-assistant panel (no .neura-admin scope) with the
  // active assistant's accent — vars, wallet pattern, nav icons, letter avatars.
  useEffect(() => {
    const ID = 'aw-asst-accent';
    let el = document.getElementById(ID) as HTMLStyleElement | null;
    if (!asstAccActive) { if (el) el.textContent = ''; return; }
    if (!el) { el = document.createElement('style'); el.id = ID; document.head.appendChild(el); }
    el.textContent = buildAsstAccentCSS(asstAccActive);
  }, [asstAccActive]);

  // Personal assistant is embedded in the management panel: render the real,
  // unchanged personal (EU) experience. It keeps its own header/footer, but we
  // theme it with the ACTIVE assistant agent's accent so it matches the welcome.
  if (agentTeam === 'assistant') {
    return <div className="neura-asst" style={{ height: '100%' }}><EndUserPanel /></div>;
  }

  return (
    <div className="neura-admin flex h-full min-h-0 relative" style={{ direction: 'rtl' }}>
      <AdminSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(p => !p)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 has-glass-footer" style={{ order: 2 }}>
        <AdminHeader />
        {!showBriefing && <AdminAvatarBlock />}

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative" style={isDemo ? { filter: 'grayscale(1) brightness(0.97)' } : undefined}>
          {isDemo && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10.5, fontWeight: 700, backdropFilter: 'blur(8px)', maxWidth: '92%' }}>
              <i className="fa-solid fa-eye text-[9px]" /> حالت دمو
            </div>
          )}
          <AnimatePresence mode="wait">
            {showBriefing ? (
              <motion.div key="briefing" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <DailyBriefingScreen onDismiss={() => { setBriefingSeen(true); try { const _t = localStorage.getItem('aw-token') || ''; const _p = _t.split('.')[1]; const _j = _p ? JSON.parse(decodeURIComponent(escape(atob(_p.replace(/-/g, '+').replace(/_/g, '/'))))) : {}; localStorage.setItem('aw-brief:' + String((_j as any).sub || (_j as any).id || ''), new Date().toISOString().slice(0, 10)); } catch (_) {} }} />
              </motion.div>
            ) : (
              <>
                {adminScreen === 'assistantScreen' && <motion.div key="assistant" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><EuAssistantScreen /></motion.div>}
                {adminScreen === 'chatsScreen' && <motion.div key="chats" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ChatsScreen /></motion.div>}
                {adminScreen === 'dashboardScreen' && <DashboardScreen key="dashboard" />}
                {adminScreen === 'crmScreen' && <motion.div key="crm" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><CrmScreen /></motion.div>}
                {adminScreen === 'financeScreen' && <motion.div key="finance" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><FinanceScreen /></motion.div>}
                {adminScreen === 'reportsScreen' && <InvoicesScreen key="reports" />}
                {adminScreen === 'analyticsScreen' && <ReportsScreen key="analytics" />}
                {adminScreen === 'tasksScreen' && <motion.div key="tasks" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><TasksScreen /></motion.div>}
                {adminScreen === 'inventoryScreen' && <motion.div key="inventory" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><InventoryScreen isProc={agentTeam === 'procurement' || agentTeam === 'dine'} /></motion.div>}
                {adminScreen === 'purchaseRequestScreen' && <motion.div key="purchaseRequest" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><PurchaseRequestScreen /></motion.div>}
                {adminScreen === 'salesFunnelScreen' && <motion.div key="salesFunnel" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesFunnelScreen /></motion.div>}
                {adminScreen === 'salesForecastScreen' && <motion.div key="salesForecast" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesForecastScreen /></motion.div>}
                {adminScreen === 'campaignScreen' && <motion.div key="campaign" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MarketingCampaignScreen /></motion.div>}
                {adminScreen === 'secTodayScreen' && <motion.div key="secToday" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SecTodayScreen /></motion.div>}
                {adminScreen === 'secPlanningScreen' && <motion.div key="secPlanning" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SecPlanningScreen /></motion.div>}
                {adminScreen === 'secCrmLiteScreen' && <motion.div key="secCrmLite" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SecCrmLiteScreen /></motion.div>}
                {adminScreen === 'secPerformanceScreen' && <motion.div key="secPerformance" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SecPerformanceScreen /></motion.div>}
                {adminScreen === 'secDailyFinanceScreen' && <motion.div key="secDailyFinance" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SecDailyFinanceScreen /></motion.div>}
                {adminScreen === 'mktConversationsScreen' && <motion.div key="mktConversations" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ChatsScreen /></motion.div>}
                {adminScreen === 'mktActionsScreen' && <motion.div key="mktActions" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktActionsScreen /></motion.div>}
                {adminScreen === 'mktCrmScreen' && <motion.div key="mktCrm" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktCrmScreen /></motion.div>}
                {adminScreen === 'mktLeadsScreen' && <motion.div key="mktLeads" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktLeadsScreen /></motion.div>}
                {adminScreen === 'mktApprovalsScreen' && <motion.div key="mktApprovals" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktApprovalsScreen /></motion.div>}
                {adminScreen === 'mktCalendarScreen' && <motion.div key="mktCalendar" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktCalendarScreen /></motion.div>}
                {adminScreen === 'mktSegmentScreen' && <motion.div key="mktSegment" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktSegmentScreen /></motion.div>}
                {adminScreen === 'mktPerformanceScreen' && <motion.div key="mktPerformance" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MktPerformanceScreen /></motion.div>}
                {adminScreen === 'procRequestsScreen' && <motion.div key="procRequests" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProcRequestsScreen /></motion.div>}
                {adminScreen === 'procOrdersScreen' && <motion.div key="procOrders" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProcOrdersScreen /></motion.div>}
                {adminScreen === 'procDeliveryScreen' && <motion.div key="procDelivery" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProcDeliveryScreen /></motion.div>}
                {adminScreen === 'procSupplyScreen' && <motion.div key="procSupply" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProcSupplyScreen /></motion.div>}
                {adminScreen === 'procImportScreen' && <motion.div key="procImport" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProcImportScreen /></motion.div>}
                {adminScreen === 'procFinanceScreen' && <motion.div key="procFinance" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProcFinanceScreen /></motion.div>}
                {adminScreen === 'salesPosScreen' && <motion.div key="salesPos" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesPosScreen /></motion.div>}
                {adminScreen === 'salesOrdersScreen' && <motion.div key="salesOrders" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesOrdersScreen /></motion.div>}
                {adminScreen === 'salesInvoicesScreen' && <motion.div key="salesInvoices" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesInvoicesScreen /></motion.div>}
                {adminScreen === 'salesMenuScreen' && <motion.div key="salesMenu" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesMenuScreen /></motion.div>}
                {adminScreen === 'salesCustomersScreen' && <motion.div key="salesCustomers" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesCustomersScreen /></motion.div>}
                {adminScreen === 'salesQuickReportScreen' && <motion.div key="salesQuickReport" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesQuickReportScreen /></motion.div>}
                {adminScreen === 'salesConversationsScreen' && <motion.div key="salesConversations" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ChatsScreen /></motion.div>}
                {adminScreen === 'salesShiftScreen' && <motion.div key="salesShift" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SalesShiftScreen /></motion.div>}
                {adminScreen === 'dineMenuScreen' && <motion.div key="dineMenu" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineMenuBuilderScreen /></motion.div>}
                {adminScreen === 'dinePosScreen' && <motion.div key="dinePos" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DinePosScreen /></motion.div>}
                {adminScreen === 'dineTablesScreen' && <motion.div key="dineTables" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineTablesScreen /></motion.div>}
                {adminScreen === 'dineReservationsScreen' && <motion.div key="dineReservations" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineReservationsScreen /></motion.div>}
                {adminScreen === 'dineKdsScreen' && <motion.div key="dineKds" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineKdsScreen /></motion.div>}
                {adminScreen === 'dineRecipesScreen' && <motion.div key="dineRecipes" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineRecipesScreen /></motion.div>}
                {adminScreen === 'dineStaffScreen' && <motion.div key="dineStaff" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineStaffScreen /></motion.div>}
                {adminScreen === 'dineLoyaltyScreen' && <motion.div key="dineLoyalty" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineLoyaltyScreen /></motion.div>}
                {adminScreen === 'dineMarketingScreen' && <motion.div key="dineMarketing" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineMarketingScreen /></motion.div>}
                {adminScreen === 'dineCompetitorsScreen' && <motion.div key="dineCompetitors" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineCompetitorsScreen /></motion.div>}
                {adminScreen === 'dineReportsScreen' && <motion.div key="dineReports" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineInsightsScreen /></motion.div>}
                {adminScreen === 'dineSettingsScreen' && <motion.div key="dineSettings" className="flex flex-col h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DineSettingsScreen /></motion.div>}
              </>
            )}
          </AnimatePresence>
        </div>

        {!showBriefing && <div className="glass-footer-mount"><AdminNav /></div>}

        {/* Close chat FAB — opposite side (mobile only) */}
        <AnimatePresence>
          {!showBriefing && chat.open && (
            <motion.button
              className="absolute bottom-16 right-4 w-[40px] h-[40px] rounded-full border-none text-white cursor-pointer z-40 flex items-center justify-center md:hidden"
              style={{
                background: 'linear-gradient(135deg, #64748b, #475569)',
                boxShadow: '0 4px 12px rgba(100,116,139,0.4)',
                marginBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              whileHover={{ scale: 1.15, boxShadow: '0 6px 20px rgba(100,116,139,0.55)' }}
              whileTap={{ scale: 0.8 }}
              onClick={closeChat}
            >
              <i className="fa-solid fa-xmark text-[16px]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
