import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { LetterAvatar } from './letter-avatar';
import { ProductDetail, OrderDetail, OrderFlow, SalesAlertsSection, BUSINESS_TYPES, type PresetCat } from './sales-extra';

// ========================
// SHARED STYLES
// ========================
const cardStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  borderRadius: 10,
  border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)',
};
const tabBarStyle: React.CSSProperties = {
  background: 'var(--aw-eu-nav-bg)',
  border: '1px solid var(--aw-eu-nav-border)',
  borderRadius: 9999,
  padding: 3,
  backdropFilter: 'blur(20px)',
};
const activeTabStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--aw-primary) 10%, transparent)',
  borderRadius: 9999,
  color: 'var(--aw-text-primary)',
  fontWeight: 700,
  boxShadow: 'inset 0 0 0 1px var(--aw-border), 0 2px 6px rgba(0,0,0,0.10)',
};
const inactiveTabStyle: React.CSSProperties = {
  background: 'transparent',
  borderRadius: 9999,
  color: 'var(--aw-text-secondary)',
};

// ========================
// MOCK DATA
// ========================
const PRODUCT_CATEGORIES = [
  { id: 'food', name: 'غذاها', icon: 'fa-solid fa-utensils', count: 24, color: 'var(--aw-primary)' },
  { id: 'drink', name: 'نوشیدنی‌ها', icon: 'fa-solid fa-mug-hot', count: 18, color: 'var(--aw-primary)' },
  { id: 'dessert', name: 'دسرها', icon: 'fa-solid fa-ice-cream', count: 12, color: 'var(--aw-primary)' },
  { id: 'snack', name: 'اسنک‌ها', icon: 'fa-solid fa-cookie', count: 15, color: '#F59E0B' },
  { id: 'package', name: 'بسته‌ای', icon: 'fa-solid fa-box', count: 8, color: 'var(--aw-primary)' },
  { id: 'breakfast', name: 'صبحانه', icon: 'fa-solid fa-egg', count: 9, color: '#10B981' },
  { id: 'grill', name: 'کباب و گریل', icon: 'fa-solid fa-fire-burner', count: 11, color: '#EF4444' },
  { id: 'salad', name: 'سالاد', icon: 'fa-solid fa-leaf', count: 7, color: '#22C55E' },
];

const PRODUCTS = [
  { id: 'p1', name: 'پیتزا مخصوص', category: 'food', price: 285000, stock: 45, unit: 'عدد', img: '🍕', discount: 10 },
  { id: 'p2', name: 'برگر کلاسیک', category: 'food', price: 195000, stock: 32, unit: 'عدد', img: '🍔', discount: 0 },
  { id: 'p3', name: 'پاستا آلفردو', category: 'food', price: 245000, stock: 18, unit: 'عدد', img: '🍝', discount: 15 },
  { id: 'p4', name: 'سالاد سزار', category: 'salad', price: 165000, stock: 25, unit: 'عدد', img: '🥗', discount: 0 },
  { id: 'p5', name: 'قهوه لاته', category: 'drink', price: 85000, stock: 0, unit: 'فنجان', img: '☕', discount: 0 },
  { id: 'p6', name: 'اسموتی توت‌فرنگی', category: 'drink', price: 120000, stock: 5, unit: 'لیوان', img: '🍓', discount: 20 },
  { id: 'p7', name: 'چیزکیک', category: 'dessert', price: 135000, stock: 10, unit: 'برش', img: '🍰', discount: 0 },
  { id: 'p8', name: 'تیرامیسو', category: 'dessert', price: 145000, stock: 8, unit: 'عدد', img: '🧁', discount: 5 },
  { id: 'p9', name: 'ناچو پنیری', category: 'snack', price: 98000, stock: 40, unit: 'عدد', img: '🧀', discount: 0 },
  { id: 'p10', name: 'نوشابه خانواده', category: 'drink', price: 45000, stock: 60, unit: 'بطری', img: '🥤', discount: 0 },
  { id: 'p11', name: 'جوجه‌کباب', category: 'grill', price: 320000, stock: 22, unit: 'پرس', img: '🍢', discount: 0 },
  { id: 'p12', name: 'کباب کوبیده', category: 'grill', price: 295000, stock: 4, unit: 'پرس', img: '🥙', discount: 0 },
  { id: 'p13', name: 'املت ویژه', category: 'breakfast', price: 110000, stock: 15, unit: 'عدد', img: '🍳', discount: 0 },
  { id: 'p14', name: 'نیمرو و سوسیس', category: 'breakfast', price: 95000, stock: 0, unit: 'عدد', img: '🍳', discount: 0 },
  { id: 'p15', name: 'سالاد یونانی', category: 'salad', price: 175000, stock: 12, unit: 'عدد', img: '🥗', discount: 10 },
  { id: 'p16', name: 'آب‌پرتقال طبیعی', category: 'drink', price: 75000, stock: 30, unit: 'لیوان', img: '🧃', discount: 0 },
  { id: 'p17', name: 'بستنی سنتی', category: 'dessert', price: 90000, stock: 3, unit: 'پیمانه', img: '🍨', discount: 15 },
  { id: 'p18', name: 'سیب‌زمینی سرخ‌کرده', category: 'snack', price: 85000, stock: 50, unit: 'عدد', img: '🍟', discount: 0 },
  { id: 'p19', name: 'پکیج خانواده', category: 'package', price: 850000, stock: 9, unit: 'بسته', img: '📦', discount: 12 },
  { id: 'p20', name: 'ساندویچ مرغ', category: 'food', price: 145000, stock: 2, unit: 'عدد', img: '🥪', discount: 0 },
];

const INVOICES_DATA = [
  { id: 'INV-1401', customer: 'علی محمدی', phone: '۰۹۱۲***۴۵۶۷', amount: 685000, discount: 35000, tax: 61500, status: 'paid', date: '۱۴۰۴/۱۲/۰۱', items: 3, method: 'کارت' },
  { id: 'INV-1402', customer: 'سارا احمدی', phone: '۰۹۱۳***۲۳۴۵', amount: 1250000, discount: 125000, tax: 112500, status: 'paid', date: '۱۴۰۴/۱۲/۰۱', items: 5, method: 'نقد' },
  { id: 'INV-1403', customer: 'رضا کریمی', phone: '۰۹۱۵***۸۹۰۱', amount: 430000, discount: 0, tax: 38700, status: 'pending', date: '۱۴۰۴/۱۲/۰۲', items: 2, method: 'کیف پول' },
  { id: 'INV-1404', customer: 'مریم حسینی', phone: '۰۹۱۶***۱۲۳۴', amount: 890000, discount: 45000, tax: 80100, status: 'pending', date: '۱۴۰۴/۱۲/۰۲', items: 4, method: 'کارت' },
  { id: 'INV-1405', customer: 'حسن رضایی', phone: '۰۹۱۷***۵۶۷۸', amount: 320000, discount: 0, tax: 28800, status: 'cancelled', date: '۱۴۰۴/۱۱/۲۸', items: 2, method: 'نقد' },
  { id: 'INV-1406', customer: 'فاطمه نوری', phone: '۰۹۱۴***۴۳۲۱', amount: 1580000, discount: 158000, tax: 142200, status: 'paid', date: '۱۴۰۴/۱۱/۲۹', items: 7, method: 'کارت' },
  { id: 'INV-1407', customer: 'امیر تقوی', phone: '۰۹۱۹***۳۲۱۰', amount: 245000, discount: 0, tax: 22050, status: 'cancelled', date: '۱۴۰۴/۱۱/۲۷', items: 1, method: 'نقد' },
  { id: 'INV-1408', customer: 'زهرا صادقی', phone: '۰۹۳۵***۸۸۸۸', amount: 195000, discount: 0, tax: 17550, status: 'returned', date: '۱۴۰۴/۱۱/۲۶', items: 2, method: 'کارت' },
  { id: 'INV-1409', customer: 'محمد حسینی', phone: '۰۹۱۲***۱۱۲۲', amount: 525000, discount: 25000, tax: 47250, status: 'returned', date: '۱۴۰۴/۱۱/۲۵', items: 3, method: 'کیف پول' },
];

const INVOICE_ITEMS: Record<string, { name: string; qty: number; price: number; icon: string }[]> = {
  'INV-1401': [
    { name: 'پیتزا مخصوص', qty: 1, price: 285000, icon: 'fa-solid fa-pizza-slice' },
    { name: 'نوشابه', qty: 2, price: 25000, icon: 'fa-solid fa-bottle-water' },
    { name: 'سالاد سزار', qty: 1, price: 350000, icon: 'fa-solid fa-leaf' },
  ],
  'INV-1402': [
    { name: 'پکیج خانواده', qty: 1, price: 850000, icon: 'fa-solid fa-box' },
    { name: 'قهوه لاته', qty: 2, price: 85000, icon: 'fa-solid fa-mug-hot' },
    { name: 'چیزکیک', qty: 2, price: 115000, icon: 'fa-solid fa-cake-candles' },
  ],
  'INV-1403': [
    { name: 'برگر کلاسیک', qty: 2, price: 195000, icon: 'fa-solid fa-burger' },
    { name: 'نوشابه', qty: 2, price: 20000, icon: 'fa-solid fa-bottle-water' },
  ],
  'INV-1404': [
    { name: 'پیتزا مخصوص', qty: 2, price: 285000, icon: 'fa-solid fa-pizza-slice' },
    { name: 'پاستا آلفردو', qty: 1, price: 220000, icon: 'fa-solid fa-bowl-food' },
    { name: 'نوشابه', qty: 4, price: 25000, icon: 'fa-solid fa-bottle-water' },
  ],
};

const CUSTOMERS_DATA = [
  { id: 'c1', name: 'علی محمدی', phone: '۰۹۱۲***۴۵۶۷', purchases: 23, totalSpent: 8750000, points: 875, tier: 'طلایی', lastVisit: '۱۴۰۴/۱۲/۰۱', segment: 'loyal', activity: 'active', cashback: 175000, avatar: '👨🏻', tags: ['ثابت', 'صبحانه‌خور'], interests: ['پیتزا', 'قهوه', 'دسر'], avgBasket: 380000, freq: 'هفتگی', channel: 'حضوری' },
  { id: 'c2', name: 'سارا احمدی', phone: '۰۹۱۳***۲۳۴۵', purchases: 45, totalSpent: 15200000, points: 1520, tier: 'الماسی', lastVisit: '۱۴۰۴/۱۲/۰۲', segment: 'vip', activity: 'active', cashback: 320000, avatar: '👩🏻', tags: ['VIP', 'سفارش گروهی'], interests: ['پاستا', 'سالاد', 'نوشیدنی'], avgBasket: 520000, freq: '۳ بار در هفته', channel: 'آنلاین' },
  { id: 'c3', name: 'رضا کریمی', phone: '۰۹۱۵***۸۹۰۱', purchases: 8, totalSpent: 2100000, points: 210, tier: 'نقره‌ای', lastVisit: '۱۴۰۴/۱۱/۲۸', segment: 'atRisk', activity: 'inactive', cashback: 42000, avatar: '🧔🏻', tags: ['آنلاین‌پسند'], interests: ['برگر', 'نوشابه'], avgBasket: 280000, freq: 'ماهانه', channel: 'تلفن' },
  { id: 'c4', name: 'مریم حسینی', phone: '۰۹۱۶***۱۲۳۴', purchases: 15, totalSpent: 5600000, points: 560, tier: 'طلایی', lastVisit: '۱۴۰۴/۱۲/۰۱', segment: 'loyal', activity: 'active', cashback: 112000, avatar: '👩🏽', tags: ['خانوادگی', 'ناهارخور'], interests: ['چلوکباب', 'سالاد'], avgBasket: 410000, freq: 'دو هفته یکبار', channel: 'حضوری' },
  { id: 'c5', name: 'حسن رضایی', phone: '۰۹۱۷***۵۶۷۸', purchases: 3, totalSpent: 950000, points: 95, tier: 'برنزی', lastVisit: '۱۴۰۴/۱۱/۲۵', segment: 'new', activity: 'active', cashback: 19000, avatar: '🧑🏻', tags: ['تازه‌وارد'], interests: ['برگر'], avgBasket: 240000, freq: 'تازه', channel: 'آنلاین' },
  { id: 'c6', name: 'فاطمه نوری', phone: '۰۹۱۴***۴۳۲۱', purchases: 31, totalSpent: 11800000, points: 1180, tier: 'الماسی', lastVisit: '۱۴۰۴/۱۲/۰۲', segment: 'vip', activity: 'active', cashback: 236000, avatar: '👩🏻‍🦰', tags: ['VIP', 'دسرخور'], interests: ['چیزکیک', 'قهوه', 'پاستا'], avgBasket: 480000, freq: 'هفتگی', channel: 'آنلاین' },
  { id: 'c7', name: 'مهدی شفیعی', phone: '۰۹۱۲***۸۸۲۳', purchases: 1, totalSpent: 165000, points: 20, tier: 'برنزی', lastVisit: '۱۴۰۴/۱۱/۲۲', segment: 'new', activity: 'active', cashback: 3300, avatar: '👨🏻‍💼', tags: ['تازه‌وارد'], interests: ['نوشابه'], avgBasket: 165000, freq: 'تازه', channel: 'حضوری' },
  { id: 'c8', name: 'الهام صالحی', phone: '۰۹۱۹***۵۵۴۲', purchases: 6, totalSpent: 1450000, points: 145, tier: 'برنزی', lastVisit: '۱۴۰۴/۱۰/۱۸', segment: 'inactive', activity: 'inactive', cashback: 29000, avatar: '👩🏼', tags: ['غیرفعال'], interests: ['سالاد'], avgBasket: 240000, freq: 'بدون فعالیت', channel: 'تلفن' },
  { id: 'c9', name: 'کاوه نیکزاد', phone: '۰۹۳۵***۷۷۱۹', purchases: 11, totalSpent: 3850000, points: 385, tier: 'نقره‌ای', lastVisit: '۱۴۰۴/۱۱/۰۵', segment: 'atRisk', activity: 'risk', cashback: 77000, avatar: '🧑🏻‍💻', tags: ['در خطر ریزش'], interests: ['پیتزا', 'برگر'], avgBasket: 350000, freq: 'کاهشی', channel: 'آنلاین' },
  { id: 'c10', name: 'نگار موسوی', phone: '۰۹۱۲***۳۳۴۴', purchases: 52, totalSpent: 18900000, points: 1890, tier: 'الماسی', lastVisit: '۱۴۰۴/۱۲/۰۲', segment: 'vip', activity: 'active', cashback: 378000, avatar: '👩🏻‍🦱', tags: ['VIP', 'تخفیف فعال'], interests: ['سالاد', 'آب‌میوه'], avgBasket: 560000, freq: 'روزانه', channel: 'حضوری' },
  { id: 'c11', name: 'بهرام اکبری', phone: '۰۹۱۳***۹۹۸۸', purchases: 4, totalSpent: 720000, points: 72, tier: 'برنزی', lastVisit: '۱۴۰۴/۱۱/۳۰', segment: 'new', activity: 'active', cashback: 14000, avatar: '🧔🏽', tags: ['تازه‌وارد', 'دارای شکایت'], interests: ['کباب'], avgBasket: 180000, freq: 'تازه', channel: 'تلفن' },
  { id: 'c12', name: 'سمیرا کاظمی', phone: '۰۹۱۹***۲۲۱۱', purchases: 19, totalSpent: 6300000, points: 630, tier: 'طلایی', lastVisit: '۱۴۰۴/۱۲/۰۱', segment: 'loyal', activity: 'active', cashback: 126000, avatar: '👩🏼‍🦰', tags: ['وفادار', 'تخفیف فعال'], interests: ['دسر', 'قهوه'], avgBasket: 330000, freq: 'هفتگی', channel: 'آنلاین' },
  { id: 'c13', name: 'پویا رستمی', phone: '۰۹۳۵***۵۵۶۶', purchases: 2, totalSpent: 410000, points: 41, tier: 'برنزی', lastVisit: '۱۴۰۴/۱۰/۰۲', segment: 'inactive', activity: 'inactive', cashback: 8000, avatar: '🧑🏻', tags: ['غیرفعال'], interests: ['ساندویچ'], avgBasket: 205000, freq: 'بدون فعالیت', channel: 'حضوری' },
  { id: 'c14', name: 'لیلا فرهادی', phone: '۰۹۱۶***۷۸۹۰', purchases: 27, totalSpent: 9100000, points: 910, tier: 'طلایی', lastVisit: '۱۴۰۴/۱۲/۰۲', segment: 'loyal', activity: 'active', cashback: 182000, avatar: '👩🏽‍🦱', tags: ['وفادار', 'خانوادگی'], interests: ['پیتزا', 'پکیج'], avgBasket: 420000, freq: 'هفتگی', channel: 'آنلاین' },
  { id: 'c15', name: 'آرش جهانی', phone: '۰۹۱۷***۱۲۳۴', purchases: 7, totalSpent: 1980000, points: 198, tier: 'نقره‌ای', lastVisit: '۱۴۰۴/۱۱/۱۰', segment: 'atRisk', activity: 'risk', cashback: 39000, avatar: '🧑🏼‍💼', tags: ['در خطر ریزش', 'دارای شکایت'], interests: ['برگر', 'سیب‌زمینی'], avgBasket: 283000, freq: 'کاهشی', channel: 'تلفن' },
];

const CUSTOMER_SEGMENTS = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-users', color: '#10B981' },
  { id: 'vip', label: 'VIP', icon: 'fa-solid fa-crown', color: '#FFD700' },
  { id: 'loyal', label: 'وفادار', icon: 'fa-solid fa-heart', color: 'var(--aw-primary)' },
  { id: 'new', label: 'جدید', icon: 'fa-solid fa-user-plus', color: 'var(--aw-primary)' },
  { id: 'inactive', label: 'غیرفعال', icon: 'fa-solid fa-moon', color: '#6B7280' },
  { id: 'atRisk', label: 'در خطر ریزش', icon: 'fa-solid fa-triangle-exclamation', color: '#EF4444' },
];

const ACTIVITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'فعال', color: '#10B981', dot: '#10B981' },
  inactive: { label: 'غیرفعال', color: '#6B7280', dot: '#6B7280' },
  risk: { label: 'در خطر ریزش', color: '#EF4444', dot: '#EF4444' },
};

const CUSTOMER_ORDER_HISTORY: Record<string, { id: string; date: string; items: string; total: number; status: string }[]> = {
  c1: [
    { id: 'ORD-901', date: '۱۴۰۴/۱۲/۰۱', items: 'پیتزا مخصوص، نوشابه', total: 285000, status: 'تکمیل' },
    { id: 'ORD-882', date: '۱۴۰۴/۱۱/۲۴', items: 'قهوه لاته، چیزکیک', total: 165000, status: 'تکمیل' },
    { id: 'ORD-861', date: '۱۴۰۴/۱۱/۱۸', items: 'برگر، سالاد، نوشابه', total: 320000, status: 'تکمیل' },
  ],
  c2: [
    { id: 'ORD-905', date: '۱۴۰۴/۱۲/۰۲', items: 'پاستا آلفردو، سالاد سزار', total: 520000, status: 'تکمیل' },
    { id: 'ORD-890', date: '۱۴۰۴/۱۱/۲۶', items: 'پکیج خانواده', total: 850000, status: 'تکمیل' },
  ],
};

const CUSTOMER_CHATS: Record<string, { from: 'cust' | 'me'; text: string; time: string }[]> = {
  c1: [
    { from: 'cust', text: 'سلام، امروز پیتزا داریم؟', time: '۱۰:۳۲' },
    { from: 'me', text: 'بله، پیتزا مخصوص آماده است 🍕', time: '۱۰:۳۳' },
    { from: 'cust', text: 'یه عدد رزرو کنید لطفاً', time: '۱۰:۳۴' },
  ],
  c2: [
    { from: 'cust', text: 'سفارش گروهی برای جلسه فردا می‌خوام', time: 'دیروز' },
    { from: 'me', text: 'حتماً، چند نفر هستید؟', time: 'دیروز' },
  ],
};

const TIER_COLORS: Record<string, string> = {
  'برنزی': '#CD7F32',
  'نقره‌ای': '#C0C0C0',
  'طلایی': '#FFD700',
  'الماسی': '#B9F2FF',
};

const DAILY_SALES = [
  { hour: '۸', amount: 450 },
  { hour: '۹', amount: 820 },
  { hour: '۱۰', amount: 1200 },
  { hour: '۱۱', amount: 1650 },
  { hour: '۱۲', amount: 2800 },
  { hour: '۱۳', amount: 3200 },
  { hour: '۱۴', amount: 2400 },
  { hour: '۱۵', amount: 1800 },
  { hour: '۱۶', amount: 1400 },
  { hour: '۱۷', amount: 1900 },
  { hour: '۱۸', amount: 2600 },
  { hour: '۱۹', amount: 3100 },
];

const TOP_PRODUCTS = [
  { name: 'پیتزا مخصوص', sold: 48, revenue: 13680000, pct: 100 },
  { name: 'برگر کلاسیک', sold: 35, revenue: 6825000, pct: 73 },
  { name: 'قهوه لاته', sold: 62, revenue: 5270000, pct: 65 },
  { name: 'پاستا آلفردو', sold: 22, revenue: 5390000, pct: 46 },
  { name: 'چیزکیک', sold: 28, revenue: 3780000, pct: 58 },
];

// ========================
// SHARED COMPONENTS
// ========================
function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
      {tabs.map(t => (
        <button
          key={t.id}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 border-none cursor-pointer transition-all text-[11px]"
          style={active === t.id ? activeTabStyle : inactiveTabStyle}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <i className={`${t.icon} text-[11px]`} />}
          <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, icon, count, color, action }: { title: string; icon: string; count?: number; color?: string; action?: { label: string; onClick: () => void } }) {
  const c = 'var(--aw-primary)';
  return (
    <div className="flex items-center gap-2 px-1 pt-3 pb-1">
      <i className={`${icon} text-[14px]`} style={{ color: c }} />
      <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{title}</span>
      {count !== undefined && (
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-primary-bg)', color: c }}>{count}</span>
      )}
      {action && (
        <button
          className="mr-auto text-[11px] px-3 py-1 rounded-lg border-none cursor-pointer"
          style={{ background: 'var(--aw-primary-bg)', color: c }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  );
}

function formatPrice(n: number): string {
  return n.toLocaleString('en-US').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]) + ' ت';
}
// Group thousands then convert to Persian digits (for inputs/labels)
function faMoney(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n.replace(/[^\d]/g, '') || '0', 10) : n;
  return num.toLocaleString('en-US').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function EditProductContent({ product }: { product: any }) {
  const { showToast, closeModal } = useApp();
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(String(product.price || ''));
  const [stock, setStock] = useState(String(product.stock || ''));
  const [discount, setDiscount] = useState(String(product.discount || 0));
  const [unit, setUnit] = useState(product.unit || 'عدد');
  const inputStyle: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 12, padding: '11px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand', 'Vazirmatn', sans-serif" };
  const Label = ({ children }: any) => <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{children}</label>;
  const priceNum = parseInt(price.replace(/[^\d]/g, '') || '0', 10);
  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#10B98115' }}>
        <span className="text-[30px]">{product.img}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] truncate" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{name || product.name}</div>
          <div className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{faMoney(priceNum)} ت</div>
        </div>
      </div>
      <div><Label>نام محصول</Label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>قیمت (تومان)</Label><input style={inputStyle} dir="ltr" inputMode="numeric" value={faMoney(price)} onChange={e => setPrice(e.target.value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))} /></div>
        <div><Label>تخفیف (٪)</Label><input style={inputStyle} dir="ltr" inputMode="numeric" value={discount} onChange={e => setDiscount(e.target.value.replace(/[^\d]/g, ''))} /></div>
        <div><Label>موجودی</Label><input style={inputStyle} dir="ltr" inputMode="numeric" value={stock} onChange={e => setStock(e.target.value.replace(/[^\d]/g, ''))} /></div>
        <div><Label>واحد</Label>
          <select style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)}>
            {['عدد', 'کیلوگرم', 'بسته', 'جعبه', 'لیتر', 'متر'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <button onClick={() => { showToast('تغییرات محصول ذخیره شد ✅', 'success'); closeModal(); }} className="mt-1 w-full rounded-[12px] border-none cursor-pointer text-white py-3 text-[14px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700, fontFamily: "'Kamand', 'Vazirmatn', sans-serif" }}>
        <i className="fa-solid fa-check-circle ml-1.5" />ذخیره تغییرات
      </button>
    </div>
  );
}

// ========================
// 1) SALES POS SCREEN
// ========================
export function SalesPosScreen() {
  const { showToast, openModal } = useApp();
  const [cart, setCart] = useState<{ product: typeof PRODUCTS[0]; qty: number }[]>([]);
  const [selectedCat, setSelectedCat] = useState('food');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [discount, setDiscount] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const filteredProducts = PRODUCTS.filter(p => p.category === selectedCat);

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  const discountAmount = Math.round(subtotal * discount / 100);
  const tax = Math.round((subtotal - discountAmount) * 0.09);
  const total = subtotal - discountAmount + tax;

  const submitOrder = () => {
    showToast(`فاکتور ${formatPrice(total)} با موفقیت صادر شد ✅`);
    setCart([]);
    setDiscount(0);
    setShowCheckout(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--aw-bg-app)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
          <i className="fa-solid fa-cart-shopping text-[14px]" />
        </div>
        <div className="flex-1">
          <div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>فروش جدید (POS)</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">ثبت سفارش و صدور فاکتور</div>
        </div>
        {cart.length > 0 && (
          <button
            className="relative px-3 py-2 rounded-[10px] border-none text-white cursor-pointer text-[12px] flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}
            onClick={() => setShowCheckout(true)}
          >
            <i className="fa-solid fa-receipt" />
            تسویه
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
              {cart.reduce((s, c) => s + c.qty, 0)}
            </span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Category selector */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border-none cursor-pointer whitespace-nowrap text-[11px] transition-all"
              style={selectedCat === cat.id
                ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff' }
                : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-muted)', border: '1px solid var(--aw-border)' }
              }
              onClick={() => setSelectedCat(cat.id)}
            >
              <i className={`${cat.icon} text-[12px]`} />
              {cat.name}
              <span className="text-[10px] opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 gap-2 px-4">
          {filteredProducts.map(product => {
            const inCart = cart.find(c => c.product.id === product.id);
            return (
              <motion.button
                key={product.id}
                className="relative flex flex-col items-center p-3 rounded-[10px] border-none cursor-pointer text-center transition-all"
                style={{
                  ...cardStyle,
                  outline: inCart ? '2px solid #10B981' : 'none',
                  opacity: product.stock === 0 ? 0.4 : 1,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => product.stock > 0 && addToCart(product)}
                disabled={product.stock === 0}
              >
                <span className="text-[28px] mb-1">{product.img}</span>
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</span>
                <span className="text-[12px] mt-0.5" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(product.price)}</span>
                {product.discount > 0 && (
                  <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
                    {product.discount}%
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-[10px] text-[12px] text-white" style={{ background: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>
                    ناموجود
                  </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="text-[9px] mt-0.5" style={{ color: '#F59E0B' }}>موجودی: {product.stock}</span>
                )}
                {inCart && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: '#10B981', fontWeight: 700 }}>
                    {inCart.qty}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="mx-4 mt-4 p-3 rounded-[10px]" style={cardStyle}>
            <SectionHeader title="سبد خرید" icon="fa-solid fa-basket-shopping" count={cart.reduce((s, c) => s + c.qty, 0)} />
            <div className="flex flex-col gap-2 mt-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--aw-bg-app)' }}>
                  <span className="text-[20px]">{item.product.img}</span>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{item.product.name}</div>
                    <div className="text-[11px]" style={{ color: '#10B981' }}>{formatPrice(item.product.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-6 h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-white text-[12px]"
                      style={{ background: '#EF4444' }}
                      onClick={() => updateQty(item.product.id, -1)}
                    >−</button>
                    <span className="text-[13px] text-[var(--aw-text-primary)] w-5 text-center" style={{ fontWeight: 700 }}>{item.qty}</span>
                    <button
                      className="w-6 h-6 rounded-full border-none cursor-pointer flex items-center justify-center text-white text-[12px]"
                      style={{ background: '#10B981' }}
                      onClick={() => updateQty(item.product.id, 1)}
                    >+</button>
                  </div>
                  <span className="text-[12px] min-w-[70px] text-left" style={{ color: '#10B981', fontWeight: 700 }}>
                    {formatPrice(item.product.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout overlay */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: 'var(--aw-bg-app)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
              <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowCheckout(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>تسویه حساب</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Items summary */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="text-[13px] text-[var(--aw-text-primary)] mb-2" style={{ fontWeight: 700 }}>آیتم‌ها ({cart.reduce((s, c) => s + c.qty, 0)})</div>
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between py-1.5 text-[12px]">
                    <span className="text-[var(--aw-text-secondary)]">{item.product.img} {item.product.name} × {item.qty}</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(item.product.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="text-[12px] text-[var(--aw-text-secondary)] mb-2">تخفیف (درصد)</div>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 20].map(d => (
                    <button
                      key={d}
                      className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] transition-all"
                      style={discount === d
                        ? { background: '#10B981', color: '#fff', fontWeight: 700 }
                        : { background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }
                      }
                      onClick={() => setDiscount(d)}
                    >
                      {d === 0 ? 'بدون' : `${d}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="text-[12px] text-[var(--aw-text-secondary)] mb-2">روش پرداخت</div>
                <div className="flex gap-2">
                  {[
                    { id: 'cash' as const, label: 'نقد', icon: 'fa-solid fa-money-bill-wave' },
                    { id: 'card' as const, label: 'کارت', icon: 'fa-solid fa-credit-card' },
                    { id: 'wallet' as const, label: 'کیف پول', icon: 'fa-solid fa-wallet' },
                  ].map(m => (
                    <button
                      key={m.id}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[10px] border-none cursor-pointer text-[11px] transition-all"
                      style={paymentMethod === m.id
                        ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff' }
                        : { background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)', border: '1px solid var(--aw-border)' }
                      }
                      onClick={() => setPaymentMethod(m.id)}
                    >
                      <i className={`${m.icon} text-[16px]`} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                <div className="flex justify-between py-1 text-[12px]">
                  <span className="text-[var(--aw-text-secondary)]">جمع کل</span>
                  <span className="text-[var(--aw-text-primary)]">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1 text-[12px]">
                    <span className="text-[var(--aw-text-secondary)]">تخفیف ({discount}%)</span>
                    <span style={{ color: '#EF4444' }}>- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-[12px]">
                  <span className="text-[var(--aw-text-secondary)]">مالیات (۹%)</span>
                  <span className="text-[var(--aw-text-muted)]">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between py-2 mt-1 text-[14px]" style={{ borderTop: '1px solid var(--aw-border)' }}>
                  <span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>مبلغ قابل پرداخت</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="p-4" style={{ borderTop: '1px solid var(--aw-border)' }}>
              <button
                className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[14px] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
                onClick={submitOrder}
              >
                <i className="fa-solid fa-check-circle" />
                تایید و صدور فاکتور
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================
// 2) SALES ORDERS SCREEN
// ========================
const ORDERS_DATA = [
  { id: 'ORD-1043', customer: 'علی رضایی', table: 'میز ۴', items: 3, total: 285000, time: '۲ دقیقه پیش', status: 'active', payment: 'pending', note: 'بدون پیاز' },
  { id: 'ORD-1042', customer: 'سارا محمدی', table: 'بیرون‌بر', items: 2, total: 165000, time: '۱۲ دقیقه پیش', status: 'active', payment: 'paid' },
  { id: 'ORD-1041', customer: 'حسین کریمی', table: 'میز ۲', items: 5, total: 540000, time: '۳۰ دقیقه پیش', status: 'completed', payment: 'paid' },
  { id: 'ORD-1040', customer: 'مریم احمدی', table: 'آنلاین', items: 4, total: 380000, time: '۱ ساعت پیش', status: 'completed', payment: 'paid' },
  { id: 'ORD-1039', customer: 'رضا نوری', table: 'میز ۷', items: 2, total: 210000, time: '۲ ساعت پیش', status: 'completed', payment: 'paid' },
  { id: 'ORD-1038', customer: 'زهرا صادقی', table: 'بیرون‌بر', items: 1, total: 95000, time: '۳ ساعت پیش', status: 'returned', payment: 'refunded', reason: 'سرد بودن غذا' },
  { id: 'ORD-1037', customer: 'محمد حسینی', table: 'میز ۱', items: 2, total: 175000, time: 'دیروز', status: 'returned', payment: 'refunded', reason: 'اشتباه در سفارش' },
];

const PENDING_APPROVAL_ORDERS = [
  { id: 'ORD-1044', customer: 'نگار کاظمی', table: 'آنلاین', items: 4, total: 425000, time: 'لحظاتی پیش', source: 'سفارش آنلاین', note: 'بسته‌بندی هدیه' },
  { id: 'ORD-1045', customer: 'بهرام شریفی', table: 'بیرون‌بر', items: 2, total: 195000, time: '۳ دقیقه پیش', source: 'تماس تلفنی' },
  { id: 'ORD-1046', customer: 'لیلا فرهادی', table: 'میز ۵', items: 6, total: 685000, time: '۵ دقیقه پیش', source: 'پیشخوان', note: 'تخفیف ویژه درخواست شد' },
];

const QUICK_PRODUCTS = [
  { id: 1, name: 'قرمه‌سبزی', price: 145000, icon: 'fa-solid fa-bowl-rice', color: '#10B981' },
  { id: 2, name: 'چلوکباب', price: 185000, icon: 'fa-solid fa-drumstick-bite', color: 'var(--aw-primary)' },
  { id: 3, name: 'پیتزا مخصوص', price: 220000, icon: 'fa-solid fa-pizza-slice', color: '#EF4444' },
  { id: 4, name: 'نوشابه', price: 25000, icon: 'fa-solid fa-bottle-water', color: 'var(--aw-primary)' },
  { id: 5, name: 'سالاد', price: 65000, icon: 'fa-solid fa-leaf', color: '#22C55E' },
  { id: 6, name: 'دسر', price: 55000, icon: 'fa-solid fa-ice-cream', color: 'var(--aw-primary)' },
];

export function SalesOrdersScreen() {
  const { showToast, openModal, setAdminScreen } = useApp();
  const [activeTab, setActiveTab] = useState('new');
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableName, setTableName] = useState('');

  const tabs = [
    { id: 'new', label: 'سفارش جدید', icon: 'fa-solid fa-plus' },
    { id: 'pending', label: 'در انتظار تایید', icon: 'fa-solid fa-hourglass-half' },
    { id: 'active', label: 'فعال', icon: 'fa-solid fa-fire' },
    { id: 'completed', label: 'تکمیل‌شده', icon: 'fa-solid fa-check' },
    { id: 'returned', label: 'مرجوعی', icon: 'fa-solid fa-rotate-left' },
    { id: 'payment', label: 'پرداخت', icon: 'fa-solid fa-credit-card' },
    { id: 'report', label: 'گزارش', icon: 'fa-solid fa-chart-column' },
  ];

  const [pendingList, setPendingList] = useState(PENDING_APPROVAL_ORDERS);
  const approveOrder = (id: string) => {
    setPendingList(prev => prev.filter(o => o.id !== id));
    showToast(`سفارش ${id} تایید و به لیست فعال منتقل شد`, 'success');
  };
  const rejectOrder = (id: string) => {
    setPendingList(prev => prev.filter(o => o.id !== id));
    showToast(`سفارش ${id} رد شد`, 'info');
  };

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: 'در حال آماده‌سازی', color: '#F59E0B', icon: 'fa-solid fa-fire' },
    completed: { label: 'تکمیل شده', color: '#10B981', icon: 'fa-solid fa-check-circle' },
    returned: { label: 'مرجوعی', color: '#EF4444', icon: 'fa-solid fa-rotate-left' },
  };
  const payConfig: Record<string, { label: string; color: string }> = {
    paid: { label: 'پرداخت‌شده', color: '#10B981' },
    pending: { label: 'در انتظار', color: '#F59E0B' },
    refunded: { label: 'بازگشت‌شده', color: 'var(--aw-primary)' },
  };

  const addToCart = (p: typeof QUICK_PRODUCTS[0]) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };
  const removeFromCart = (id: number) => {
    setCart(prev => prev.flatMap(i => i.id === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i]));
  };
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const submitOrder = () => {
    if (cart.length === 0) { showToast('سبد سفارش خالی است', 'error'); return; }
    showToast(`سفارش ${customerName || 'مهمان'} با موفقیت ثبت شد`, 'success');
    setCart([]); setCustomerName(''); setTableName('');
  };

  const activeOrders = ORDERS_DATA.filter(o => o.status === 'active');
  const completedOrders = ORDERS_DATA.filter(o => o.status === 'completed');
  const returnedOrders = ORDERS_DATA.filter(o => o.status === 'returned');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-4 py-3">
        <div className="flex flex-1 items-center gap-1.5 p-1 rounded-full" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
            <i className="fa-solid fa-bag-shopping text-[12px]" /> سفارشات
          </button>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'transparent', borderColor: 'color-mix(in srgb, var(--aw-border) 22%, transparent)', color: 'var(--aw-text-secondary)', fontWeight: 600 }} onClick={() => setAdminScreen('salesInvoicesScreen')}>
            <i className="fa-solid fa-file-invoice text-[12px]" /> فاکتورها
          </button>
        </div>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Add manual order card (hidden on the new-order form tab) */}
        {activeTab !== 'new' && (
          <button onClick={() => openModal('ثبت سفارش دستی', <OrderFlow />)} className="w-full flex items-center gap-3 p-3 mt-3 mb-1 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
              <i className="fa-solid fa-plus text-[16px] text-white" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>ثبت سفارش دستی</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">ایجاد سفارش جدید به‌صورت مرحله‌به‌مرحله</div>
            </div>
            <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
          </button>
        )}
        {/* ===== TAB: NEW ORDER ===== */}
        {activeTab === 'new' && (
          <div className="flex flex-col gap-3">
            <button className="w-full py-2.5 rounded-[10px] cursor-pointer text-white text-[12px] flex items-center justify-center gap-2" style={{ background: 'color-mix(in srgb, var(--aw-primary) 29%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 55%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)', fontWeight: 700 }} onClick={() => openModal('فرآیند کامل ثبت سفارش', <OrderFlow />)}>
              <i className="fa-solid fa-list-check" />ثبت سفارش
            </button>

            <SectionHeader title="انتخاب سریع محصول" icon="fa-solid fa-bolt" color="#F59E0B" />
            <div className="grid grid-cols-3 gap-2">
              {QUICK_PRODUCTS.map(p => (
                <motion.button
                  key={p.id} whileTap={{ scale: 0.95 }} onClick={() => addToCart(p)}
                  className="p-3 border-none cursor-pointer flex flex-col items-center gap-1.5"
                  style={{
                    background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)',
                    backdropFilter: 'blur(20px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                    border: '1px solid color-mix(in srgb, var(--aw-primary) 20%, transparent)',
                    borderRadius: 14,
                    boxShadow: '0 0 4px rgba(216,148,255,0.2), inset 0 0 4px rgba(237,206,255,0.15)',
                  }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${p.color}22`, color: p.color }}>
                    <i className={`${p.icon} text-[14px]`} />
                  </div>
                  <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className="text-[10px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(p.price)}</span>
                </motion.button>
              ))}
            </div>

            <SectionHeader title="سبد سفارش" icon="fa-solid fa-cart-shopping" count={cart.length} color="#10B981" />
            {cart.length === 0 ? (
              <div className="p-6 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
                <i className="fa-solid fa-cart-shopping text-[24px] mb-2 block" style={{ opacity: 0.4 }} />
                هنوز محصولی اضافه نشده
              </div>
            ) : (
              <div className="rounded-[10px]" style={cardStyle}>
                {cart.map((it, i) => (
                  <div key={it.id} className="flex items-center gap-2 p-3" style={i < cart.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                    <div className="flex-1">
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{it.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{formatPrice(it.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 rounded-md border-none cursor-pointer text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-app)' }} onClick={() => removeFromCart(it.id)}>−</button>
                      <span className="text-[12px] text-[var(--aw-text-primary)] min-w-[20px] text-center" style={{ fontWeight: 700 }}>{it.qty}</span>
                      <button className="w-6 h-6 rounded-md border-none cursor-pointer text-white" style={{ background: '#10B981' }} onClick={() => addToCart(QUICK_PRODUCTS.find(p => p.id === it.id)!)}>+</button>
                    </div>
                    <span className="text-[12px] min-w-[80px] text-left" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(it.price * it.qty)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3" style={{ background: 'var(--aw-bg-app)', borderTop: '1px solid var(--aw-border)', borderRadius: '0 0 14px 14px' }}>
                  <span className="text-[12px] text-[var(--aw-text-muted)]">جمع کل</span>
                  <span className="text-[16px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(cartTotal)}</span>
                </div>
              </div>
            )}

            <button
              className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px]"
              style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
              onClick={submitOrder}
            >
              <i className="fa-solid fa-check ml-1.5" />ثبت سفارش
            </button>
          </div>
        )}

        {/* ===== TAB: PENDING APPROVAL ===== */}
        {activeTab === 'pending' && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="p-3 rounded-[10px] flex items-center gap-2.5" style={{ ...cardStyle, background: 'linear-gradient(135deg, #F59E0B15, #F59E0B05)', border: '1px solid #F59E0B33' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F59E0B22', color: '#F59E0B' }}>
                <i className="fa-solid fa-hourglass-half text-[12px]" />
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{pendingList.length.toLocaleString('fa-IR')} سفارش در انتظار تایید</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">سفارشات قبل از پردازش نیاز به تایید دارند</div>
              </div>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)] mt-2" style={cardStyle}>
                <i className="fa-solid fa-circle-check text-[28px] mb-2 block" style={{ opacity: 0.4, color: '#10B981' }} />
                همه سفارشات بررسی شده‌اند
              </div>
            ) : (
              pendingList.map(o => (
                <motion.div key={o.id} className="p-3 rounded-[10px]" style={cardStyle} whileTap={{ scale: 0.99 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</span>
                      <StatusBadge label="در انتظار تایید" color="#F59E0B" />
                    </div>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">{o.time}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[12px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-user text-[10px] ml-1" />{o.customer}</div>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-location-dot text-[10px] ml-1" />{o.table} · {o.items} آیتم</div>
                      <div className="text-[10px] mt-1 px-2 py-0.5 rounded inline-block" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)' }}><i className="fa-solid fa-tag ml-1" />{o.source}</div>
                      {o.note && <div className="text-[10px] mt-1 mr-1 px-2 py-0.5 rounded inline-block" style={{ background: '#F59E0B22', color: '#F59E0B' }}><i className="fa-solid fa-note-sticky ml-1" />{o.note}</div>}
                    </div>
                    <span className="text-[14px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                  </div>
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--aw-border)' }}>
                    <button className="flex-1 py-2 rounded-lg border-none text-white cursor-pointer text-[11px]" style={{ background: '#10B981', fontWeight: 600 }} onClick={() => approveOrder(o.id)}>
                      <i className="fa-solid fa-check ml-1" />تایید
                    </button>
                    <button className="flex-1 py-2 rounded-lg cursor-pointer text-[11px]" style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF444433', fontWeight: 600 }} onClick={() => rejectOrder(o.id)}>
                      <i className="fa-solid fa-xmark ml-1" />رد
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ===== TAB: ACTIVE / COMPLETED / RETURNED ===== */}
        {(activeTab === 'active' || activeTab === 'completed' || activeTab === 'returned') && (
          <div className="flex flex-col gap-2 mt-1">
            {(activeTab === 'active' ? activeOrders : activeTab === 'completed' ? completedOrders : returnedOrders).map(o => {
              const st = statusConfig[o.status];
              return (
                <motion.div key={o.id} className="p-3 rounded-[10px] cursor-pointer" style={cardStyle} whileTap={{ scale: 0.99 }} onClick={() => openModal(o.id, <OrderDetail order={o} />)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</span>
                      <StatusBadge label={st.label} color={st.color} />
                    </div>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">{o.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-user text-[10px] ml-1" />{o.customer}</div>
                      <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-location-dot text-[10px] ml-1" />{o.table} · {o.items} آیتم</div>
                      {(o as any).note && <div className="text-[10px] mt-1 px-2 py-0.5 rounded inline-block" style={{ background: '#F59E0B22', color: '#F59E0B' }}><i className="fa-solid fa-note-sticky ml-1" />{(o as any).note}</div>}
                      {(o as any).reason && <div className="text-[10px] mt-1 px-2 py-0.5 rounded inline-block" style={{ background: '#EF444422', color: '#EF4444' }}><i className="fa-solid fa-circle-info ml-1" />{(o as any).reason}</div>}
                    </div>
                    <span className="text-[14px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                  </div>
                  {o.status === 'active' && (
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--aw-border)' }}>
                      <button className="flex-1 py-2 rounded-lg border-none text-white cursor-pointer text-[11px]" style={{ background: '#10B981', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); showToast('سفارش به عنوان تکمیل‌شده ثبت شد', 'success'); }}>
                        <i className="fa-solid fa-check ml-1" />تکمیل
                      </button>
                      <button className="flex-1 py-2 rounded-lg cursor-pointer text-[11px]" style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF444433', fontWeight: 600 }} onClick={(e) => { e.stopPropagation(); showToast('سفارش لغو شد', 'info'); }}>
                        <i className="fa-solid fa-xmark ml-1" />لغو
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {((activeTab === 'active' && activeOrders.length === 0) ||
              (activeTab === 'completed' && completedOrders.length === 0) ||
              (activeTab === 'returned' && returnedOrders.length === 0)) && (
              <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)] mt-2" style={cardStyle}>
                <i className="fa-solid fa-inbox text-[28px] mb-2 block" style={{ opacity: 0.4 }} />
                موردی برای نمایش وجود ندارد
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: PAYMENT STATUS ===== */}
        {activeTab === 'payment' && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="grid grid-cols-3 gap-2">
              {(['paid', 'pending', 'refunded'] as const).map(k => {
                const list = ORDERS_DATA.filter(o => o.payment === k);
                const sum = list.reduce((s, o) => s + o.total, 0);
                const cfg = payConfig[k];
                return (
                  <div key={k} className="p-3 rounded-[10px]" style={cardStyle}>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">{cfg.label}</div>
                    <div className="text-[13px]" style={{ color: cfg.color, fontWeight: 700 }}>{formatPrice(sum)}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{list.length.toLocaleString('fa-IR')} سفارش</div>
                  </div>
                );
              })}
            </div>

            <SectionHeader title="جزئیات پرداخت سفارشات" icon="fa-solid fa-credit-card" color="#10B981" />
            <div className="flex flex-col gap-2">
              {ORDERS_DATA.map(o => {
                const p = payConfig[o.payment];
                return (
                  <div key={o.id} className="p-3 rounded-[10px] flex items-center justify-between" style={cardStyle}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${p.color}22`, color: p.color }}>
                        <i className={`fa-solid ${o.payment === 'paid' ? 'fa-check' : o.payment === 'pending' ? 'fa-hourglass-half' : 'fa-rotate-left'} text-[12px]`} />
                      </div>
                      <div>
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{o.customer} · {o.time}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[13px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                      <StatusBadge label={p.label} color={p.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB: ORDERS REPORT ===== */}
        {activeTab === 'report' && (() => {
          const all = ORDERS_DATA;
          const revenue = all.filter(o => o.payment !== 'refunded').reduce((s, o) => s + o.total, 0);
          const avg = all.length ? Math.round(all.reduce((s, o) => s + o.total, 0) / all.length) : 0;
          const returnRate = all.length ? Math.round((returnedOrders.length / all.length) * 100) : 0;
          const stats = [
            { l: 'کل سفارشات', v: all.length.toLocaleString('fa-IR'), c: 'var(--aw-primary)', i: 'fa-solid fa-receipt' },
            { l: 'درآمد کل', v: formatPrice(revenue), c: '#10B981', i: 'fa-solid fa-sack-dollar' },
            { l: 'میانگین سفارش', v: formatPrice(avg), c: 'var(--aw-primary)', i: 'fa-solid fa-chart-line' },
            { l: 'نرخ مرجوعی', v: returnRate.toLocaleString('fa-IR') + '٪', c: '#EF4444', i: 'fa-solid fa-rotate-left' },
          ];
          const breakdown = [
            { l: 'فعال', n: activeOrders.length, c: '#F59E0B' },
            { l: 'تکمیل‌شده', n: completedOrders.length, c: '#10B981' },
            { l: 'مرجوعی', n: returnedOrders.length, c: '#EF4444' },
          ];
          const maxN = Math.max(1, ...breakdown.map(b => b.n));
          const topProducts = [
            { name: 'پیتزا مخصوص', qty: 48, sum: 13680000 },
            { name: 'برگر کلاسیک', qty: 35, sum: 6825000 },
            { name: 'قهوه لاته', qty: 62, sum: 5270000 },
            { name: 'چیزکیک', qty: 21, sum: 2835000 },
          ];
          const week = [
            { d: 'شنبه', n: 12 }, { d: 'یک', n: 18 }, { d: 'دو', n: 9 }, { d: 'سه', n: 22 },
            { d: 'چهار', n: 15 }, { d: 'پنج', n: 28 }, { d: 'جمعه', n: 31 },
          ];
          const maxW = Math.max(...week.map(w => w.n));
          return (
            <div className="flex flex-col gap-3 mt-1">
              <div className="grid grid-cols-2 gap-2">
                {stats.map((s, i) => (
                  <div key={i} className="p-3 rounded-[10px]" style={cardStyle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.c}18` }}><i className={`${s.i} text-[13px]`} style={{ color: s.c }} /></div>
                    <div className="text-[14px]" style={{ fontWeight: 800 }}>{s.v}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <SectionHeader title="تفکیک وضعیت سفارشات" icon="fa-solid fa-layer-group" color="var(--aw-primary)" />
              <div className="p-3 rounded-[10px] flex flex-col gap-2.5" style={cardStyle}>
                {breakdown.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--aw-text-secondary)] w-16">{b.l}</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-app)' }}>
                      <div style={{ width: `${(b.n / maxN) * 100}%`, height: '100%', background: b.c, borderRadius: 9999 }} />
                    </div>
                    <span className="text-[11px] w-6 text-left" style={{ color: b.c, fontWeight: 700 }}>{b.n.toLocaleString('fa-IR')}</span>
                  </div>
                ))}
              </div>

              <SectionHeader title="فروش هفتگی" icon="fa-solid fa-calendar-week" color="var(--aw-primary)" />
              <div className="p-3 rounded-[10px]" style={cardStyle}>
                <div className="flex items-end justify-between gap-1.5" style={{ height: 90 }}>
                  {week.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full rounded-t-md" style={{ height: `${(w.n / maxW) * 100}%`, background: 'linear-gradient(180deg, var(--aw-primary-light), var(--aw-primary-dark))', minHeight: 4 }} />
                      <span className="text-[9px] text-[var(--aw-text-muted)]">{w.d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <SectionHeader title="پرفروش‌ترین محصولات" icon="fa-solid fa-fire" color="#F59E0B" />
              <div className="rounded-[10px]" style={cardStyle}>
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3" style={i < topProducts.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: 'var(--aw-primary-bg, rgba(16,185,129,0.12))', color: '#10B981', fontWeight: 800 }}>{(i + 1).toLocaleString('fa-IR')}</div>
                    <div className="flex-1">
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{p.qty.toLocaleString('fa-IR')} فروش</div>
                    </div>
                    <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(p.sum)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ========================
// 3) SALES INVOICES SCREEN
// ========================
export function SalesInvoicesScreen() {
  const { showToast, setAdminScreen } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<typeof INVOICES_DATA[0] | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [extraInvoices, setExtraInvoices] = useState<typeof INVOICES_DATA>([]);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cDiscount, setCDiscount] = useState('');
  const [cMethod, setCMethod] = useState('نقد');
  const [cStatus, setCStatus] = useState('paid');
  const resetCreate = () => { setCName(''); setCPhone(''); setCAmount(''); setCDiscount(''); setCMethod('نقد'); setCStatus('paid'); };
  const faDigits = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parseNum = (s: string) => parseInt(faDigits(s).replace(/[^\d]/g, '') || '0', 10);
  const grp = (n: number) => n.toLocaleString('en-US').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  const submitInvoice = () => {
    if (!cName.trim()) { showToast('نام مشتری را وارد کنید'); return; }
    const amount = parseNum(cAmount);
    if (amount <= 0) { showToast('مبلغ فاکتور را وارد کنید'); return; }
    const discount = parseNum(cDiscount);
    const tax = Math.round((amount - discount) * 0.09);
    const now = new Date();
    const id = 'INV-' + (1500 + extraInvoices.length + Math.floor(Math.random() * 90));
    const today = '۱۴۰۴/۱۲/' + grp(now.getDate());
    setExtraInvoices(prev => [{ id, customer: cName.trim(), phone: cPhone.trim() || '—', amount, discount, tax, status: cStatus, date: today, items: 1, method: cMethod } as any, ...prev]);
    showToast('فاکتور ' + id + ' با موفقیت ثبت شد ✅', 'success');
    resetCreate();
    setShowCreate(false);
    setActiveTab('all');
  };

  const tabs = [
    { id: 'all', label: 'همه', icon: 'fa-solid fa-list' },
    { id: 'paid', label: 'پرداخت‌شده', icon: 'fa-solid fa-check-circle' },
    { id: 'pending', label: 'در انتظار', icon: 'fa-solid fa-clock' },
    { id: 'returned', label: 'مرجوعی', icon: 'fa-solid fa-rotate-left' },
    { id: 'cancelled', label: 'لغو‌شده', icon: 'fa-solid fa-ban' },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    paid: { label: 'پرداخت‌شده', color: '#10B981', icon: 'fa-check-circle' },
    pending: { label: 'در انتظار', color: '#F59E0B', icon: 'fa-clock' },
    returned: { label: 'مرجوعی', color: 'var(--aw-primary)', icon: 'fa-rotate-left' },
    cancelled: { label: 'لغو‌شده', color: '#EF4444', icon: 'fa-ban' },
  };

  const ALL_INVOICES = [...extraInvoices, ...INVOICES_DATA];
  const filtered = ALL_INVOICES.filter(inv => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (methodFilter !== 'all' && inv.method !== methodFilter) return false;
    if (searchQuery && !inv.id.includes(searchQuery) && !inv.customer.includes(searchQuery) && !inv.phone.includes(searchQuery)) return false;
    return true;
  });

  const totalPaid = ALL_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = ALL_INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalReturned = ALL_INVOICES.filter(i => i.status === 'returned').reduce((s, i) => s + i.amount, 0);

  const paidInvoices = ALL_INVOICES.filter(i => i.status === 'paid');
  const avgPurchase = paidInvoices.length > 0 ? Math.round(paidInvoices.reduce((s, i) => s + i.amount, 0) / paidInvoices.length) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-center px-4 py-3">
        <div className="flex flex-1 items-center gap-1.5 p-1 rounded-full" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'transparent', borderColor: 'color-mix(in srgb, var(--aw-border) 22%, transparent)', color: 'var(--aw-text-secondary)', fontWeight: 600 }} onClick={() => setAdminScreen('salesOrdersScreen')}>
            <i className="fa-solid fa-bag-shopping text-[12px]" /> سفارشات
          </button>
          <button className="flex-1 h-9 rounded-full border cursor-pointer flex items-center justify-center gap-1.5 text-[12px] transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'color-mix(in srgb, var(--aw-primary) 22%, transparent)', color: 'var(--aw-primary)', fontWeight: 700 }}>
            <i className="fa-solid fa-file-invoice text-[12px]" /> فاکتورها
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <i className="fa-solid fa-magnifying-glass text-[11px] text-[var(--aw-text-muted)]" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              placeholder="جستجو در شماره فاکتور، مشتری یا تلفن..."
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="w-5 h-5 rounded-full border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }}>
                <i className="fa-solid fa-xmark text-[9px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {showFilter && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">فیلتر بر اساس روش پرداخت</div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'نقد', 'کارت', 'کیف پول'].map(m => (
              <button key={m} onClick={() => setMethodFilter(m)} className="text-[10px] px-2.5 py-1 rounded-full border-none cursor-pointer" style={methodFilter === m
                ? { background: '#10B981', color: '#fff', fontWeight: 600 }
                : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}>
                {m === 'all' ? 'همه' : m}
              </button>
            ))}
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2.5 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1 mb-1"><i className="fa-solid fa-check-circle text-[10px]" style={{ color: '#10B981' }} /><span className="text-[9px] text-[var(--aw-text-muted)]">پرداخت‌شده</span></div>
            <div className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(totalPaid)}</div>
          </div>
          <div className="p-2.5 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1 mb-1"><i className="fa-solid fa-clock text-[10px]" style={{ color: '#F59E0B' }} /><span className="text-[9px] text-[var(--aw-text-muted)]">در انتظار</span></div>
            <div className="text-[12px]" style={{ color: '#F59E0B', fontWeight: 700 }}>{formatPrice(totalPending)}</div>
          </div>
          <div className="p-2.5 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1 mb-1"><i className="fa-solid fa-rotate-left text-[10px]" style={{ color: 'var(--aw-primary)' }} /><span className="text-[9px] text-[var(--aw-text-muted)]">مرجوعی</span></div>
            <div className="text-[12px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{formatPrice(totalReturned)}</div>
          </div>
        </div>

        {/* Analytics: avg + discount suggestion */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--aw-primary-bg), transparent)', border: '1px solid var(--aw-primary-bg)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-calculator text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[10px] text-[var(--aw-text-muted)]">میانگین مبلغ خرید</span>
            </div>
            <div className="text-[14px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{formatPrice(avgPurchase)}</div>
            <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">از {paidInvoices.length.toLocaleString('fa-IR')} فاکتور پرداخت‌شده</div>
          </div>
          <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, var(--aw-primary-bg), transparent)', border: '1px solid var(--aw-primary-bg)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-tag text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[10px] text-[var(--aw-text-muted)]">پیشنهاد تخفیف</span>
            </div>
            <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>۱۵٪ بالای ۸۰۰K</div>
            <button className="text-[9px] px-2 py-0.5 rounded-md border-none cursor-pointer text-white mt-1" style={{ background: 'var(--aw-primary)', fontWeight: 600 }} onClick={() => showToast('کد تخفیف فعال شد ✅', 'success')}>اعمال</button>
          </div>
        </div>

        {/* Add invoice card */}
        <button onClick={() => setShowCreate(true)} className="w-full flex items-center gap-3 p-3 mb-3 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
            <i className="fa-solid fa-plus text-[16px] text-white" />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>افزودن فاکتور جدید</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">ثبت دستی فاکتور و تراکنش</div>
          </div>
          <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
        </button>

        {/* Invoice list */}
        <SectionHeader title="لیست فاکتورها" icon="fa-solid fa-file-invoice" count={filtered.length} />
        <div className="flex flex-col gap-2 mt-2">
          {filtered.length === 0 && (
            <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
              <i className="fa-solid fa-inbox text-[24px] mb-2 block" style={{ opacity: 0.4 }} />فاکتوری یافت نشد
            </div>
          )}
          {filtered.map(inv => {
            const st = statusConfig[inv.status];
            return (
              <motion.div
                key={inv.id}
                className="p-3 rounded-[10px] cursor-pointer"
                style={cardStyle}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedInvoice(inv)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{inv.id}</span>
                    <StatusBadge label={st.label} color={st.color} />
                  </div>
                  <span className="text-[11px] text-[var(--aw-text-muted)]">{inv.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-[var(--aw-text-secondary)]"><i className="fa-solid fa-user text-[10px] ml-1" />{inv.customer}</div>
                    <div className="text-[11px] text-[var(--aw-text-muted)] mt-0.5">{inv.items} آیتم · {inv.method}</div>
                  </div>
                  <span className="text-[14px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(inv.amount)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Invoice detail overlay */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: 'var(--aw-bg-app)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
              <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setSelectedInvoice(null)}>
                <i className="fa-solid fa-arrow-right" />
              </button>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>جزئیات فاکتور {selectedInvoice.id}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const st = statusConfig[selectedInvoice.status];
                const items = INVOICE_ITEMS[selectedInvoice.id] || [{ name: 'محصول پیش‌فرض', qty: selectedInvoice.items, price: Math.round((selectedInvoice.amount - selectedInvoice.tax + selectedInvoice.discount) / Math.max(1, selectedInvoice.items)), icon: 'fa-solid fa-box' }];
                const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
                return (
                  <>
                    {/* Status header */}
                    <div className="p-4 rounded-[10px] mb-3 text-center" style={{ ...cardStyle, background: `linear-gradient(135deg, ${st.color}15, transparent)`, border: `1px solid ${st.color}33` }}>
                      <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${st.color}22` }}>
                        <i className={`fa-solid ${st.icon} text-[24px]`} style={{ color: st.color }} />
                      </div>
                      <div className="text-[22px] mb-1" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(selectedInvoice.amount)}</div>
                      <StatusBadge label={st.label} color={st.color} />
                      <div className="text-[10px] text-[var(--aw-text-muted)] mt-2">{selectedInvoice.date}</div>
                    </div>

                    {/* Customer info */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-user text-[12px]" style={{ color: 'var(--aw-primary)' }} />
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>اطلاعات مشتری</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <LetterAvatar name={selectedInvoice.customer} size={40} radius={13} />
                        <div className="flex-1">
                          <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{selectedInvoice.customer}</div>
                          <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 mt-0.5"><i className="fa-solid fa-phone text-[9px]" />{selectedInvoice.phone}</div>
                        </div>
                        <button onClick={() => showToast('پیام به ' + selectedInvoice.name + ' ارسال شد')} className="px-2.5 py-1 rounded-md border-none cursor-pointer text-[10px]" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}>
                          <i className="fa-solid fa-message ml-1 text-[9px]" />پیام
                        </button>
                      </div>
                    </div>

                    {/* Products list */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-bag-shopping text-[12px]" style={{ color: '#10B981' }} />
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>محصولات خریداری‌شده</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full mr-auto" style={{ background: '#10B98122', color: '#10B981', fontWeight: 600 }}>{items.length.toLocaleString('fa-IR')} آیتم</span>
                      </div>
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2.5 py-2" style={i < items.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--aw-bg-app)' }}>
                            <i className={`${it.icon} text-[14px]`} style={{ color: '#10B981' }} />
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{it.name}</div>
                            <div className="text-[10px] text-[var(--aw-text-muted)]">{it.qty.toLocaleString('fa-IR')} × {formatPrice(it.price)}</div>
                          </div>
                          <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(it.qty * it.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals: subtotal / discount / tax / amount */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-receipt text-[12px]" style={{ color: '#F59E0B' }} />
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>محاسبات</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)]">جمع جزء</span><span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span></div>
                      <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-tag text-[9px]" style={{ color: 'var(--aw-primary)' }} />تخفیف</span><span style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>− {formatPrice(selectedInvoice.discount)}</span></div>
                      <div className="flex justify-between py-1.5 text-[11px]"><span className="text-[var(--aw-text-muted)] flex items-center gap-1"><i className="fa-solid fa-percent text-[9px]" style={{ color: '#F59E0B' }} />مالیات (۹٪)</span><span style={{ color: '#F59E0B', fontWeight: 700 }}>+ {formatPrice(selectedInvoice.tax)}</span></div>
                      <div className="flex justify-between py-2 mt-1 text-[13px]" style={{ borderTop: '1px dashed var(--aw-border)' }}>
                        <span className="text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>مبلغ نهایی</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(selectedInvoice.amount)}</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
                      {[
                        { label: 'شماره فاکتور', value: selectedInvoice.id, icon: 'fa-solid fa-hashtag' },
                        { label: 'تاریخ', value: selectedInvoice.date, icon: 'fa-solid fa-calendar' },
                        { label: 'روش پرداخت', value: selectedInvoice.method, icon: 'fa-solid fa-credit-card' },
                      ].map((row, i, arr) => (
                        <div key={i} className="flex items-center justify-between py-2" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                          <span className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1.5"><i className={`${row.icon} text-[10px]`} />{row.label}</span>
                          <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }} onClick={() => showToast('فاکتور دانلود شد', 'success')}>
                        <i className="fa-solid fa-download ml-1" />دانلود
                      </button>
                      <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: '#10B981', border: '1px solid #10B98133', fontWeight: 600 }} onClick={() => showToast('فاکتور برای مشتری ارسال شد', 'success')}>
                        <i className="fa-solid fa-paper-plane ml-1" />ارسال
                      </button>
                      {selectedInvoice.status === 'pending' && (
                        <button className="flex-1 py-2.5 rounded-[10px] border-none text-white cursor-pointer text-[12px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={() => showToast('پرداخت تایید شد ✅', 'success')}>
                          <i className="fa-solid fa-check ml-1" />تایید
                        </button>
                      )}
                      {selectedInvoice.status === 'paid' && (
                        <button className="flex-1 py-2.5 rounded-[10px] border-none cursor-pointer text-[12px]" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }} onClick={() => showToast('درخواست مرجوعی ثبت شد', 'info')}>
                          <i className="fa-solid fa-rotate-left ml-1" />مرجوعی
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-file-circle-plus text-[14px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>ایجاد فاکتور جدید</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">اطلاعات فاکتور را وارد کنید</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowCreate(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-user text-[10px]" style={{ color: '#10B981' }} />نام مشتری</label>
                  <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="انتخاب یا وارد کنید" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-phone text-[10px]" style={{ color: '#10B981' }} />شماره تماس</label>
                  <input type="text" dir="ltr" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="۰۹۱۲xxxxxxx" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-coins text-[10px]" style={{ color: '#10B981' }} />مبلغ کل (تومان)</label>
                    <input type="text" dir="ltr" inputMode="numeric" value={cAmount ? grp(parseNum(cAmount)) : ''} onChange={e => setCAmount(e.target.value)} placeholder="۰" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-tag text-[10px]" style={{ color: '#10B981' }} />تخفیف (تومان)</label>
                    <input type="text" dir="ltr" inputMode="numeric" value={cDiscount ? grp(parseNum(cDiscount)) : ''} onChange={e => setCDiscount(e.target.value)} placeholder="۰" className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-credit-card text-[10px]" style={{ color: '#10B981' }} />روش پرداخت</label>
                  <div className="flex gap-1.5">
                    {['نقد', 'کارت', 'کیف پول'].map(m => {
                      const on = cMethod === m;
                      return (
                        <button key={m} onClick={() => setCMethod(m)} className="flex-1 py-2 rounded-[10px] border-none cursor-pointer text-[11px]" style={{ background: on ? '#10B981' : 'var(--aw-bg-card)', color: on ? '#fff' : 'var(--aw-text-secondary)', border: on ? '1px solid #10B981' : '1px solid var(--aw-border)', fontWeight: on ? 700 : 600 }}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className="fa-solid fa-circle-info text-[10px]" style={{ color: '#10B981' }} />وضعیت</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[{ id: 'paid', label: 'پرداخت‌شده', c: '#10B981' }, { id: 'pending', label: 'در انتظار', c: '#F59E0B' }, { id: 'returned', label: 'مرجوعی', c: 'var(--aw-primary)' }].map(s => {
                      const on = cStatus === s.id;
                      return (
                        <button key={s.id} onClick={() => setCStatus(s.id)} className="flex-1 py-2 rounded-[10px] border-none cursor-pointer text-[11px]" style={{ background: on ? s.c : 'var(--aw-bg-card)', color: on ? '#fff' : 'var(--aw-text-secondary)', border: on ? `1px solid ${s.c}` : '1px solid var(--aw-border)', fontWeight: on ? 700 : 600 }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {parseNum(cAmount) > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-[10px] text-[11px]" style={{ background: '#10B98115' }}>
                    <span className="text-[var(--aw-text-secondary)]">مبلغ نهایی (با مالیات ۹٪)</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{grp(parseNum(cAmount) - parseNum(cDiscount) + Math.round((parseNum(cAmount) - parseNum(cDiscount)) * 0.09))} ت</span>
                  </div>
                )}
                <button className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-2" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={submitInvoice}>
                  <i className="fa-solid fa-check ml-1.5" />ثبت فاکتور
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================
// 3) SALES MENU / PRODUCTS SCREEN
// ========================
export function SalesMenuScreen() {
  const { showToast, openModal, closeModal, company, companies } = useApp();
  const _actType = companies[company]?.type;
  const prodTabLabel = _actType === 'کافه و رستوران' ? 'منو' : _actType === 'خدمات' ? 'لیست خدمات' : 'محصولات';
  const bizFromType = _actType === 'کافه و رستوران' ? 'restaurant' : _actType === 'خدمات' ? 'services' : 'other';
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [bizType, setBizType] = useState(bizFromType);
  const biz = BUSINESS_TYPES.find(b => b.id === bizType) || BUSINESS_TYPES[0];
  const [categories, setCategories] = useState<PresetCat[]>(() => (BUSINESS_TYPES.find(b => b.id === bizFromType) || BUSINESS_TYPES[0]).cats);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('fa-solid fa-box');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [newCatParent, setNewCatParent] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatActive, setNewCatActive] = useState(true);

  // Drive the whole products/menu screen off the company's activity type.
  React.useEffect(() => {
    const b = BUSINESS_TYPES.find(x => x.id === bizFromType) || BUSINESS_TYPES[0];
    setBizType(bizFromType);
    setCategories(b.cats);
    setSelectedCat(null);
    setExpandedCat(null);
  }, [bizFromType]);

  const changeBiz = (id: string) => {
    const b = BUSINESS_TYPES.find(x => x.id === id) || BUSINESS_TYPES[0];
    setBizType(id);
    setCategories(b.cats);
    setSelectedCat(null);
    setExpandedCat(null);
    setActiveTab('categories');
  };

  const catMenu = (cat: PresetCat) => openModal(cat.name, (
    <div className="flex flex-col gap-1">
      {[
        { l: 'ویرایش نام', i: 'fa-solid fa-pen', a: () => showToast('ویرایش نام دسته‌بندی') },
        { l: 'تغییر آیکون', i: 'fa-solid fa-icons', a: () => showToast('تغییر آیکون') },
        { l: 'جابه‌جایی ترتیب', i: 'fa-solid fa-up-down-left-right', a: () => showToast('حالت جابه‌جایی فعال شد') },
        { l: 'افزودن زیردسته', i: 'fa-solid fa-sitemap', a: () => showToast('افزودن زیردسته جدید') },
        { l: 'غیرفعال‌سازی', i: 'fa-solid fa-eye-slash', a: () => showToast('دسته‌بندی غیرفعال شد') },
        { l: 'حذف', i: 'fa-solid fa-trash', a: () => { setCategories(prev => prev.filter(c => c.id !== cat.id)); showToast('دسته‌بندی حذف شد'); }, danger: true },
      ].map((o, i) => (
        <button key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-none cursor-pointer text-[13px] text-right" style={{ background: 'transparent', color: o.danger ? '#EF4444' : 'var(--aw-text-primary)', fontWeight: 600 }} onClick={() => { closeModal(); o.a(); }}>
          <i className={`${o.i} text-[12px] w-4`} style={{ color: o.danger ? '#EF4444' : '#10B981' }} />{o.l}
        </button>
      ))}
    </div>
  ));

  const CAT_ICONS = ['fa-solid fa-utensils', 'fa-solid fa-shirt', 'fa-solid fa-mobile-screen', 'fa-solid fa-laptop', 'fa-solid fa-couch', 'fa-solid fa-spray-can-sparkles', 'fa-solid fa-book', 'fa-solid fa-ring', 'fa-solid fa-pills', 'fa-solid fa-shoe-prints', 'fa-solid fa-gamepad', 'fa-solid fa-dumbbell', 'fa-solid fa-paw', 'fa-solid fa-gift', 'fa-solid fa-mug-hot', 'fa-solid fa-leaf', 'fa-solid fa-wrench', 'fa-solid fa-box', 'fa-solid fa-car', 'fa-solid fa-gem'];
  const CAT_COLORS = ['#10B981', 'var(--aw-primary)', 'var(--aw-primary)', 'var(--aw-primary)', '#F59E0B', 'var(--aw-primary)', '#EF4444', '#22C55E', 'var(--aw-primary)', '#FFD700'];

  const submitNewCategory = () => {
    if (!newCatName.trim()) { showToast('نام دسته‌بندی را وارد کنید', 'error'); return; }
    if (!newCatActive) { showToast(`دسته‌بندی "${newCatName.trim()}" به‌صورت غیرفعال ذخیره شد`, 'info'); setShowAddCat(false); return; }
    const id = `cat-${Date.now()}`;
    setCategories(prev => [...prev, { id, name: newCatName.trim(), icon: newCatIcon, count: 0, color: newCatColor, subs: [] }]);
    showToast(`دسته‌بندی "${newCatName.trim()}" اضافه شد`, 'success');
    setNewCatName(''); setNewCatIcon('fa-solid fa-box'); setNewCatColor('#10B981'); setNewCatParent(''); setNewCatDesc(''); setNewCatActive(true);
    setShowAddCat(false);
  };

  const tabs = [
    { id: 'categories', label: 'دسته‌بندی', icon: 'fa-solid fa-layer-group' },
    { id: 'products', label: prodTabLabel, icon: 'fa-solid fa-box' },
    { id: 'pricing', label: 'قیمت‌گذاری', icon: 'fa-solid fa-tag' },
    { id: 'stock', label: 'موجودی', icon: 'fa-solid fa-warehouse' },
  ];

  const _catFiltered = selectedCat ? PRODUCTS.filter(p => p.category === selectedCat) : PRODUCTS;
  // Preset (non-restaurant) categories have no linked mock products → show all as a demo fallback
  const displayProducts = _catFiltered.length > 0 ? _catFiltered : PRODUCTS;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabBar tabs={tabs} active={activeTab} onChange={(id) => { setActiveTab(id); setSelectedCat(null); }} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'categories' && (
          <>
            <SectionHeader
              title="دسته‌بندی محصولات" icon="fa-solid fa-layer-group" count={categories.length}
              action={{ label: '+ دسته‌بندی جدید', onClick: () => setShowAddCat(true) }}
            />
            <div className="grid grid-cols-2 gap-2 mt-2 md:grid-cols-4">
              {categories.map(cat => {
                const open = expandedCat === cat.id;
                const subs = (cat as PresetCat).subs || [];
                return (
                  <div key={cat.id} className="rounded-[10px] relative" style={{ ...cardStyle, gridColumn: open && subs.length ? '1 / -1' : undefined }}>
                    {/* 3-dot menu */}
                    <button
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg border-none cursor-pointer flex items-center justify-center z-10"
                      style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }}
                      onClick={(e) => { e.stopPropagation(); catMenu(cat); }}
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-[11px]" />
                    </button>
                    <button
                      className="w-full p-4 bg-transparent border-none cursor-pointer flex flex-col items-center gap-2"
                      onClick={() => subs.length ? setExpandedCat(open ? null : cat.id) : (setSelectedCat(cat.id), setActiveTab('products'))}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cat.color}22` }}>
                        <i className={`${cat.icon} text-[18px]`} style={{ color: cat.color }} />
                      </div>
                      <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{cat.name}</span>
                      <span className="text-[11px] text-[var(--aw-text-muted)]">{cat.count} محصول{subs.length ? ` · ${subs.length} زیردسته` : ''}</span>
                      {subs.length > 0 && <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[9px] text-[var(--aw-text-muted)]`} />}
                    </button>
                    {/* Sub-categories accordion */}
                    <AnimatePresence>
                      {open && subs.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-3 pb-3">
                          <div className="flex flex-col gap-1.5 pt-1" style={{ borderTop: '1px solid var(--aw-border)' }}>
                            {subs.map((s, si) => (
                              <button key={si} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border-none cursor-pointer text-[12px] text-right" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-secondary)' }} onClick={() => { setSelectedCat(cat.id); setActiveTab('products'); }}>
                                <i className="fa-solid fa-angle-left text-[9px]" style={{ color: cat.color }} />{s}
                              </button>
                            ))}
                            <button className="mt-1 py-2 rounded-lg border-none cursor-pointer text-[12px] text-white" style={{ background: '#10B981', fontWeight: 600 }} onClick={() => { setSelectedCat(cat.id); setActiveTab('products'); }}>
                              <i className="fa-solid fa-box ml-1" />مشاهده محصولات
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <>
            {selectedCat && (
              <button
                className="flex items-center gap-1 text-[12px] mb-2 px-2 py-1 rounded-lg border-none cursor-pointer"
                style={{ background: 'var(--aw-bg-card)', color: '#10B981' }}
                onClick={() => setSelectedCat(null)}
              >
                <i className="fa-solid fa-arrow-right text-[10px]" /> همه محصولات
              </button>
            )}
            <SectionHeader title={selectedCat ? categories.find(c => c.id === selectedCat)?.name || 'محصولات' : 'همه محصولات'} icon="fa-solid fa-box" count={displayProducts.length} action={{ label: '+ افزودن محصول', onClick: () => setShowAddProduct(true) }} />
            <div className="flex flex-col gap-2 mt-2">
              {displayProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all hover:border-[#10B981]" style={cardStyle} onClick={() => openModal(product.name, <ProductDetail product={product} />)}>
                  <span className="text-[28px]">{product.img}</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(product.price)}</span>
                      {product.discount > 0 && <StatusBadge label={`${product.discount}% تخفیف`} color="#EF4444" />}
                    </div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">موجودی: {product.stock} {product.unit}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-primary)' }} onClick={(e) => { e.stopPropagation(); openModal('ویرایش: ' + product.name, <EditProductContent product={product} />); }}>
                      <i className="fa-solid fa-pen text-[10px]" />
                    </button>
                    <button className="w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: '#EF4444' }} onClick={(e) => { e.stopPropagation(); showToast('محصول حذف شد'); }}>
                      <i className="fa-solid fa-trash text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'pricing' && (
          <>
            <SectionHeader title="قیمت‌گذاری و تخفیف‌ها" icon="fa-solid fa-tag" color="#F59E0B" />
            <div className="flex flex-col gap-2 mt-2">
              {PRODUCTS.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={cardStyle}>
                  <span className="text-[20px]">{product.img}</span>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[13px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(product.price)}</div>
                    {product.discount > 0 && (
                      <div className="text-[11px]" style={{ color: '#EF4444' }}>
                        <i className="fa-solid fa-arrow-down text-[8px] ml-0.5" />{product.discount}%
                        → {formatPrice(Math.round(product.price * (1 - product.discount / 100)))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'stock' && (
          <>
            <SectionHeader title="وضعیت موجودی" icon="fa-solid fa-warehouse" color="var(--aw-primary)" />
            {/* Low stock alert */}
            {PRODUCTS.filter(p => p.stock <= 5).length > 0 && (
              <div className="p-3 rounded-[10px] mb-3 flex items-center gap-2" style={{ background: '#F59E0B15', border: '1px solid #F59E0B33' }}>
                <i className="fa-solid fa-triangle-exclamation text-[14px]" style={{ color: '#F59E0B' }} />
                <span className="text-[12px]" style={{ color: '#F59E0B', fontWeight: 600 }}>
                  {PRODUCTS.filter(p => p.stock <= 5).length} محصول با موجودی کم یا ناموجود
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-2">
              {[...PRODUCTS].sort((a, b) => a.stock - b.stock).map(product => {
                const stockColor = product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#10B981';
                return (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={cardStyle}>
                    <span className="text-[20px]">{product.img}</span>
                    <div className="flex-1">
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{product.name}</div>
                      <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'var(--aw-bg-app)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, product.stock * 2)}%`, background: stockColor }} />
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[14px]" style={{ color: stockColor, fontWeight: 700 }}>{product.stock}</span>
                      <span className="text-[10px] text-[var(--aw-text-muted)] block">{product.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add product modal */}
      <AnimatePresence>
        {showAddProduct && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: 'var(--aw-bg-app)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
              <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAddProduct(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
              <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>افزودن محصول جدید</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {[
                { label: 'نام محصول', placeholder: 'مثلاً: پیتزا ویژه', icon: 'fa-solid fa-tag' },
                { label: 'دسته‌بندی', placeholder: 'انتخاب دسته‌بندی', icon: 'fa-solid fa-layer-group' },
                { label: 'قیمت (تومان)', placeholder: '۰', icon: 'fa-solid fa-coins' },
                { label: 'موجودی', placeholder: '۰', icon: 'fa-solid fa-warehouse' },
                { label: 'واحد', placeholder: 'مثلاً: عدد، کیلو، لیوان', icon: 'fa-solid fa-ruler' },
                { label: 'توضیحات', placeholder: 'توضیح مختصر محصول...', icon: 'fa-solid fa-align-right' },
              ].map((field, i) => (
                <div key={i} className="mb-3">
                  <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1">
                    <i className={`${field.icon} text-[10px]`} style={{ color: '#10B981' }} />
                    {field.label}
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-[10px] border-none text-[13px] text-[var(--aw-text-primary)]"
                    style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}
                    placeholder={field.placeholder}
                    dir="rtl"
                  />
                </div>
              ))}
              <div className="mb-3">
                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1">
                  <i className="fa-solid fa-image text-[10px]" style={{ color: '#10B981' }} />
                  تصویر محصول
                </label>
                <div className="w-full h-24 rounded-[10px] flex flex-col items-center justify-center gap-1 cursor-pointer" style={{ background: 'var(--aw-bg-card)', border: '2px dashed var(--aw-border)' }}>
                  <i className="fa-solid fa-cloud-arrow-up text-[20px] text-[var(--aw-text-muted)]" />
                  <span className="text-[11px] text-[var(--aw-text-muted)]">آپلود تصویر</span>
                </div>
              </div>
            </div>
            <div className="p-4" style={{ borderTop: '1px solid var(--aw-border)' }}>
              <button
                className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[14px] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}
                onClick={() => { showToast('محصول جدید اضافه شد ✅'); setShowAddProduct(false); }}
              >
                <i className="fa-solid fa-plus" />
                ثبت محصول
              </button>
            </div>
          </motion.div>
        )}

        {/* Add Category Modal */}
        {showAddCat && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddCat(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)', maxHeight: '85%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${newCatColor}, ${newCatColor}cc)` }}>
                  <i className={`${newCatIcon} text-[14px]`} />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>افزودن دسته‌بندی جدید</div>
                  <div className="text-[11px] text-[var(--aw-text-muted)]">یک گروه تازه برای محصولات ایجاد کنید</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAddCat(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block">نام دسته‌بندی</label>
                <input
                  type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="مثلاً صبحانه"
                  className="w-full px-3 py-2.5 rounded-[10px] border-none text-[13px] text-[var(--aw-text-primary)] mb-3"
                  style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}
                  dir="rtl"
                />

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-2 block">آیکون</label>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {CAT_ICONS.map(ic => (
                    <button
                      key={ic} onClick={() => setNewCatIcon(ic)}
                      className="aspect-square rounded-[10px] border-none cursor-pointer flex items-center justify-center transition-all"
                      style={{
                        background: newCatIcon === ic ? `${newCatColor}22` : 'var(--aw-bg-card)',
                        border: newCatIcon === ic ? `1px solid ${newCatColor}` : '1px solid var(--aw-border)',
                        color: newCatIcon === ic ? newCatColor : 'var(--aw-text-muted)',
                      }}
                    >
                      <i className={`${ic} text-[16px]`} />
                    </button>
                  ))}
                </div>

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-2 block">رنگ</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CAT_COLORS.map(c => (
                    <button
                      key={c} onClick={() => setNewCatColor(c)}
                      className="w-9 h-9 rounded-full border-none cursor-pointer transition-all"
                      style={{
                        background: c,
                        boxShadow: newCatColor === c ? `0 0 0 3px var(--aw-bg-app), 0 0 0 5px ${c}` : 'none',
                      }}
                    />
                  ))}
                </div>

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block">دسته والد (اختیاری)</label>
                <div className="relative mb-3">
                  <div className="w-full px-3 py-2.5 rounded-[10px] text-[13px] text-[var(--aw-text-primary)] flex items-center justify-between" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                    <span>{newCatParent || 'بدون دسته والد'}</span><i className="fa-solid fa-chevron-down text-[10px] text-[var(--aw-text-muted)]" />
                  </div>
                  <select className="absolute inset-0 opacity-0 cursor-pointer text-base" value={newCatParent} onChange={e => setNewCatParent(e.target.value)}>
                    <option value="">بدون دسته والد</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <label className="text-[12px] text-[var(--aw-text-secondary)] mb-1 block">توضیح کوتاه</label>
                <input
                  type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="توضیح مختصر دسته‌بندی"
                  className="w-full px-3 py-2.5 rounded-[10px] border-none text-[13px] text-[var(--aw-text-primary)] mb-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} dir="rtl"
                />

                <div className="flex items-center justify-between p-3 rounded-[10px] mb-4" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
                  <span className="text-[12px] text-[var(--aw-text-secondary)]">وضعیت دسته‌بندی</span>
                  <button onClick={() => setNewCatActive(a => !a)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border-none cursor-pointer text-[11px] text-white" style={{ background: newCatActive ? '#10B981' : '#94A3B8', fontWeight: 600 }}>
                    <i className={`fa-solid ${newCatActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} />{newCatActive ? 'فعال' : 'غیرفعال'}
                  </button>
                </div>

                <div className="p-3 rounded-[10px] flex flex-col items-center gap-2" style={{ ...cardStyle, background: 'var(--aw-bg-card)' }}>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">پیش‌نمایش</div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${newCatColor}22` }}>
                    <i className={`${newCatIcon} text-[18px]`} style={{ color: newCatColor }} />
                  </div>
                  <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{newCatName.trim() || 'نام دسته‌بندی'}</span>
                </div>
              </div>

              <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--aw-border)' }}>
                <button
                  className="flex-1 py-3 rounded-[10px] border-none text-white cursor-pointer text-[14px] flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${newCatColor}, ${newCatColor}cc)`, fontWeight: 700 }}
                  onClick={submitNewCategory}
                >
                  <i className="fa-solid fa-floppy-disk" />ذخیره
                </button>
                <button
                  className="px-5 py-3 rounded-[10px] cursor-pointer text-[14px] bg-transparent"
                  style={{ border: '1px solid var(--aw-border)', color: 'var(--aw-text-muted)', fontWeight: 700 }}
                  onClick={() => setShowAddCat(false)}
                >
                  لغو
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================
// 4) SALES CUSTOMERS / LOYALTY SCREEN
// ========================
export function SalesCustomersScreen() {
  const [activeTab, setActiveTab] = useState('list');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [activeSegment, setActiveSegment] = useState('all');
  const [showAi, setShowAi] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ from: 'ai' | 'me'; text: string }[]>([
    { from: 'ai', text: 'سلام 👋 من دستیار CRM شما هستم. درباره مشتریان، فروش یا کمپین‌ها بپرسید.' },
  ]);
  const { showToast, openModal } = useApp();

  const tabs = [
    { id: 'list', label: 'مشتریان', icon: 'fa-solid fa-users' },
    { id: 'loyalty', label: 'وفاداری', icon: 'fa-solid fa-star' },
    { id: 'history', label: 'سابقه خرید', icon: 'fa-solid fa-clock-rotate-left' },
    { id: 'offers', label: 'کمپین', icon: 'fa-solid fa-bullhorn' },
  ];

  const filteredCustomers = CUSTOMERS_DATA.filter(c => {
    if (activeSegment !== 'all' && c.segment !== activeSegment) return false;
    if (searchQuery && !c.name.includes(searchQuery) && !c.phone.includes(searchQuery)) return false;
    return true;
  });

  const sendAi = (q?: string) => {
    const text = (q || aiInput).trim();
    if (!text) return;
    const responses: Record<string, string> = {
      'بهترین مشتری‌ها': '🏆 ۳ مشتری برتر شما:\n۱. سارا احمدی — ۱۵٫۲M ت (۴۵ خرید)\n۲. فاطمه نوری — ۱۱٫۸M ت (۳۱ خرید)\n۳. علی محمدی — ۸٫۷M ت (۲۳ خرید)\n\nپیشنهاد: ارسال پاداش VIP اختصاصی.',
      'مشتری‌های در خطر ریزش': '⚠️ ۲ مشتری در خطر ریزش شناسایی شدند:\n• رضا کریمی — ۲۵ روز غیبت\n• کاوه نیکزاد — کاهش ۴۰٪ فرکانس\n\nپیشنهاد: ارسال کد تخفیف بازگشت ۱۵٪.',
      'پیشنهاد کمپین': '✨ بر اساس داده‌های شما:\n• کمپین «دوشنبه پیتزا» برای ۳۲ مشتری وفادار پیتزاخور\n• تخفیف تولد برای ۸ مشتری در ۷ روز آینده\n• پاداش بازگشت برای ۲ مشتری در خطر',
      'تحلیل فروش': '📊 تحلیل ۳۰ روز اخیر:\n• درآمد: ۱۸۵٫۶M ت (+۱۵٪)\n• میانگین سبد: ۲۵۶K ت\n• ۱۲ مشتری جدید جذب شد\n• ساعت اوج: ۱۳ و ۱۹\n\nنکته: روزهای پنج‌شنبه ۲۸٪ بیشتر فروش دارید.',
    };
    const reply = responses[text] || 'در حال تحلیل داده‌ها... 🤖\nبر اساس الگوهای رفتاری مشتریان شما، توصیه می‌کنم روی سگمنت VIP و کمپین‌های شخصی‌سازی‌شده تمرکز کنید.';
    setAiMessages(prev => [...prev, { from: 'me', text }, { from: 'ai', text: reply }]);
    setAiInput('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Inline search */}
      {showSearch && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <i className="fa-solid fa-magnifying-glass text-[11px] text-[var(--aw-text-muted)]" />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              placeholder="جستجو در نام یا شماره..."
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="w-5 h-5 rounded-full border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-muted)' }}>
                <i className="fa-solid fa-xmark text-[9px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter chips overlay */}
      {showFilter && (
        <div className="px-4 pt-3" style={{ background: 'var(--aw-bg-header)' }}>
          <div className="text-[11px] text-[var(--aw-text-muted)] mb-1.5">فیلتر سریع بر اساس فعالیت</div>
          <div className="flex gap-1.5 flex-wrap">
            {['همه فعال', 'این هفته', 'بدون خرید ۳۰ روز', 'تولد این ماه'].map(f => (
              <button key={f} className="text-[10px] px-2.5 py-1 rounded-full border-none cursor-pointer" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }} onClick={() => { showToast(`فیلتر «${f}» اعمال شد`, 'info'); setShowFilter(false); }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'list' && (
          <>
            {/* Segment chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 pt-3 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {CUSTOMER_SEGMENTS.map(seg => {
                const count = seg.id === 'all' ? CUSTOMERS_DATA.length : CUSTOMERS_DATA.filter(c => c.segment === seg.id).length;
                const active = activeSegment === seg.id;
                return (
                  <button
                    key={seg.id} onClick={() => setActiveSegment(seg.id)}
                    className="inline-flex items-center justify-center flex-shrink-0 px-3.5 py-1.5 rounded-full border-none cursor-pointer whitespace-nowrap text-[11px] transition-all"
                    style={active
                      ? { background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }
                      : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-eu-nav-border)', fontWeight: 600, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>

            {/* Customer list */}
            <SectionHeader title="لیست مشتریان" icon="fa-solid fa-address-book" count={filteredCustomers.length} />
            <div className="flex flex-col gap-2 mt-2">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
                  <i className="fa-solid fa-inbox text-[28px] mb-2 block" style={{ opacity: 0.4 }} />
                  مشتری‌ای با این فیلتر یافت نشد
                </div>
              ) : filteredCustomers.map(cust => {
                const act = ACTIVITY_CONFIG[cust.activity];
                const seg = CUSTOMER_SEGMENTS.find(s => s.id === cust.segment)!;
                return (
                  <motion.div
                    key={cust.id}
                    className="p-3.5 rounded-[14px] cursor-pointer"
                    style={{ ...cardStyle, borderRadius: 14 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openModal(cust.name, <SalesCustomerProfile customer={cust} />)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <LetterAvatar name={cust.name} size={48} radius={15} />
                        <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full" style={{ background: act.dot, border: '2.5px solid var(--aw-bg-card)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{cust.name}</span>
                          <StatusBadge label={cust.tier} color={TIER_COLORS[cust.tier] || '#888'} />
                        </div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mt-1 flex items-center gap-1" style={{ direction: 'ltr', justifyContent: 'flex-end' }}>
                          {cust.phone}<i className="fa-solid fa-phone text-[8px]" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${act.color}18`, color: act.color, fontWeight: 700 }}>
                          {act.label}
                        </span>
                        <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--aw-border)' }}>
                      <div className="flex-1 flex items-center gap-1.5">
                        <i className="fa-solid fa-bag-shopping text-[10px]" style={{ color: 'var(--aw-primary)' }} />
                        <span className="text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{cust.purchases.toLocaleString('fa-IR')}</span>
                        <span className="text-[9px] text-[var(--aw-text-muted)]">سفارش</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[13px]" style={{ color: '#10B981', fontWeight: 800 }}>{formatPrice(cust.totalSpent)}</span>
                      </div>
                    </div>

                    {cust.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {cust.tags.map((t, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', fontWeight: 600 }}>
                            # {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'loyalty' && (
          <>
            {/* Loyalty summary */}
            <div className="grid grid-cols-2 gap-2 mt-1 mb-3">
              <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, #FFD70022, #F59E0B11)', border: '1px solid #FFD70044' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <i className="fa-solid fa-coins text-[12px]" style={{ color: '#FFD700' }} />
                  <span className="text-[10px] text-[var(--aw-text-muted)]">امتیاز کل توزیع‌شده</span>
                </div>
                <div className="text-[15px]" style={{ color: '#FFD700', fontWeight: 700 }}>{CUSTOMERS_DATA.reduce((s, c) => s + c.points, 0).toLocaleString('fa-IR')}</div>
              </div>
              <div className="p-3 rounded-[10px]" style={{ ...cardStyle, background: 'linear-gradient(135deg, #10B98122, #04785711)', border: '1px solid #10B98144' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <i className="fa-solid fa-wallet text-[12px]" style={{ color: '#10B981' }} />
                  <span className="text-[10px] text-[var(--aw-text-muted)]">کش‌بک فعال</span>
                </div>
                <div className="text-[13px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(CUSTOMERS_DATA.reduce((s, c) => s + c.cashback, 0))}</div>
              </div>
            </div>

            {/* Rewards catalog */}
            <SectionHeader title="جوایز قابل تبدیل" icon="fa-solid fa-gift" color="var(--aw-primary)" />
            <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
              {[
                { name: 'نوشیدنی رایگان', cost: 100, icon: 'fa-solid fa-mug-hot', color: 'var(--aw-primary)' },
                { name: 'دسر هدیه', cost: 200, icon: 'fa-solid fa-ice-cream', color: 'var(--aw-primary)' },
                { name: 'تخفیف ۲۰٪', cost: 350, icon: 'fa-solid fa-percent', color: '#F59E0B' },
                { name: 'پکیج VIP', cost: 800, icon: 'fa-solid fa-crown', color: '#FFD700' },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-[10px]" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22` }}>
                      <i className={`${r.icon} text-[14px]`} style={{ color: r.color }} />
                    </div>
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-coins text-[9px] ml-1" style={{ color: '#FFD700' }} />{r.cost.toLocaleString('fa-IR')} امتیاز</span>
                    <button className="text-[10px] px-2 py-0.5 rounded-md border-none cursor-pointer text-white" style={{ background: r.color, fontWeight: 600 }} onClick={() => showToast(`«${r.name}» در ویترین جوایز قرار گرفت`, 'success')}>افزودن</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tier overview */}
            <SectionHeader title="سطوح وفاداری" icon="fa-solid fa-crown" color="#FFD700" />
            <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
              {[
                { tier: 'برنزی', min: 0, max: 200, benefits: 'تخفیف ۵٪', members: 42, icon: 'fa-solid fa-medal' },
                { tier: 'نقره‌ای', min: 200, max: 500, benefits: 'تخفیف ۱۰٪', members: 38, icon: 'fa-solid fa-award' },
                { tier: 'طلایی', min: 500, max: 1000, benefits: 'تخفیف ۱۵٪ + ارسال رایگان', members: 35, icon: 'fa-solid fa-trophy' },
                { tier: 'الماسی', min: 1000, max: 9999, benefits: 'تخفیف ۲۰٪ + VIP', members: 13, icon: 'fa-solid fa-gem' },
              ].map((level, i) => (
                <div key={i} className="p-3 rounded-[10px]" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`${level.icon} text-[16px]`} style={{ color: TIER_COLORS[level.tier] }} />
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{level.tier}</span>
                  </div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">{level.min}–{level.max} امتیاز</div>
                  <div className="text-[10px]" style={{ color: '#10B981' }}>{level.benefits}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{level.members} عضو</div>
                </div>
              ))}
            </div>

            {/* Top customers */}
            <SectionHeader title="برترین مشتریان" icon="fa-solid fa-star" color="#F59E0B" />
            <div className="flex flex-col gap-2 mt-2">
              {[...CUSTOMERS_DATA].sort((a, b) => b.points - a.points).slice(0, 3).map((cust, i) => (
                <div key={cust.id} className="flex items-center gap-3 p-3 rounded-[10px]" style={cardStyle}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px]" style={{ background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: '#000', fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{cust.name}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{formatPrice(cust.totalSpent)} خرید کل</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="fa-solid fa-star text-[10px]" style={{ color: '#FFD700' }} />
                    <span className="text-[13px]" style={{ color: '#FFD700', fontWeight: 700 }}>{cust.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <SectionHeader title="سابقه خرید مشتریان" icon="fa-solid fa-clock-rotate-left" color="var(--aw-primary)" />
            <div className="flex flex-col gap-2 mt-2">
              {CUSTOMERS_DATA.map(cust => (
                <div key={cust.id} className="p-3 rounded-[10px]" style={cardStyle}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <LetterAvatar name={cust.name} size={32} radius={11} />
                      <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{cust.name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--aw-text-muted)]">آخرین: {cust.lastVisit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--aw-text-muted)]">{cust.purchases} سفارش</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(cust.totalSpent)}</span>
                  </div>
                  <div className="w-full h-1 rounded-full mt-2" style={{ background: 'var(--aw-bg-app)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, cust.purchases * 2.2)}%`, background: 'linear-gradient(90deg, var(--aw-primary), var(--aw-primary))' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'offers' && (() => {
          const CAMPAIGNS = [
            { id: 'c1', name: 'تخفیف آخر هفته', type: 'تخفیف', channel: 'پیامک + اپ', status: 'active', budget: '۵M', spent: '۳.۲M', conv: '۱۴۸', roi: '+۲۱۰٪', icon: 'fa-solid fa-percent' },
            { id: 'c2', name: 'باشگاه مشتریان وفادار', type: 'وفاداری', channel: 'اپ', status: 'active', budget: '۳M', spent: '۱.۱M', conv: '۹۶', roi: '+۱۸۵٪', icon: 'fa-solid fa-crown' },
            { id: 'c3', name: 'کمپین بازگشت مشتری', type: 'بازگشتی', channel: 'پیامک', status: 'scheduled', budget: '۲M', spent: '۰', conv: '۰', roi: '—', icon: 'fa-solid fa-rotate-left' },
            { id: 'c4', name: 'جشنواره تابستانه', type: 'فصلی', channel: 'اینستاگرام', status: 'completed', budget: '۸M', spent: '۸M', conv: '۳۱۰', roi: '+۲۶۵٪', icon: 'fa-solid fa-sun' },
            { id: 'c5', name: 'معرفی دوست', type: 'ارجاعی', channel: 'اپ', status: 'paused', budget: '۱.۵M', spent: '۰.۶M', conv: '۴۲', roi: '+۹۰٪', icon: 'fa-solid fa-user-group' },
            { id: 'c6', name: 'کد تخفیف تولد', type: 'تخفیف', channel: 'پیامک', status: 'draft', budget: '۱M', spent: '۰', conv: '۰', roi: '—', icon: 'fa-solid fa-cake-candles' },
          ];
          const ST = {
            active: { label: 'فعال', bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
            scheduled: { label: 'زمان‌بندی', bg: 'var(--aw-primary-bg)', text: 'var(--aw-primary)' },
            completed: { label: 'تکمیل', bg: 'rgba(148,163,184,0.18)', text: '#94A3B8' },
            paused: { label: 'متوقف', bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
            draft: { label: 'پیش‌نویس', bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
          };
          const filters = [
            { id: 'all', label: 'همه' }, { id: 'active', label: 'فعال' }, { id: 'scheduled', label: 'زمان‌بندی شده' },
            { id: 'completed', label: 'تکمیل' }, { id: 'paused', label: 'متوقف' }, { id: 'draft', label: 'پیش‌نویس' },
          ];
          const list = CAMPAIGNS.filter(c => campaignFilter === 'all' || c.status === campaignFilter);
          return (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="aw-no-pill p-3 rounded-[8px] border text-center" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
                  <div className="text-[16px]" style={{ color: '#10B981', fontWeight: 800 }}>{CAMPAIGNS.filter(c => c.status === 'active').length.toLocaleString('fa-IR')}</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">فعال</div>
                </div>
                <div className="aw-no-pill p-3 rounded-[8px] border text-center" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
                  <div className="text-[16px] text-[var(--aw-primary)]" style={{ fontWeight: 800 }}>۱۹.۵M</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">بودجه کل</div>
                </div>
                <div className="aw-no-pill p-3 rounded-[8px] border text-center" style={{ background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
                  <div className="text-[16px]" style={{ color: '#10B981', fontWeight: 800 }}>+۲۱۰٪</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">میانگین ROI</div>
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex gap-1.5 overflow-x-auto aw-noscroll mt-3" style={{ flexWrap: 'nowrap' }}>
                {filters.map(f => (
                  <button key={f.id} onClick={() => setCampaignFilter(f.id)}
                    className={`aw-no-pill py-1.5 px-3 rounded-[20px] border text-[11px] cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${campaignFilter === f.id ? 'text-white' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'}`}
                    style={campaignFilter === f.id ? { background: 'var(--aw-primary)', borderColor: 'var(--aw-primary)', fontWeight: 700 } : { fontWeight: 600 }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Create campaign card */}
              <button onClick={() => showToast('ساخت کمپین جدید')} className="w-full flex items-center gap-3 p-3 mt-3 mb-1 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-plus text-[16px] text-white" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>ساخت کمپین جدید</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">کمپین فروش یا تخفیف راه‌اندازی کنید</div>
                </div>
                <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              </button>

              {/* Campaign list */}
              <div className="flex flex-col gap-2 mt-2">
                {list.length === 0 ? (
                  <div className="text-center py-10 text-[12px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-bullhorn text-[24px] block mb-2 opacity-50" />کمپینی در این دسته نیست</div>
                ) : list.map(c => {
                  const st = ST[c.status];
                  return (
                    <div key={c.id} className="p-3.5 rounded-[10px] border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]" style={{ background: 'var(--aw-bg-card)' }} onClick={() => showToast('کمپین: ' + c.name)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: st.bg }}><i className={`${c.icon} text-[14px]`} style={{ color: st.text }} /></div>
                          <div><div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.name}</div><div className="text-[11px] text-[var(--aw-text-muted)]">{c.type} • {c.channel}</div></div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.text, fontWeight: 600 }}>{st.label}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.spent}</div><div className="text-[9px] text-[var(--aw-text-muted)]">بودجه مصرفی</div></div>
                        <div className="text-center"><div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{c.conv}</div><div className="text-[9px] text-[var(--aw-text-muted)]">تبدیل</div></div>
                        <div className="text-center"><div className="text-[12px]" style={{ color: c.roi.startsWith('-') ? '#EF4444' : '#10B981', fontWeight: 600 }}>{c.roi}</div><div className="text-[9px] text-[var(--aw-text-muted)]">ROI</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAi && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAi(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)', maxHeight: '85%', height: '85%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-wand-magic-sparkles text-[16px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>دستیار AI CRM</div>
                  <div className="text-[10px] flex items-center gap-1" style={{ color: '#10B981' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />آنلاین · تحلیل لحظه‌ای</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAi(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Chat area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl text-[12px] whitespace-pre-line" style={m.from === 'me'
                      ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff', borderRadius: '16px 16px 4px 16px' }
                      : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)', border: '1px solid var(--aw-border)', borderRadius: '16px 16px 16px 4px' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick questions */}
              <div className="px-4 pt-2 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none', borderTop: '1px solid var(--aw-border)' }}>
                {['بهترین مشتری‌ها', 'مشتری‌های در خطر ریزش', 'پیشنهاد کمپین', 'تحلیل فروش'].map(q => (
                  <button key={q} onClick={() => sendAi(q)} className="text-[10px] px-2.5 py-1.5 rounded-full border-none cursor-pointer whitespace-nowrap" style={{ background: 'var(--aw-bg-card)', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }}>
                    <i className="fa-solid fa-wand-magic-sparkles ml-1 text-[8px]" />{q}
                  </button>
                ))}
              </div>

              <div className="p-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--aw-border)' }}>
                <input
                  type="text" value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendAi(); }}
                  placeholder="سوال خود را بپرسید..."
                  className="flex-1 px-3 py-2.5 rounded-[10px] bg-transparent text-[12px] text-[var(--aw-text-primary)] outline-none"
                  style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}
                />
                <button onClick={() => sendAi()} className="w-10 h-10 rounded-[10px] border-none cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-paper-plane text-[13px]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              className="w-full rounded-t-3xl flex flex-col"
              style={{ background: 'var(--aw-bg-app)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mt-3" style={{ background: 'var(--aw-border)' }} />
              <div className="flex items-center gap-3 px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--aw-border)' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
                  <i className="fa-solid fa-user-plus text-[14px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>افزودن مشتری جدید</div>
                  <div className="text-[10px] text-[var(--aw-text-muted)]">اطلاعات پایه را وارد کنید</div>
                </div>
                <button className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center" style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-primary)' }} onClick={() => setShowAdd(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                {[
                  { label: 'نام و نام خانوادگی', icon: 'fa-solid fa-user', placeholder: 'مثلاً نگار کاظمی' },
                  { label: 'شماره موبایل', icon: 'fa-solid fa-phone', placeholder: '۰۹۱۲xxxxxxx' },
                  { label: 'ایمیل (اختیاری)', icon: 'fa-solid fa-envelope', placeholder: 'name@example.com' },
                  { label: 'تاریخ تولد (اختیاری)', icon: 'fa-solid fa-cake-candles', placeholder: '۱۳۷۵/۰۵/۱۲' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[11px] text-[var(--aw-text-secondary)] mb-1 block flex items-center gap-1.5"><i className={`${f.icon} text-[10px]`} style={{ color: '#10B981' }} />{f.label}</label>
                    <input type="text" placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-[10px] border-none text-[12px] text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }} />
                  </div>
                ))}
                <button className="w-full py-3 rounded-[10px] border-none text-white cursor-pointer text-[13px] mt-2" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }} onClick={() => { showToast('مشتری جدید با موفقیت ثبت شد', 'success'); setShowAdd(false); }}>
                  <i className="fa-solid fa-check ml-1.5" />ثبت مشتری
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ========================
// CUSTOMER PROFILE (modal content — opened via openModal like the app's other popups)
// ========================
function SalesCustomerProfile({ customer: c }: { customer: typeof CUSTOMERS_DATA[0] }) {
  const [profileTab, setProfileTab] = useState<'orders' | 'chats' | 'interests' | 'behavior' | 'ai'>('orders');
  const { showToast } = useApp();
  const seg = CUSTOMER_SEGMENTS.find(s => s.id === c.segment);
  const segColor = seg?.color || '#10B981';

  return (
    <div className="-m-5">
      {/* Profile header with gradient (full-bleed under modal title) */}
      <div className="p-4 text-center relative" style={{ background: `linear-gradient(135deg, var(--aw-primary-bg), transparent)` }}>
        <div className="w-20 h-20 mx-auto mb-2 relative">
          <LetterAvatar name={c.name} size={80} radius={24} style={{ border: `2px solid ${TIER_COLORS[c.tier] || '#10B981'}` }} />
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ACTIVITY_CONFIG[c.activity].dot, border: '2px solid var(--aw-bg-modal)' }}>
            <i className="fa-solid fa-circle text-[6px] text-white" />
          </span>
        </div>
        <div className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{c.name}</div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <StatusBadge label={c.tier} color={TIER_COLORS[c.tier] || '#888'} />
          <StatusBadge label={seg?.label || ''} color={segColor} />
        </div>
        <div className="text-[11px] text-[var(--aw-text-muted)] mt-1.5"><i className="fa-solid fa-phone text-[10px] ml-1" />{c.phone}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-3 mb-3">
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[14px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{c.purchases.toLocaleString('fa-IR')}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">سفارش</div>
        </div>
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[10px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(c.totalSpent)}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">مجموع</div>
        </div>
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[14px]" style={{ color: '#FFD700', fontWeight: 700 }}>{c.points.toLocaleString('fa-IR')}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">امتیاز</div>
        </div>
        <div className="p-2 rounded-[10px] text-center" style={cardStyle}>
          <div className="text-[10px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{formatPrice(c.cashback)}</div>
          <div className="text-[9px] text-[var(--aw-text-muted)]">کش‌بک</div>
        </div>
      </div>

      {/* Profile tabs */}
      <div className="flex gap-1 px-4 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'orders', label: 'سفارش‌ها', icon: 'fa-solid fa-bag-shopping' },
          { id: 'chats', label: 'گفتگوها', icon: 'fa-solid fa-comments' },
          { id: 'interests', label: 'علایق', icon: 'fa-solid fa-heart' },
          { id: 'behavior', label: 'رفتار خرید', icon: 'fa-solid fa-chart-line' },
          { id: 'ai', label: 'AI Insights', icon: 'fa-solid fa-wand-magic-sparkles' },
        ].map(t => (
          <button
            key={t.id} onClick={() => setProfileTab(t.id as any)}
            className="flex-shrink-0 inline-flex items-center justify-center px-3.5 py-1.5 rounded-full cursor-pointer whitespace-nowrap text-[11px] transition-all"
            style={profileTab === t.id
              ? { background: 'var(--aw-primary-bg)', color: 'var(--aw-primary)', border: '1px solid color-mix(in srgb, var(--aw-primary) 40%, transparent)', fontWeight: 700, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }
              : { background: 'var(--aw-eu-nav-bg)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-eu-nav-border)', fontWeight: 600, backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {profileTab === 'orders' && (
          <div className="flex flex-col gap-2">
            {(CUSTOMER_ORDER_HISTORY[c.id] || [
              { id: 'ORD-XXX', date: c.lastVisit, items: 'سفارش پیش‌فرض', total: c.avgBasket, status: 'تکمیل' },
            ]).map(o => (
              <div key={o.id} className="p-3 rounded-[10px]" style={cardStyle}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.id}</span>
                  <StatusBadge label={o.status} color="#10B981" />
                </div>
                <div className="text-[11px] text-[var(--aw-text-secondary)] mb-1">{o.items}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-calendar text-[9px] ml-1" />{o.date}</span>
                  <span className="text-[12px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {profileTab === 'chats' && (
          <div className="flex flex-col gap-2">
            {(CUSTOMER_CHATS[c.id] || []).map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] px-3 py-2 text-[12px]" style={m.from === 'me'
                  ? { background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff', borderRadius: '14px 14px 4px 14px' }
                  : { background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)', border: '1px solid var(--aw-border)', borderRadius: '14px 14px 14px 4px' }}>
                  {m.text}
                  <div className="text-[9px] mt-1" style={{ opacity: 0.65 }}>{m.time}</div>
                </div>
              </div>
            ))}
            {!(CUSTOMER_CHATS[c.id]?.length) && (
              <div className="p-6 rounded-[10px] text-center text-[12px] text-[var(--aw-text-muted)]" style={cardStyle}>
                <i className="fa-solid fa-comments text-[24px] mb-2 block" style={{ opacity: 0.4 }} />هنوز گفتگویی ثبت نشده
              </div>
            )}
          </div>
        )}

        {profileTab === 'interests' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-[10px]" style={cardStyle}>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-2">دسته‌بندی‌های مورد علاقه</div>
              <div className="flex gap-1.5 flex-wrap">
                {c.interests.map((it, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, var(--aw-primary-bg), var(--aw-primary-bg))', color: 'var(--aw-primary)', border: '1px solid var(--aw-primary-bg)', fontWeight: 600 }}>
                    <i className="fa-solid fa-heart text-[9px] ml-1" />{it}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-[10px]" style={cardStyle}>
              <div className="text-[11px] text-[var(--aw-text-muted)] mb-2">تگ‌ها</div>
              <div className="flex gap-1.5 flex-wrap">
                {c.tags.map((t, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: 'var(--aw-bg-app)', color: 'var(--aw-text-secondary)', border: '1px solid var(--aw-border)' }}># {t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {profileTab === 'behavior' && (
          <div className="flex flex-col gap-2">
            {[
              { label: 'میانگین سبد خرید', value: formatPrice(c.avgBasket), icon: 'fa-solid fa-basket-shopping', color: '#10B981' },
              { label: 'فرکانس خرید', value: c.freq, icon: 'fa-solid fa-repeat', color: 'var(--aw-primary)' },
              { label: 'کانال ترجیحی', value: c.channel, icon: 'fa-solid fa-tower-broadcast', color: 'var(--aw-primary)' },
              { label: 'آخرین بازدید', value: c.lastVisit, icon: 'fa-solid fa-clock', color: '#F59E0B' },
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-[10px] flex items-center gap-3" style={cardStyle}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${r.color}22` }}>
                  <i className={`${r.icon} text-[14px]`} style={{ color: r.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--aw-text-muted)]">{r.label}</div>
                  <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {profileTab === 'ai' && (
          <div className="flex flex-col gap-2">
            {[
              { title: 'احتمال خرید بعدی', value: c.activity === 'risk' ? '۲۸٪' : c.activity === 'inactive' ? '۱۵٪' : '۸۴٪', desc: 'بر اساس الگوی ۹۰ روز اخیر', icon: 'fa-solid fa-bullseye', color: '#10B981' },
              { title: 'ریسک ریزش', value: c.activity === 'risk' ? 'بالا ⚠️' : c.activity === 'inactive' ? 'متوسط' : 'پایین ✓', desc: 'مدل پیش‌بینی Churn', icon: 'fa-solid fa-triangle-exclamation', color: c.activity === 'risk' ? '#EF4444' : c.activity === 'inactive' ? '#F59E0B' : '#10B981' },
              { title: 'ارزش طول عمر (LTV)', value: formatPrice(c.totalSpent * 1.8), icon: 'fa-solid fa-gem', desc: 'پیش‌بینی ۱۲ ماه آینده', color: '#FFD700' },
              { title: 'پیشنهاد بعدی', value: `پیشنهاد ${c.interests[0] || 'محصول ویژه'}`, desc: `با ${c.segment === 'vip' ? '۲۰' : '۱۰'}٪ تخفیف اختصاصی`, icon: 'fa-solid fa-lightbulb', color: 'var(--aw-primary)' },
            ].map((ins, i) => (
              <div key={i} className="p-3 rounded-[10px]" style={{ ...cardStyle, background: `linear-gradient(135deg, ${ins.color}11, transparent)`, border: `1px solid ${ins.color}33` }}>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${ins.color}22` }}>
                    <i className={`${ins.icon} text-[14px]`} style={{ color: ins.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{ins.title}</div>
                    <div className="text-[13px] text-[var(--aw-text-primary)] mt-0.5" style={{ fontWeight: 700 }}>{ins.value}</div>
                    <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">{ins.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// 5) SALES QUICK REPORT SCREEN
// ========================
export function SalesQuickReportScreen() {
  const { setAdminScreen, showToast } = useApp();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const periodLabels = { today: 'امروز', week: 'این هفته', month: 'این ماه', custom: 'بازه دلخواه' };
  const periodIcons = { today: 'fa-solid fa-sun', week: 'fa-solid fa-calendar-week', month: 'fa-solid fa-calendar-days', custom: 'fa-solid fa-calendar-days' };
  const periodData: Record<'today' | 'week' | 'month', { revenue: number; orders: number; avgTicket: number; growth: number }> = {
    today: { revenue: 8450000, orders: 32, avgTicket: 264000, growth: 12 },
    week: { revenue: 48200000, orders: 187, avgTicket: 257700, growth: 8 },
    month: { revenue: 185600000, orders: 724, avgTicket: 256300, growth: 15 },
  };

  // Derive custom-range stats from from/to dates (simple deterministic mock based on day span)
  const customData = (() => {
    if (!fromDate || !toDate) return null;
    const f = new Date(fromDate).getTime();
    const t = new Date(toDate).getTime();
    if (isNaN(f) || isNaN(t) || t < f) return null;
    const days = Math.max(1, Math.round((t - f) / 86400000) + 1);
    const revenue = days * 6200000;
    const orders = days * 24;
    return { revenue, orders, avgTicket: Math.round(revenue / orders), growth: 10 };
  })();

  const data = period === 'custom' ? (customData || { revenue: 0, orders: 0, avgTicket: 0, growth: 0 }) : periodData[period];

  const lowStockItems = PRODUCTS.filter(p => p.stock <= 5);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--aw-bg-header)', borderBottom: '1px solid var(--aw-border)', boxShadow: '0 6px 16px color-mix(in srgb, var(--aw-primary) 9%, transparent)' }}>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
          <i className="fa-solid fa-chart-pie text-[14px]" />
        </div>
        <div className="flex-1">
          <div className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>گزارش سریع</div>
          <div className="text-[11px] text-[var(--aw-text-muted)]">نمای کلی عملکرد فروش</div>
        </div>
        <button className="px-3 py-2 rounded-[10px] border-none cursor-pointer text-[12px] flex items-center gap-1.5" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', color: '#10B981', fontWeight: 600 }} onClick={() => setAdminScreen('salesShiftScreen')}>
          <i className="fa-solid fa-cash-register" />شیفت و صندوق
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 p-1 mx-4 mt-3 mb-2 overflow-x-auto aw-noscroll" style={tabBarStyle}>
        {(['today', 'week', 'month', 'custom'] as const).map(p => (
          <button
            key={p}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-1 border-none cursor-pointer text-[11px] transition-all"
            style={period === p ? activeTabStyle : inactiveTabStyle}
            onClick={() => setPeriod(p)}
          >
            <i className={`${periodIcons[p]} text-[10px]`} />
            <span>{periodLabels[p]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Custom range picker */}
        {/* Alerts center */}
        <SalesAlertsSection />

        {period === 'custom' && (
          <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-2">
              <i className="fa-solid fa-calendar-days text-[12px]" style={{ color: '#10B981' }} />
              <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>انتخاب بازه زمانی</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg" style={{ background: 'var(--aw-bg-app)', border: '1px solid var(--aw-border)' }}>
                <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">از تاریخ</div>
                <input
                  type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'var(--aw-bg-app)', border: '1px solid var(--aw-border)' }}>
                <div className="text-[10px] text-[var(--aw-text-muted)] mb-1">تا تاریخ</div>
                <input
                  type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[12px] text-[var(--aw-text-primary)]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[
                { label: '۷ روز اخیر', days: 7 },
                { label: '۳۰ روز اخیر', days: 30 },
                { label: '۹۰ روز اخیر', days: 90 },
              ].map(s => (
                <button
                  key={s.days}
                  className="text-[10px] px-2.5 py-1 rounded-full border-none cursor-pointer"
                  style={{ background: '#10B98122', color: '#10B981', fontWeight: 600 }}
                  onClick={() => {
                    const to = new Date();
                    const from = new Date(); from.setDate(from.getDate() - s.days + 1);
                    setFromDate(from.toISOString().slice(0, 10));
                    setToDate(to.toISOString().slice(0, 10));
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {!customData && (
              <div className="text-[10px] text-[var(--aw-text-muted)] mt-2 text-center">
                <i className="fa-solid fa-circle-info ml-1" />برای مشاهده گزارش، بازه زمانی معتبر را انتخاب کنید
              </div>
            )}
          </div>
        )}

        {/* Main stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-coins text-[12px]" style={{ color: '#10B981' }} />
              <span className="text-[11px] text-[var(--aw-text-muted)]">درآمد {periodLabels[period]}</span>
            </div>
            <div className="text-[17px]" style={{ color: '#10B981', fontWeight: 700 }}>{formatPrice(data.revenue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <i className="fa-solid fa-arrow-up text-[9px]" style={{ color: '#10B981' }} />
              <span className="text-[10px]" style={{ color: '#10B981' }}>+{data.growth}٪</span>
            </div>
          </div>
          <div className="p-3 rounded-[10px]" style={cardStyle}>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="fa-solid fa-receipt text-[12px]" style={{ color: 'var(--aw-primary)' }} />
              <span className="text-[11px] text-[var(--aw-text-muted)]">تعداد سفارش</span>
            </div>
            <div className="text-[17px]" style={{ color: 'var(--aw-primary)', fontWeight: 700 }}>{data.orders}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">میانگین: {formatPrice(data.avgTicket)}</div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { l: 'مشتری جدید', v: '۸', c: '#10B981', i: 'fa-solid fa-user-plus' },
            { l: 'بازگشتی', v: '۲۴', c: 'var(--aw-primary)', i: 'fa-solid fa-rotate' },
            { l: 'تخفیف', v: '۹۲۰K', c: '#F59E0B', i: 'fa-solid fa-tag' },
            { l: 'مرجوعی', v: '۲', c: '#EF4444', i: 'fa-solid fa-rotate-left' },
          ].map((k, i) => (
            <div key={i} className="p-2.5 rounded-[10px] text-center" style={cardStyle}>
              <i className={`${k.i} text-[13px]`} style={{ color: k.c }} />
              <div className="text-[14px] mt-1" style={{ fontWeight: 800 }}>{k.v}</div>
              <div className="text-[9px] text-[var(--aw-text-muted)]">{k.l}</div>
            </div>
          ))}
        </div>

        {/* Sales chart placeholder */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="روند فروش" icon="fa-solid fa-chart-line" />
          <div className="h-[140px] mt-2 flex items-end gap-1">
            {DAILY_SALES.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <motion.div
                  className="w-full rounded-t-md"
                  style={{ background: 'linear-gradient(180deg, #10B981, #047857)', minHeight: 4 }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.amount / 3200) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                />
                <span className="text-[8px] text-[var(--aw-text-muted)]">{d.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="پرفروش‌ترین محصولات" icon="fa-solid fa-fire" color="var(--aw-primary)" />
          <div className="flex flex-col gap-2 mt-2">
            {TOP_PRODUCTS.map((prod, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: i < 3 ? 'var(--aw-primary)' : 'var(--aw-text-muted)', fontWeight: 700 }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{prod.name}</span>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">{prod.sold} عدد</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--aw-bg-app)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i < 3 ? 'linear-gradient(90deg, var(--aw-primary), #EF4444)' : 'var(--aw-text-muted)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${prod.pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className="text-[11px] min-w-[65px] text-left" style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(prod.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low-selling products */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="محصولات کم‌فروش" icon="fa-solid fa-arrow-trend-down" color="#EF4444" />
          <div className="flex flex-col gap-2 mt-2">
            {[{ name: 'قهوه لاته', sold: 4, img: '☕' }, { name: 'ناچو پنیری', sold: 6, img: '🧀' }, { name: 'سالاد سزار', sold: 7, img: '🥗' }].map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-[18px]">{p.img}</span>
                <span className="flex-1 text-[12px] text-[var(--aw-text-primary)]">{p.name}</span>
                <span className="text-[11px] text-[var(--aw-text-muted)]">{p.sold.toLocaleString('fa-IR')} فروش</span>
                <button className="text-[10px] px-2 py-1 rounded-lg border-none cursor-pointer text-white" style={{ background: '#F59E0B', fontWeight: 600 }} onClick={() => showToast('پیشنهاد تخفیف برای ' + p.name)}>تخفیف</button>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by channel */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="فروش بر اساس کانال" icon="fa-solid fa-diagram-project" color="var(--aw-primary)" />
          <div className="flex flex-col gap-2 mt-2">
            {[{ ch: 'حضوری', pct: 48, c: '#10B981' }, { ch: 'آنلاین', pct: 32, c: 'var(--aw-primary)' }, { ch: 'تلفنی', pct: 12, c: 'var(--aw-primary)' }, { ch: 'بیرون‌بر', pct: 8, c: '#F59E0B' }].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--aw-text-secondary)] w-16">{r.ch}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--aw-bg-app)' }}><div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.c }} /></div>
                <span className="text-[11px]" style={{ color: r.c, fontWeight: 600 }}>{r.pct.toLocaleString('fa-IR')}٪</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales per shift */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="فروش هر شیفت" icon="fa-solid fa-business-time" color="var(--aw-primary)" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[{ s: 'صبح', v: '۲.۱M', o: 28 }, { s: 'ظهر', v: '۴.۸M', o: 52 }, { s: 'شب', v: '۳.۵M', o: 41 }].map((x, i) => (
              <div key={i} className="p-2.5 rounded-lg text-center" style={{ background: 'var(--aw-bg-app)' }}>
                <div className="text-[12px] text-[var(--aw-text-muted)]">{x.s}</div>
                <div className="text-[14px] mt-0.5" style={{ color: 'var(--aw-primary)', fontWeight: 800 }}>{x.v}</div>
                <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">{x.o.toLocaleString('fa-IR')} سفارش</div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak hours table */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="ساعات اوج سفارش" icon="fa-solid fa-clock" color="#F59E0B" />
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--aw-border)' }}>
            <div className="grid grid-cols-4 gap-0 px-3 py-2 text-[10px] text-[var(--aw-text-muted)]" style={{ background: 'var(--aw-bg-app)', fontWeight: 600 }}>
              <span>بازه ساعت</span>
              <span className="text-center">سفارش</span>
              <span className="text-center">سهم</span>
              <span className="text-left">روند</span>
            </div>
            {[
              { range: '۱۲:۰۰ – ۱۴:۰۰', orders: 86, share: 28, trend: 'up', label: 'اوج' },
              { range: '۱۹:۰۰ – ۲۱:۰۰', orders: 74, share: 24, trend: 'up', label: 'اوج' },
              { range: '۲۰:۰۰ – ۲۲:۰۰', orders: 58, share: 19, trend: 'up' },
              { range: '۰۸:۰۰ – ۱۰:۰۰', orders: 42, share: 14, trend: 'flat' },
              { range: '۱۵:۰۰ – ۱۷:۰۰', orders: 28, share: 9, trend: 'down' },
              { range: '۲۲:۰۰ – ۲۴:۰۰', orders: 18, share: 6, trend: 'down' },
            ].map((r, i, arr) => (
              <div key={i} className="grid grid-cols-4 gap-0 px-3 py-2 text-[11px] items-center" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                <span className="text-[var(--aw-text-primary)] flex items-center gap-1.5">
                  {r.label && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />}
                  {r.range}
                </span>
                <span className="text-center text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{r.orders.toLocaleString('fa-IR')}</span>
                <span className="text-center" style={{ color: 'var(--aw-primary)', fontWeight: 600 }}>{r.share.toLocaleString('fa-IR')}٪</span>
                <span className="text-left">
                  <i className={`fa-solid ${r.trend === 'up' ? 'fa-arrow-trend-up' : r.trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'} text-[11px]`} style={{ color: r.trend === 'up' ? '#10B981' : r.trend === 'down' ? '#EF4444' : '#F59E0B' }} />
                </span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[var(--aw-text-muted)] mt-2 flex items-center gap-1">
            <i className="fa-solid fa-circle-info text-[9px]" style={{ color: '#F59E0B' }} />
            بیشترین سفارش بین <span style={{ color: '#F59E0B', fontWeight: 700 }}>۱۲ تا ۱۴</span> ثبت می‌شود — برای پیک ناهار نیرو افزایش دهید.
          </div>
        </div>

        {/* Sales trend analysis */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="تحلیل افزایش/کاهش فروش" icon="fa-solid fa-chart-column" color="var(--aw-primary)" />
          <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #10B98122, transparent)', border: '1px solid #10B98144' }}>
              <div className="text-[10px] text-[var(--aw-text-muted)]">رشد دوره</div>
              <div className="text-[18px]" style={{ color: '#10B981', fontWeight: 700 }}>+{data.growth.toLocaleString('fa-IR')}٪</div>
              <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5"><i className="fa-solid fa-arrow-up text-[8px] ml-1" style={{ color: '#10B981' }} />نسبت به دوره قبل</div>
            </div>
            <div className="p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #EF444422, transparent)', border: '1px solid #EF444444' }}>
              <div className="text-[10px] text-[var(--aw-text-muted)]">دسته کاهشی</div>
              <div className="text-[16px]" style={{ color: '#EF4444', fontWeight: 700 }}>−۸٪</div>
              <div className="text-[9px] text-[var(--aw-text-muted)] mt-0.5">دسته «اسنک» افت داشته</div>
            </div>
          </div>
          {[
            { cat: 'غذاهای اصلی', change: 18, status: 'up', desc: 'بیشترین رشد در پیتزا و پاستا' },
            { cat: 'نوشیدنی‌ها', change: 12, status: 'up', desc: 'تأثیر کمپین تابستانه' },
            { cat: 'دسرها', change: 4, status: 'flat', desc: 'پایدار با نوسان کم' },
            { cat: 'اسنک‌ها', change: -8, status: 'down', desc: 'کاهش بازدید عصرگاهی' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-2" style={i < 3 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
              <i className={`fa-solid ${r.status === 'up' ? 'fa-arrow-trend-up' : r.status === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'} text-[14px]`} style={{ color: r.status === 'up' ? '#10B981' : r.status === 'down' ? '#EF4444' : '#F59E0B' }} />
              <div className="flex-1">
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{r.cat}</div>
                <div className="text-[10px] text-[var(--aw-text-muted)]">{r.desc}</div>
              </div>
              <span className="text-[12px]" style={{ color: r.status === 'up' ? '#10B981' : r.status === 'down' ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                {r.change > 0 ? '+' : ''}{r.change.toLocaleString('fa-IR')}٪
              </span>
            </div>
          ))}
        </div>

        {/* AI Sales boost suggestions */}
        <div className="p-3 rounded-[10px] mb-3" style={{ background: 'linear-gradient(135deg, var(--aw-primary-bg), var(--aw-primary-bg))', border: '1px solid var(--aw-primary-bg)', borderRadius: 10 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
              <i className="fa-solid fa-wand-magic-sparkles text-[12px]" />
            </div>
            <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>پیشنهاد افزایش فروش</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md mr-auto" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', color: '#fff', fontWeight: 600 }}>AI</span>
          </div>
          {[
            { title: 'باندل ناهار اقتصادی', impact: '+۱۸٪', desc: 'پکیج پیتزا + نوشابه + سالاد در ساعت اوج ۱۲–۱۴', icon: 'fa-solid fa-box', color: '#10B981' },
            { title: 'کمپین «دوشنبه دسر»', impact: '+۱۲٪', desc: 'تخفیف ۲۰٪ دسر برای روزهای کم‌فروش هفته', icon: 'fa-solid fa-ice-cream', color: 'var(--aw-primary)' },
            { title: 'بازگشت ۲ مشتری در خطر', impact: '+۸٪', desc: 'ارسال کد تخفیف اختصاصی به سگمنت در خطر ریزش', icon: 'fa-solid fa-user-plus', color: '#F59E0B' },
            { title: 'تبلیغ ساعت طلایی ۱۹–۲۱', impact: '+۱۵٪', desc: 'افزایش بودجه دیجیتال در پیک شام', icon: 'fa-solid fa-bullhorn', color: 'var(--aw-primary)' },
          ].map((s, i) => (
            <div key={i} className="p-2.5 rounded-lg mt-2 flex items-start gap-2.5" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}22` }}>
                <i className={`${s.icon} text-[14px]`} style={{ color: s.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{s.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${s.color}22`, color: s.color, fontWeight: 700 }}>{s.impact}</span>
                </div>
                <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5">{s.desc}</div>
              </div>
              <button onClick={() => showToast('پیشنهاد «' + s.title + '» اعمال شد')} className="text-[10px] px-2.5 py-1 rounded-md border-none cursor-pointer text-white" style={{ background: s.color, fontWeight: 600 }}>اعمال</button>
            </div>
          ))}
        </div>

        {/* Product performance analysis */}
        <div className="p-3 rounded-[10px] mb-3" style={cardStyle}>
          <SectionHeader title="تحلیل عملکرد محصولات" icon="fa-solid fa-chart-pie" color="var(--aw-primary)" />
          <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
            {[
              { label: 'ستاره‌ها', count: 5, icon: 'fa-solid fa-star', color: '#FFD700', desc: 'پرفروش + سودده' },
              { label: 'پر سؤال', count: 3, icon: 'fa-solid fa-circle-question', color: 'var(--aw-primary)', desc: 'پتانسیل رشد' },
              { label: 'سگ‌ها', count: 2, icon: 'fa-solid fa-arrow-down', color: '#EF4444', desc: 'کم‌فروش + کم‌سود' },
            ].map((b, i) => (
              <div key={i} className="p-2 rounded-lg text-center" style={{ background: 'var(--aw-bg-app)', border: `1px solid ${b.color}44` }}>
                <i className={`${b.icon} text-[14px] mb-0.5`} style={{ color: b.color }} />
                <div className="text-[14px]" style={{ color: b.color, fontWeight: 700 }}>{b.count.toLocaleString('fa-IR')}</div>
                <div className="text-[9px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{b.label}</div>
                <div className="text-[8px] text-[var(--aw-text-muted)]">{b.desc}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--aw-border)' }}>
            <div className="grid grid-cols-12 gap-0 px-3 py-2 text-[10px] text-[var(--aw-text-muted)]" style={{ background: 'var(--aw-bg-app)', fontWeight: 600 }}>
              <span className="col-span-4">محصول</span>
              <span className="col-span-2 text-center">فروش</span>
              <span className="col-span-2 text-center">سود</span>
              <span className="col-span-2 text-center">رشد</span>
              <span className="col-span-2 text-center">عملکرد</span>
            </div>
            {[
              { name: 'پیتزا مخصوص', sold: 48, margin: 42, growth: 22, score: 'star' },
              { name: 'برگر کلاسیک', sold: 35, margin: 38, growth: 14, score: 'star' },
              { name: 'قهوه لاته', sold: 62, margin: 55, growth: 8, score: 'star' },
              { name: 'پاستا آلفردو', sold: 22, margin: 30, growth: 18, score: 'question' },
              { name: 'چیزکیک', sold: 28, margin: 48, growth: -3, score: 'question' },
              { name: 'سالاد سزار', sold: 14, margin: 22, growth: -12, score: 'dog' },
              { name: 'نوشیدنی انرژی‌زا', sold: 8, margin: 18, growth: -18, score: 'dog' },
            ].map((p, i, arr) => {
              const sc = p.score === 'star' ? { color: '#FFD700', label: '⭐' } : p.score === 'question' ? { color: 'var(--aw-primary)', label: '❓' } : { color: '#EF4444', label: '⚠️' };
              return (
                <div key={i} className="grid grid-cols-12 gap-0 px-3 py-2 text-[11px] items-center" style={i < arr.length - 1 ? { borderBottom: '1px solid var(--aw-border)' } : {}}>
                  <span className="col-span-4 text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{p.name}</span>
                  <span className="col-span-2 text-center text-[var(--aw-text-secondary)]">{p.sold.toLocaleString('fa-IR')}</span>
                  <span className="col-span-2 text-center" style={{ color: '#10B981', fontWeight: 600 }}>{p.margin}٪</span>
                  <span className="col-span-2 text-center" style={{ color: p.growth >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                    {p.growth > 0 ? '+' : ''}{p.growth.toLocaleString('fa-IR')}٪
                  </span>
                  <span className="col-span-2 text-center text-[13px]">{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'نقدی', value: '۳۵٪', icon: 'fa-solid fa-money-bill-wave', color: '#10B981' },
            { label: 'کارتی', value: '۵۲٪', icon: 'fa-solid fa-credit-card', color: 'var(--aw-primary)' },
            { label: 'کیف پول', value: '۱۳٪', icon: 'fa-solid fa-wallet', color: 'var(--aw-primary)' },
          ].map((item, i) => (
            <div key={i} className="p-2.5 rounded-[10px] text-center" style={cardStyle}>
              <i className={`${item.icon} text-[14px] mb-1`} style={{ color: item.color }} />
              <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.value}</div>
              <div className="text-[9px] text-[var(--aw-text-muted)]">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Low stock alerts */}
        {lowStockItems.length > 0 && (
          <div className="p-3 rounded-[10px]" style={{ background: '#F59E0B12', border: '1px solid #F59E0B33', borderRadius: 10 }}>
            <SectionHeader title="هشدار موجودی کم" icon="fa-solid fa-triangle-exclamation" color="#F59E0B" count={lowStockItems.length} />
            <div className="flex flex-col gap-1.5 mt-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1">
                  <span className="text-[12px] text-[var(--aw-text-secondary)]">{item.img} {item.name}</span>
                  <span className="text-[12px]" style={{ color: item.stock === 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                    {item.stock === 0 ? 'ناموجود' : `${item.stock} ${item.unit}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
