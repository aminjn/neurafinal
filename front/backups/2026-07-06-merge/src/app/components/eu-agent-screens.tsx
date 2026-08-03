import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { useApp } from './app-context';
import { toFa } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';
import svgChatIcons from '../../imports/Frame2147223516/svg-6y73huub0v';

// Import shared utilities for use in this file
import { euCardStyle, AgentHeader, AgentTabBar, StatusPill, SectionTitle, EmptyState, AgentChatTabUI, MiniChatPreview } from './eu-agent-shared';
// Re-export shared utilities so other files can import from this file
export { euCardStyle, AgentHeader, AgentTabBar, StatusPill, SectionTitle, EmptyState, AgentChatTabUI, MiniChatPreview } from './eu-agent-shared';
export type { ChatListItem, AgentCardItem, AgentTopicItem, ChatMsgItem } from './eu-agent-shared';

// Re-export split screen components so end-user-panel.tsx import still works
export { EuDineScreen, DINE_ORDERS } from './eu-dine-screen';
import { DINE_ORDERS } from './eu-dine-screen';
export { EuSupportScreen } from './eu-support-screen';
export { EuMarketScreen } from './eu-market-screen';


// =====================================================================
//  2.  ASSISTANT SCREEN (دستیار شخصی)
// =====================================================================
const ASSISTANT_TABS = [
  { id: 'chat', icon: 'fa-solid fa-comments', label: 'گفتگو' },
];

type PlanStatus = 'pending' | 'inprogress' | 'done' | 'cancelled';

interface CalEvent { id: number; title: string; time: string; date: string; type: 'meeting' | 'reminder' | 'personal' | 'work'; status: PlanStatus; muted: boolean; description?: string }

const planStatusStyles: Record<PlanStatus, { label: string; bg: string; border: string; pillBg: string; pillText: string; icon: string }> = {
  pending:    { label: 'معلق',         bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.10)', pillBg: 'rgba(255,255,255,0.10)', pillText: '#E5E7EB', icon: 'fa-solid fa-hourglass-half' },
  inprogress: { label: 'در حال انجام', bg: 'rgba(245,158,11,0.10)',   border: 'rgba(245,158,11,0.35)', pillBg: 'rgba(245,158,11,0.18)', pillText: '#F59E0B', icon: 'fa-solid fa-spinner' },
  done:       { label: 'انجام شده',    bg: 'rgba(16,185,129,0.10)',   border: 'rgba(16,185,129,0.35)', pillBg: 'rgba(16,185,129,0.18)', pillText: '#10B981', icon: 'fa-solid fa-circle-check' },
  cancelled:  { label: 'لغو شده',      bg: 'rgba(239,68,68,0.10)',    border: 'rgba(239,68,68,0.35)',  pillBg: 'rgba(239,68,68,0.18)',  pillText: '#EF4444', icon: 'fa-solid fa-ban' },
};

const INITIAL_CAL_EVENTS: CalEvent[] = [
  { id: 1, title: 'جلسه تیم فنی', time: '۰۹:۰۰ - ۱۰:۳۰', date: 'امروز', type: 'meeting', status: 'done', muted: false, description: 'مرور پیشرفت اسپرینت جاری و رفع موانع تیم.' },
  { id: 2, title: 'یادآوری: ارسال گزارش ماهانه', time: '۱۱:۰۰', date: 'امروز', type: 'reminder', status: 'pending', muted: false, description: 'تهیه و ارسال گزارش KPI‌های ماهانه به مدیر عامل.' },
  { id: 3, title: 'ناهار با تیم', time: '۱۲:۳۰ - ۱۳:۳۰', date: 'امروز', type: 'personal', status: 'done', muted: false, description: 'صرف ناهار با اعضای تیم در رستوران شاندیز.' },
  { id: 4, title: 'بررسی بودجه فصلی', time: '۱۴:۰۰ - ۱۵:۰۰', date: 'امروز', type: 'work', status: 'inprogress', muted: false, description: 'تحلیل عملکرد بودجه و آماده‌سازی پیش‌بینی فصل بعد.' },
  { id: 5, title: 'جلسه با مشتری آلفا', time: '۱۰:۰۰ - ۱۱:۰۰', date: 'فردا', type: 'meeting', status: 'pending', muted: false, description: 'بررسی پیشنهاد جدید قرارداد سالانه.' },
  { id: 6, title: 'ورزش صبحگاهی', time: '۰۷:۰۰ - ۰۷:۴۵', date: 'فردا', type: 'personal', status: 'pending', muted: true, description: 'دویدن و تمرینات کششی در پارک.' },
  { id: 7, title: 'جلسه هماهنگی پروژه دلتا', time: '۰۹:۳۰ - ۱۱:۰۰', date: 'تا یک ماه آینده', type: 'meeting', status: 'pending', muted: false },
  { id: 8, title: 'وبینار آموزش تیم فروش', time: '۱۴:۰۰ - ۱۵:۳۰', date: 'تا یک ماه آینده', type: 'work', status: 'inprogress', muted: false, description: 'آموزش تکنیک‌های جدید مذاکره و بستن قرارداد.' },
  { id: 9, title: 'یادآوری: تمدید قرارداد سرور', time: '۱۰:۰۰', date: 'تا یک ماه آینده', type: 'reminder', status: 'pending', muted: false },
  { id: 10, title: 'جلسه بررسی عملکرد فصلی', time: '۱۰:۰۰ - ۱۲:۰۰', date: 'تا یک ماه آینده', type: 'meeting', status: 'pending', muted: false },
  { id: 11, title: 'سمینار نوآوری و فناوری', time: '۰۹:۰۰ - ۱۷:۰۰', date: 'تا یک ماه آینده', type: 'work', status: 'cancelled', muted: false, description: 'به دلیل تداخل با جلسه هیئت‌مدیره لغو شد.' },
  { id: 12, title: 'سفر تفریحی تیم', time: 'تمام روز', date: 'تا یک ماه آینده', type: 'personal', status: 'pending', muted: false },
  { id: 13, title: 'یادآوری: ارسال گزارش سالانه', time: '۱۶:۰۰', date: 'تا یک ماه آینده', type: 'reminder', status: 'pending', muted: false },
  // —— تاریخچه برنامه‌های انجام‌شده / لغو شده برای گزارش‌گیری ——
  { id: 14, title: 'جلسه استارت‌آپ ویکند',           time: '۱۰:۰۰ - ۱۲:۰۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false, description: 'حضور در رویداد استارت‌آپ ویکند به‌عنوان منتور.' },
  { id: 15, title: 'بازنگری کیفیت کد تیم بک‌اند',     time: '۱۴:۰۰ - ۱۶:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 16, title: 'تماس با شرکت بیمه',              time: '۱۱:۰۰',         date: 'تا یک ماه آینده', type: 'reminder', status: 'done',      muted: false },
  { id: 17, title: 'جلسه ریتسپکتیو اسپرینت',          time: '۱۵:۰۰ - ۱۶:۰۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false },
  { id: 18, title: 'تماس مشاوره پزشکی',              time: '۰۹:۰۰',         date: 'تا یک ماه آینده', type: 'personal', status: 'done',      muted: false },
  { id: 19, title: 'دوره آموزشی TypeScript',          time: '۱۸:۰۰ - ۲۰:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 20, title: 'جلسه با تیم طراحی محصول',         time: '۱۰:۳۰ - ۱۱:۳۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false },
  { id: 21, title: 'تولد همکار',                     time: '۱۹:۰۰',         date: 'تا یک ماه آینده', type: 'personal', status: 'done',      muted: false },
  { id: 22, title: 'یادآوری: تمدید بیمه خودرو',       time: '۱۲:۰۰',         date: 'تا یک ماه آینده', type: 'reminder', status: 'done',      muted: false },
  { id: 23, title: 'جلسه هیئت‌مدیره فصلی',            time: '۰۹:۰۰ - ۱۲:۰۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false },
  { id: 24, title: 'کارگاه آموزش UI/UX',             time: '۱۰:۰۰ - ۱۷:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 25, title: 'جلسه بررسی KPI تیم پشتیبانی',     time: '۱۳:۰۰ - ۱۴:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 26, title: 'دیدار خانوادگی',                 time: '۱۸:۰۰ - ۲۲:۰۰', date: 'تا یک ماه آینده', type: 'personal', status: 'done',      muted: false },
  { id: 27, title: 'یادآوری: پرداخت قبض اینترنت',     time: '۱۵:۰۰',         date: 'تا یک ماه آینده', type: 'reminder', status: 'done',      muted: false },
  { id: 28, title: 'جلسه برنامه‌ریزی پروژه گاما',     time: '۱۰:۰۰ - ۱۱:۳۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false },
  { id: 29, title: 'مصاحبه استخدامی بک‌اند',          time: '۱۴:۰۰ - ۱۵:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 30, title: 'سفر کاری به اصفهان',             time: 'تمام روز',       date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 31, title: 'جلسه دموی محصول با سرمایه‌گذار', time: '۱۱:۰۰ - ۱۲:۳۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'cancelled', muted: false },
  { id: 32, title: 'مرور سالیانه تیم',                time: '۰۹:۰۰ - ۱۲:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'done',      muted: false },
  { id: 33, title: 'جلسه طراحی معماری میکروسرویس',    time: '۱۴:۰۰ - ۱۶:۳۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false },
  { id: 34, title: 'دیدار با پزشک خانواده',           time: '۱۶:۰۰',         date: 'تا یک ماه آینده', type: 'personal', status: 'done',      muted: false },
  { id: 35, title: 'یادآوری: آبیاری گیاهان',         time: '۰۸:۰۰',         date: 'تا یک ماه آینده', type: 'reminder', status: 'done',      muted: true  },
  { id: 36, title: 'جلسه فروش شعبه شمال',             time: '۱۰:۰۰ - ۱۱:۰۰', date: 'تا یک ماه آینده', type: 'meeting',  status: 'done',      muted: false },
  { id: 37, title: 'کارگاه مهارت‌های ارتباطی',        time: '۱۳:۰۰ - ۱۷:۰۰', date: 'تا یک ماه آینده', type: 'work',     status: 'cancelled', muted: false },
];

const calTypeColors: Record<string, { color: string; icon: string; label: string }> = {
  meeting: { color: '#3B82F6', icon: 'fa-solid fa-users', label: 'جلسه' },
  reminder: { color: '#F59E0B', icon: 'fa-solid fa-bell', label: 'یادآور' },
  personal: { color: '#10B981', icon: 'fa-solid fa-heart', label: 'شخصی' },
  work: { color: '#8B5CF6', icon: 'fa-solid fa-briefcase', label: 'کاری' },
};

interface AsstTask { id: number; title: string; priority: 'high' | 'medium' | 'low'; done: boolean; dueDate: string; eventId?: number }

const INITIAL_TASKS: AsstTask[] = [
  // برنامه ۱: جلسه تیم فنی (انجام شده)
  { id: 101, title: 'آماده‌سازی دستور جلسه', priority: 'medium', done: true, dueDate: 'دیروز', eventId: 1 },
  { id: 102, title: 'مرور تیکت‌های باز اسپرینت', priority: 'high', done: true, dueDate: 'امروز', eventId: 1 },
  { id: 103, title: 'ثبت صورت‌جلسه و ارسال به تیم', priority: 'low', done: true, dueDate: 'امروز', eventId: 1 },

  // برنامه ۲: یادآوری ارسال گزارش ماهانه (معلق)
  { id: 201, title: 'استخراج آمار فروش ماه', priority: 'high', done: false, dueDate: 'امروز', eventId: 2 },
  { id: 202, title: 'تهیه نمودارهای KPI', priority: 'medium', done: false, dueDate: 'امروز', eventId: 2 },
  { id: 203, title: 'ارسال نسخه نهایی به مدیر عامل', priority: 'high', done: false, dueDate: 'امروز', eventId: 2 },

  // برنامه ۴: بررسی بودجه فصلی (در حال انجام)
  { id: 401, title: 'جمع‌آوری گزارش‌های مالی واحدها', priority: 'high', done: false, dueDate: 'امروز', eventId: 4 },
  { id: 402, title: 'تهیه پیش‌بینی هزینه‌های فصل بعد', priority: 'medium', done: false, dueDate: 'امروز', eventId: 4 },
  { id: 403, title: 'تماس با تأمین‌کننده جدید', priority: 'high', done: true, dueDate: 'دیروز', eventId: 4 },
  { id: 404, title: 'بازبینی قراردادهای جاری', priority: 'low', done: false, dueDate: 'فردا', eventId: 4 },

  // برنامه ۵: جلسه با مشتری آلفا (معلق)
  { id: 501, title: 'مرور پروپوزال قبلی', priority: 'medium', done: false, dueDate: 'فردا', eventId: 5 },
  { id: 502, title: 'تهیه اسلاید معرفی محصول', priority: 'high', done: false, dueDate: 'فردا', eventId: 5 },
  { id: 503, title: 'هماهنگی لینک گوگل‌میت', priority: 'low', done: false, dueDate: 'فردا', eventId: 5 },

  // برنامه ۷: جلسه هماهنگی پروژه دلتا (معلق)
  { id: 701, title: 'بررسی پیشرفت تیم بک‌اند', priority: 'high', done: false, dueDate: 'هفته بعد', eventId: 7 },
  { id: 702, title: 'تهیه گزارش وضعیت پروژه', priority: 'medium', done: false, dueDate: 'هفته بعد', eventId: 7 },

  // برنامه ۸: وبینار آموزش تیم فروش (در حال انجام)
  { id: 801, title: 'تهیه اسلاید معرفی تکنیک‌ها', priority: 'high', done: false, dueDate: 'فردا', eventId: 8 },
  { id: 802, title: 'هماهنگی با اساتید مهمان', priority: 'medium', done: true, dueDate: 'هفته پیش', eventId: 8 },
  { id: 803, title: 'تست پلتفرم پخش زنده', priority: 'medium', done: false, dueDate: 'فردا', eventId: 8 },
  { id: 804, title: 'ارسال لینک ثبت‌نام به فروشندگان', priority: 'low', done: false, dueDate: 'امروز', eventId: 8 },

  // برنامه ۱۰: جلسه بررسی عملکرد فصلی (معلق)
  { id: 1001, title: 'جمع‌آوری بازخورد سرپرستان', priority: 'medium', done: false, dueDate: 'هفته بعد', eventId: 10 },
  { id: 1002, title: 'تحلیل شاخص‌های عملکرد', priority: 'high', done: false, dueDate: 'هفته بعد', eventId: 10 },

  // وظایف بدون برنامه
  { id: 9001, title: 'بررسی ایمیل‌های مشتریان', priority: 'low', done: false, dueDate: 'فردا' },
  { id: 9002, title: 'پاسخ به نظرات شبکه‌های اجتماعی', priority: 'low', done: false, dueDate: 'امروز' },

  // —— تاریخچه وظایف انجام‌شده برای گزارش‌گیری ——
  { id: 9100, title: 'بازبینی پروپوزال پروژه آلفا',         priority: 'high',   done: true, dueDate: 'دیروز' },
  { id: 9101, title: 'به‌روزرسانی مستندات API',             priority: 'medium', done: true, dueDate: 'دیروز' },
  { id: 9102, title: 'پاسخ به تیکت‌های پشتیبانی',           priority: 'medium', done: true, dueDate: 'دیروز' },
  { id: 9103, title: 'بررسی کامیت‌های پول‌ریکوئست',          priority: 'high',   done: true, dueDate: '۲ روز پیش' },
  { id: 9104, title: 'تنظیم ساعت ورزش هفتگی',                priority: 'low',    done: true, dueDate: '۲ روز پیش' },
  { id: 9105, title: 'مذاکره با تأمین‌کننده اصلی',           priority: 'high',   done: true, dueDate: '۳ روز پیش' },
  { id: 9106, title: 'ساخت گزارش هفتگی فروش',                priority: 'medium', done: true, dueDate: '۳ روز پیش' },
  { id: 9107, title: 'پیگیری انبارگردانی شعبه ۲',            priority: 'medium', done: true, dueDate: '۴ روز پیش' },
  { id: 9108, title: 'پاسخ به نظرسنجی مشتریان',              priority: 'low',    done: true, dueDate: '۴ روز پیش' },
  { id: 9109, title: 'بررسی صورت‌حساب‌های ماهانه',           priority: 'high',   done: true, dueDate: '۵ روز پیش' },
  { id: 9110, title: 'تماس با وکیل برای قرارداد جدید',       priority: 'high',   done: true, dueDate: '۵ روز پیش' },
  { id: 9111, title: 'بک‌آپ‌گیری از سرور اصلی',              priority: 'medium', done: true, dueDate: '۶ روز پیش' },
  { id: 9112, title: 'پیاده‌سازی فیچر فیلتر سفارش',          priority: 'high',   done: true, dueDate: '۶ روز پیش' },
  { id: 9113, title: 'بازبینی طراحی صفحه فرود',              priority: 'medium', done: true, dueDate: '۷ روز پیش' },
  { id: 9114, title: 'برگزاری جلسه استندآپ تیم',             priority: 'low',    done: true, dueDate: '۷ روز پیش' },
  { id: 9115, title: 'تنظیم بودجه تبلیغات اینستاگرام',       priority: 'medium', done: true, dueDate: '۹ روز پیش' },
  { id: 9116, title: 'تست رگرسیون انتشار جدید',              priority: 'high',   done: true, dueDate: '۹ روز پیش' },
  { id: 9117, title: 'بررسی اپلیکیشن پس از انتشار',          priority: 'high',   done: true, dueDate: '۱۰ روز پیش' },
  { id: 9118, title: 'به‌روزرسانی روال آنبوردینگ پرسنل',     priority: 'medium', done: true, dueDate: '۱۲ روز پیش' },
  { id: 9119, title: 'تهیه گزارش تحلیل رقبا',                priority: 'high',   done: true, dueDate: '۱۲ روز پیش' },
  { id: 9120, title: 'تنظیم قرار جلسه با مشاور مالی',        priority: 'low',    done: true, dueDate: '۱۴ روز پیش' },
  { id: 9121, title: 'بهینه‌سازی کوئری‌های دیتابیس',         priority: 'high',   done: true, dueDate: '۱۴ روز پیش' },
  { id: 9122, title: 'بازبینی متن قرارداد همکاری',           priority: 'medium', done: true, dueDate: '۱۶ روز پیش' },
  { id: 9123, title: 'برگزاری دمو داخلی محصول',              priority: 'medium', done: true, dueDate: '۱۸ روز پیش' },
  { id: 9124, title: 'مهاجرت دیتابیس به نسخه جدید',          priority: 'high',   done: true, dueDate: '۲۰ روز پیش' },
  { id: 9125, title: 'مرور بازخوردهای فصلی پرسنل',           priority: 'medium', done: true, dueDate: '۲۲ روز پیش' },
  { id: 9126, title: 'تماس پیگیری با ۱۰ مشتری برتر',         priority: 'high',   done: true, dueDate: '۲۵ روز پیش' },
  { id: 9127, title: 'تهیه ویدیوی معرفی محصول',              priority: 'medium', done: true, dueDate: '۲۸ روز پیش' },
  { id: 9128, title: 'تنظیم نشست توسعه استراتژی',            priority: 'high',   done: true, dueDate: '۳۰ روز پیش' },
  { id: 9129, title: 'بازنگری ساختار سازمانی',                priority: 'medium', done: true, dueDate: '۴۰ روز پیش' },
  { id: 9130, title: 'تهیه پکیج آموزشی سازمانی',             priority: 'low',    done: true, dueDate: '۴۵ روز پیش' },
  { id: 9131, title: 'مرور قراردادهای فروش فصلی',            priority: 'high',   done: true, dueDate: '۵۰ روز پیش' },
  { id: 9132, title: 'تحلیل KPI کانال‌های فروش',             priority: 'medium', done: true, dueDate: '۶۰ روز پیش' },
  { id: 9133, title: 'بازنگری استراتژی بازاریابی محتوا',     priority: 'high',   done: true, dueDate: '۷۵ روز پیش' },
  { id: 9134, title: 'یادآوری تمدید گواهی SSL',              priority: 'medium', done: true, dueDate: '۹۰ روز پیش' },
  { id: 9135, title: 'مرور بستهٔ مزایای کارکنان',             priority: 'low',    done: true, dueDate: '۱۲۰ روز پیش' },
  { id: 9136, title: 'پیاده‌سازی سیستم اعلان داخلی',          priority: 'medium', done: true, dueDate: '۱۵۰ روز پیش' },
  { id: 9137, title: 'بازبینی فرآیند مالی شعب',              priority: 'high',   done: true, dueDate: '۱۸۰ روز پیش' },
  { id: 9138, title: 'تهیه گزارش سالانه به سهام‌داران',       priority: 'high',   done: true, dueDate: '۲۲۰ روز پیش' },
  { id: 9139, title: 'بازنگری ارزیابی عملکرد سالیانه',        priority: 'medium', done: true, dueDate: '۲۸۰ روز پیش' },
  { id: 9140, title: 'تدوین چشم‌انداز سال جدید',              priority: 'high',   done: true, dueDate: '۳۳۰ روز پیش' },
];

const priColors: Record<string, { color: string; label: string }> = {
  high: { color: '#EF4444', label: 'فوری' },
  medium: { color: '#F59E0B', label: 'متوسط' },
  low: { color: '#10B981', label: 'عادی' },
};

interface Note { id: number; title: string; preview: string; date: string; tag: string; color: string }

const NOTES: Note[] = [
  { id: 1, title: 'ایده‌های پروژه جدید', preview: 'فاز ۱: تحلیل نیازها / فاز ۲: طراحی / فاز ۳: پیاده‌سازی...', date: 'امروز', tag: 'کاری', color: '#3B82F6' },
  { id: 2, title: 'لیست خرید هفتگی', preview: 'شیر، نان، میوه، سبزیجات، گوشت...', date: 'دیروز', tag: 'شخصی', color: '#10B981' },
  { id: 3, title: 'یادداشت جلسه فنی', preview: 'نکات مهم: ۱) بروزرسانی API ۲) رفع باگ فرم...', date: '۲ روز پیش', tag: 'جلسه', color: '#8B5CF6' },
];

const ASST_CHAT_MSGS = [
  { from: 'agent' as const, text: 'سلام! من دستیار شخصی هوشمند شما هستم. چطور می‌تونم کمکتون کنم؟' },
  { from: 'user' as const, text: 'برنامه امروزم چیه؟' },
  { from: 'agent' as const, text: 'امروز ۴ رویداد دارید: جلسه تیم فنی (۹ صبح)، گزارش ماهانه (۱۱)، ناهار (۱۲:۳۰) و بررسی بودجه (۱۴). همچنین ۳ وظیفه فعال دارید.' },
  { from: 'user' as const, text: 'جلسه فردا با مشتری ساعت چنده؟' },
  { from: 'agent' as const, text: 'جلسه با مشتری آلفا فردا ساعت ۱۰ تا ۱۱ صبح. آیا می‌خواین یادآوری تنظیم کنم؟' },
];

function AssistantCalendarTab({ events, setEvents, tasks, setTasks }: { events: CalEvent[]; setEvents: React.Dispatch<React.SetStateAction<CalEvent[]>>; tasks: AsstTask[]; setTasks: React.Dispatch<React.SetStateAction<AsstTask[]>> }) {
  const { showToast } = useApp();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState<string>('امروز');
  const [newType, setNewType] = useState<CalEvent['type']>('reminder');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCalendarHint, setShowCalendarHint] = useState(false);
  useEffect(() => {
    if (!showCalendar) return;
    setShowCalendarHint(true);
    const t = setTimeout(() => setShowCalendarHint(false), 1000);
    return () => clearTimeout(t);
  }, [showCalendar]);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedCalDate, setSelectedCalDate] = useState<Date | null>(null);
  const [newTaskDrafts, setNewTaskDrafts] = useState<{ title: string; priority: 'high' | 'medium' | 'low' }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState<'hour' | 'day' | 'week' | 'month'>('week');
  const [repeatMaxCount, setRepeatMaxCount] = useState(5);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [hasEnd, setHasEnd] = useState(false);
  const [endH, setEndH] = useState(10);
  const [endM, setEndM] = useState(0);
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const composeTime = () => {
    const s = `${toFa(pad2(startH))}:${toFa(pad2(startM))}`;
    return hasEnd ? `${s} - ${toFa(pad2(endH))}:${toFa(pad2(endM))}` : s;
  };
  const timeField = (val: number, setVal: (n: number) => void, mod: number, step: number) => (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => setVal((val + step) % mod)}
        className="w-9 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)] flex items-center justify-center"
        style={{ background: 'var(--aw-bg-card)' }}><i className="fa-solid fa-chevron-up text-[9px]" /></button>
      <div className="w-11 text-center text-[19px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{toFa(pad2(val))}</div>
      <button type="button" onClick={() => setVal((val - step + mod) % mod)}
        className="w-9 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)] flex items-center justify-center"
        style={{ background: 'var(--aw-bg-card)' }}><i className="fa-solid fa-chevron-down text-[9px]" /></button>
    </div>
  );

  const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const PERSIAN_MONTHS = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];

  const getCalendarDays = (monthStart: Date) => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay();
    startDow = (startDow + 1) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const dateToCategoryLabel = (date: Date): string => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(date); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'امروز';
    if (diff === 1) return 'فردا';
    return 'تا یک ماه آینده';
  };

  const formatSelectedDate = (date: Date): string => {
    return `${toFa(date.getDate())} ${PERSIAN_MONTHS[date.getMonth()]} ${toFa(date.getFullYear())}`;
  };

  const todayEvents = events.filter(e => e.date === 'امروز');
  const tomorrowEvents = events.filter(e => e.date === 'فردا');
  const upToMonthEvents = events.filter(e => e.date === 'تا یک ماه آینده');

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<number | null>(null);
  const [taskDragId, setTaskDragId] = useState<number | null>(null);

  const toggleTaskDone = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    showToast('وضعیت وظیفه تغییر کرد');
  };

  const reorderTask = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    setTasks(prev => {
      const source = prev.find(t => t.id === sourceId);
      const target = prev.find(t => t.id === targetId);
      if (!source || !target || source.eventId !== target.eventId) return prev;
      const others = prev.filter(t => t.id !== sourceId);
      const targetIdx = others.findIndex(t => t.id === targetId);
      return [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
    });
  };

  const setStatus = (id: number, status: PlanStatus) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    showToast(`وضعیت برنامه: ${planStatusStyles[status].label}`);
  };

  const reorderEvent = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    setEvents(prev => {
      const source = prev.find(e => e.id === sourceId);
      const target = prev.find(e => e.id === targetId);
      if (!source || !target || source.date !== target.date) return prev;
      const others = prev.filter(e => e.id !== sourceId);
      const targetIdx = others.findIndex(e => e.id === targetId);
      const next = [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
      return next;
    });
  };

  const toggleMute = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, muted: !e.muted } : e));
    const ev = events.find(e => e.id === id);
    showToast(ev?.muted ? 'اعلان فعال شد' : 'اعلان سایلنت شد');
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('رویداد حذف شد');
  };

  const startEdit = (ev: CalEvent) => {
    setEditingId(ev.id);
    setNewTitle(ev.title);
    setNewTime(ev.time);
    setNewDate(ev.date);
    setNewType(ev.type);
    setShowCalendar(false); setSelectedCalDate(null);
    setAutoRepeat(false); setRepeatInterval(1); setRepeatUnit('week'); setRepeatMaxCount(5);
    setNewTaskDrafts([]); setNewTaskInput(''); setNewTaskPriority('medium');
    setShowNewForm(true);
  };

  const submitNewEvent = () => {
    if (!newTitle.trim()) { showToast('لطفاً عنوان رویداد را وارد کنید'); return; }
    if (!newTime.trim()) { showToast('لطفاً ساعت رویداد را وارد کنید'); return; }
    if (editingId !== null) {
      setEvents(prev => prev.map(e => e.id === editingId ? { ...e, title: newTitle.trim(), time: newTime.trim(), date: newDate, type: newType } : e));
      setEditingId(null);
      setNewTitle(''); setNewTime(''); setNewDate('امروز'); setNewType('reminder'); setShowCalendar(false); setSelectedCalDate(null); setAutoRepeat(false); setRepeatInterval(1); setRepeatUnit('week'); setRepeatMaxCount(5); setShowTimePicker(false);
      setNewTaskDrafts([]); setNewTaskInput(''); setNewTaskPriority('medium');
      setShowNewForm(false);
      showToast('برنامه ویرایش شد');
      return;
    }
    const newId = Math.max(...events.map(e => e.id), 0) + 1;
    const ev: CalEvent = { id: newId, title: newTitle.trim(), time: newTime.trim(), date: newDate, type: newType, status: 'pending', muted: false };
    setEvents(prev => [...prev, ev]);
    if (newTaskDrafts.length > 0) {
      const baseId = Math.max(...tasks.map(t => t.id), 0) + 1;
      const newTasks: AsstTask[] = newTaskDrafts.map((d, idx) => ({
        id: baseId + idx, title: d.title, priority: d.priority, done: false, dueDate: newDate, eventId: newId,
      }));
      setTasks(prev => [...prev, ...newTasks]);
    }
    setNewTitle(''); setNewTime(''); setNewDate('امروز'); setNewType('reminder'); setShowCalendar(false); setSelectedCalDate(null); setAutoRepeat(false); setRepeatInterval(1); setRepeatUnit('week'); setRepeatMaxCount(5); setShowTimePicker(false);
    setNewTaskDrafts([]); setNewTaskInput(''); setNewTaskPriority('medium');
    setShowNewForm(false);
    showToast('رویداد جدید اضافه شد');
  };

  const dateOptions = [
    { value: 'امروز', label: 'امروز' },
    { value: 'فردا', label: 'فردا' },
  ];

  const typeOptions: { value: CalEvent['type']; label: string; icon: string; color: string }[] = [
    { value: 'reminder', label: 'یادآور', icon: 'fa-solid fa-bell', color: '#F59E0B' },
    { value: 'personal', label: 'شخصی', icon: 'fa-solid fa-heart', color: '#10B981' },
    { value: 'work', label: 'کاری', icon: 'fa-solid fa-briefcase', color: '#8B5CF6' },
  ];

  const renderStatusActions = (ev: CalEvent) => {
    const btn = (label: string, icon: string, color: string, target: PlanStatus) => (
      <button
        key={target}
        className="flex-1 py-2 px-2.5 rounded-lg border-none text-white text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
        style={{ background: color, fontWeight: 600 }}
        onClick={e => { e.stopPropagation(); setStatus(ev.id, target); }}
      >
        <i className={`${icon} text-[10px]`} /> {label}
      </button>
    );
    if (ev.status === 'pending') return <>{btn('شروع', 'fa-solid fa-play', '#F59E0B', 'inprogress')}{btn('لغو', 'fa-solid fa-ban', '#EF4444', 'cancelled')}</>;
    if (ev.status === 'inprogress') return <>{btn('انجام شد', 'fa-solid fa-check', '#10B981', 'done')}{btn('لغو', 'fa-solid fa-ban', '#EF4444', 'cancelled')}</>;
    if (ev.status === 'done') return <>{btn('بازگردانی به معلق', 'fa-solid fa-rotate-left', '#6366f1', 'pending')}</>;
    return <>{btn('بازگردانی به معلق', 'fa-solid fa-rotate-left', '#6366f1', 'pending')}</>;
  };

  const renderGroup = (title: string, icon: string, iconColor: string, items: CalEvent[], delayOffset: number) => {
    const collapsed = collapsedGroups[title];
    return (
      <div className="mb-3 rounded-2xl border border-[var(--aw-border)] overflow-hidden" style={{ background: 'var(--aw-bg-card)' }}>
        <button type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-none bg-transparent text-right"
          onClick={() => setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }))}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}1F`, color: iconColor }}>
            <i className={`${icon} text-[12px]`} />
          </span>
          <span className="text-[14px] flex-1" style={{ fontWeight: 700, color: 'var(--aw-text-primary)' }}>{title}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--aw-bg-input)', color: '#8F8F8F', fontWeight: 600 }}>{toFa(items.length)} مورد</span>
          <i className={`fa-solid fa-chevron-${collapsed ? 'down' : 'up'} text-[11px] text-[var(--aw-text-muted)] flex-shrink-0`} />
        </button>
        {!collapsed && (
            <div className="overflow-hidden">
              <div className="px-2.5 pb-2.5 pt-0.5">
                {items.length === 0 && (
                  <div className="text-[11px] text-[var(--aw-text-muted)] px-3 py-3 text-center">رویدادی ثبت نشده است.</div>
                )}
      {items.map((ev, i) => {
        const ct = calTypeColors[ev.type];
        const ss = planStatusStyles[ev.status];
        const isExpanded = expandedId === ev.id;
        return (
          <motion.div key={ev.id}
            className={`group mb-2 cursor-pointer rounded-2xl border transition-all ${dragId === ev.id ? 'opacity-50' : ''}`}
            style={{ background: ss.bg, borderColor: ss.border }}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + delayOffset }}
            onClick={() => setExpandedId(isExpanded ? null : ev.id)}
            draggable
            onDragStart={() => setDragId(ev.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); if (dragId !== null) { reorderEvent(dragId, ev.id); setDragId(null); } }}
          >
            <div className="flex items-center gap-2 p-3">
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] ${ev.status === 'done' ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 700 }}>{ev.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] flex items-center gap-1" style={{ color: ss.pillText, fontWeight: 600 }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ss.pillText }} />
                    {ss.label}
                  </span>
                  <span className="text-[10px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[8px] ml-1" />{ev.time}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: `${ct.color}1F`, color: ct.color, fontWeight: 700 }}>{ct.label}</span>
                </div>
              </div>
              <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[11px] text-[var(--aw-text-muted)] flex-shrink-0`} />
              <button
                className="w-7 h-7 rounded-lg border-none bg-transparent text-[12px] cursor-pointer flex items-center justify-center flex-shrink-0 text-[var(--aw-text-muted)] hover:text-[#6366f1] hover:bg-[rgba(99,102,241,0.1)]"
                onClick={e => { e.stopPropagation(); startEdit(ev); }}
                title="ویرایش"
              >
                <i className="fa-solid fa-pen" />
              </button>
              <button
                className="w-7 h-7 rounded-lg border-none bg-transparent text-[12px] cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-red-500/10"
                style={{ color: '#EF4444' }}
                onClick={e => { e.stopPropagation(); deleteEvent(ev.id); }}
                title="حذف"
              >
                <i className="fa-solid fa-trash" />
              </button>
              <button
                className={`w-7 h-7 rounded-lg border-none bg-transparent text-[12px] cursor-pointer flex items-center justify-center flex-shrink-0 ${ev.muted ? 'text-amber-400 hover:bg-amber-500/10' : 'text-[var(--aw-text-muted)] hover:text-amber-400 hover:bg-amber-500/10'}`}
                onClick={e => { e.stopPropagation(); toggleMute(ev.id); }}
                title={ev.muted ? 'فعال‌سازی اعلان' : 'سایلنت'}
              >
                <i className={ev.muted ? 'fa-solid fa-bell-slash' : 'fa-regular fa-bell'} />
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-0 border-t" style={{ borderColor: ss.border }} onClick={e => e.stopPropagation()}>
                    <div className="text-[11px] text-[var(--aw-text-secondary)] leading-6 mt-2.5 mb-3">
                      {ev.description || 'توضیحاتی برای این برنامه ثبت نشده است.'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--aw-text-muted)] mb-3">
                      <div className="flex items-center gap-1.5"><i className="fa-regular fa-calendar text-[9px]" />{ev.date}</div>
                      <div className="flex items-center gap-1.5"><i className="fa-regular fa-clock text-[9px]" />{ev.time}</div>
                    </div>

                    {/* Tasks for this plan */}
                    {(() => {
                      const planTasks = tasks.filter(t => t.eventId === ev.id);
                      return (
                        <div className="mb-3">
                          <div className="text-[10.5px] text-[var(--aw-text-muted)] mb-1.5 px-0.5 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                            <i className="fa-solid fa-list-check text-[10px]" />
                            وظایف برنامه ({toFa(planTasks.length)})
                          </div>
                          {planTasks.length === 0 ? (
                            <div className="text-[10.5px] text-[var(--aw-text-muted)] px-3 py-2 rounded-[10px] border border-dashed border-[var(--aw-border)]">
                              وظیفه‌ای برای این برنامه ثبت نشده است.
                            </div>
                          ) : planTasks.map(task => {
                            const pr = priColors[task.priority];
                            return (
                              <div key={task.id}
                                className={`flex items-center gap-2 px-2.5 py-2 mb-1.5 rounded-[10px] border border-[var(--aw-border)] cursor-pointer ${taskDragId === task.id ? 'opacity-50' : ''}`}
                                style={{ background: 'var(--aw-bg-input)' }}
                                onClick={() => toggleTaskDone(task.id)}
                                draggable
                                onDragStart={e => { e.stopPropagation(); setTaskDragId(task.id); }}
                                onDragEnd={() => setTaskDragId(null)}
                                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={e => { e.preventDefault(); e.stopPropagation(); if (taskDragId !== null) { reorderTask(taskDragId, task.id); setTaskDragId(null); } }}
                              >
                                <div className="w-4 h-6 flex items-center justify-center text-[var(--aw-text-muted)] cursor-grab active:cursor-grabbing flex-shrink-0"
                                  onClick={e => e.stopPropagation()} title="جابه‌جایی">
                                  <i className="fa-solid fa-grip-vertical text-[10px]" />
                                </div>
                                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                                  style={{ borderColor: task.done ? '#10B981' : 'var(--aw-border)', background: task.done ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
                                  {task.done && <i className="fa-solid fa-check text-[8px] text-[#10B981]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[11.5px] truncate ${task.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 600 }}>{task.title}</div>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${pr.color}18`, color: pr.color, fontWeight: 700 }}>{pr.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">{renderStatusActions(ev)}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
              </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <AnimatePresence>
        {showCalendarHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12px] shadow-lg"
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: '#6366f1', color: '#fff', fontWeight: 600, zIndex: 9999,
              boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
            }}
          >
            <i className="fa-solid fa-circle-info text-[12px]" />
            شما می‌توانید چند تاریخ انتخاب کنید
          </motion.div>
        )}
      </AnimatePresence>
      {/* New event button / form */}
      <AnimatePresence mode="wait">
        {showNewForm ? (
          <motion.div key="new-form" className="p-3.5 mb-4 rounded-2xl border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-card)' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <i className={`fa-solid ${editingId !== null ? 'fa-pen' : 'fa-plus'} text-[13px]`} style={{ color: '#6366f1' }} />
              </div>
              <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{editingId !== null ? 'ویرایش برنامه' : 'ایجاد برنامه جدید'}</span>
            </div>

            <input
              className="w-full rounded-[10px] border border-[var(--aw-border)] px-3 py-2.5 text-[12px] text-[var(--aw-text-primary)] outline-none mb-2.5 placeholder:text-[var(--aw-text-muted)]"
              style={{ background: 'var(--aw-bg-input)' }}
              placeholder="عنوان رویداد..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowTimePicker(v => !v)}
              className="w-full rounded-[10px] border border-[var(--aw-border)] px-3 py-2.5 text-[12px] outline-none mb-2.5 flex items-center justify-between cursor-pointer"
              style={{ background: 'var(--aw-bg-input)', color: newTime ? 'var(--aw-text-primary)' : 'var(--aw-text-muted)' }}
            >
              <span className="flex items-center gap-2"><i className="fa-regular fa-clock text-[11px] text-[#6366f1]" />{newTime || 'انتخاب ساعت'}</span>
              <i className={`fa-solid fa-chevron-${showTimePicker ? 'up' : 'down'} text-[9px] text-[var(--aw-text-muted)]`} />
            </button>

            <AnimatePresence>
              {showTimePicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-2.5 rounded-[10px] border border-[var(--aw-border)] overflow-hidden"
                  style={{ background: 'var(--aw-bg-input)' }}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-center gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className="text-[9.5px] text-[var(--aw-text-muted)] mb-1.5" style={{ fontWeight: 600 }}>ساعت شروع</div>
                        <div className="flex items-center gap-1.5">
                          {timeField(startH, setStartH, 24, 1)}
                          <span className="text-[18px] text-[var(--aw-text-muted)]" style={{ fontWeight: 700 }}>:</span>
                          {timeField(startM, setStartM, 60, 5)}
                        </div>
                      </div>
                      {hasEnd && (
                        <>
                          <span className="text-[12px] text-[var(--aw-text-muted)] self-center pt-3">تا</span>
                          <div className="flex flex-col items-center">
                            <div className="text-[9.5px] text-[var(--aw-text-muted)] mb-1.5" style={{ fontWeight: 600 }}>ساعت پایان</div>
                            <div className="flex items-center gap-1.5">
                              {timeField(endH, setEndH, 24, 1)}
                              <span className="text-[18px] text-[var(--aw-text-muted)]" style={{ fontWeight: 700 }}>:</span>
                              {timeField(endM, setEndM, 60, 5)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-3 text-[10.5px] text-[var(--aw-text-secondary)] cursor-pointer select-none"
                      onClick={() => setHasEnd(v => !v)}>
                      <span className="relative inline-block w-7 h-3.5 rounded-full transition-colors" style={{ background: hasEnd ? '#6366f1' : 'var(--aw-border)' }}>
                        <span className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all" style={{ right: hasEnd ? 2 : 14 }} />
                      </span>
                      تعیین ساعت پایان
                    </div>

                    <button
                      type="button"
                      className="w-full mt-3 py-2 rounded-lg border-none text-white text-[11.5px] cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ background: '#6366f1', fontWeight: 600 }}
                      onClick={() => { setNewTime(composeTime()); setShowTimePicker(false); }}
                    >
                      <i className="fa-solid fa-check text-[10px]" /> تأیید ساعت
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-2.5">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>زمان‌بندی</div>
              <div className="flex gap-1.5 flex-wrap">
                {dateOptions.map(d => (
                  <button key={d.value}
                    className={`py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all ${
                      newDate === d.value && !showCalendar ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                    }`}
                    style={newDate === d.value && !showCalendar ? { background: '#6366f1', fontWeight: 600 } : { fontWeight: 500 }}
                    onClick={() => { setNewDate(d.value); setShowCalendar(false); setSelectedCalDate(null); }}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  className={`py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-1 ${
                    showCalendar ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                  }`}
                  style={showCalendar ? { background: '#6366f1', fontWeight: 600 } : { fontWeight: 500 }}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <i className="fa-solid fa-calendar-days text-[9px]" />
                  {selectedCalDate ? formatSelectedDate(selectedCalDate) : 'انتخاب تاریخ'}
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRepeat(v => !v)}
                  className="py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-2"
                  style={autoRepeat
                    ? { background: '#10B981', borderColor: 'transparent', color: '#fff', fontWeight: 600 }
                    : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 500 }}
                >
                  <i className="fa-solid fa-repeat text-[9px]" />
                  تکرار خودکار
                  <span className="relative inline-block w-7 h-3.5 rounded-full transition-colors" style={{ background: autoRepeat ? 'rgba(255,255,255,0.45)' : 'var(--aw-border)' }}>
                    <span className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all" style={{ right: autoRepeat ? 2 : 14 }} />
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {autoRepeat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-[10px] border border-[var(--aw-border)] overflow-hidden"
                    style={{ background: 'var(--aw-bg-input)' }}
                  >
                    <div className="p-2.5 space-y-2.5">
                      <div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>مدت زمان تکرار</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] text-[var(--aw-text-muted)]">هر</span>
                          <input
                            type="number" min={1} max={99}
                            value={repeatInterval}
                            onChange={e => setRepeatInterval(Math.max(1, parseInt(e.target.value || '1', 10)))}
                            className="w-14 rounded-lg border border-[var(--aw-border)] px-2 py-1 text-[11px] text-center outline-none"
                            style={{ background: 'var(--aw-bg-card)' }}
                          />
                          <div className="flex gap-1">
                            {([['hour','ساعت'],['day','روز'],['week','هفته'],['month','ماه']] as const).map(([u, lbl]) => {
                              const active = repeatUnit === u;
                              return (
                                <button key={u} type="button" onClick={() => setRepeatUnit(u)}
                                  className="py-1 px-2.5 rounded-md border text-[10.5px] cursor-pointer"
                                  style={active
                                    ? { background: '#6366f1', borderColor: 'transparent', color: '#fff', fontWeight: 700 }
                                    : { background: 'transparent', borderColor: 'var(--aw-border)', color: 'var(--aw-text-secondary)', fontWeight: 500 }}>
                                  {lbl}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>حداکثر تعداد تکرار</div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => setRepeatMaxCount(c => Math.max(1, c - 1))}
                            className="w-7 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)]"
                            style={{ background: 'var(--aw-bg-card)' }}>−</button>
                          <input
                            type="number" min={1} max={365}
                            value={repeatMaxCount}
                            onChange={e => setRepeatMaxCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
                            className="w-16 rounded-lg border border-[var(--aw-border)] px-2 py-1 text-[11px] text-center outline-none"
                            style={{ background: 'var(--aw-bg-card)' }}
                          />
                          <button type="button" onClick={() => setRepeatMaxCount(c => Math.min(365, c + 1))}
                            className="w-7 h-7 rounded-lg border border-[var(--aw-border)] cursor-pointer text-[var(--aw-text-secondary)]"
                            style={{ background: 'var(--aw-bg-card)' }}>+</button>
                          <span className="text-[10.5px] text-[var(--aw-text-muted)]">بار</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-[var(--aw-text-muted)] flex items-center gap-1 pt-1 border-t border-[var(--aw-border)]" style={{ paddingTop: 8 }}>
                        <i className="fa-solid fa-circle-info text-[#6366f1]" />
                        این رویداد {toFa(repeatMaxCount)} بار، هر {toFa(repeatInterval)} {repeatUnit === 'hour' ? 'ساعت' : repeatUnit === 'day' ? 'روز' : repeatUnit === 'week' ? 'هفته' : 'ماه'} یک‌بار تکرار می‌شود.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Calendar */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-[10px] border border-[var(--aw-border)] overflow-hidden"
                    style={{ background: 'var(--aw-bg-input)' }}
                  >
                    <div className="p-2.5">
                      {/* Month navigation */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          className="w-7 h-7 rounded-lg border-none bg-transparent text-[var(--aw-text-secondary)] cursor-pointer hover:bg-[var(--aw-bg-card-hover)] flex items-center justify-center transition-colors"
                          onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                        >
                          <i className="fa-solid fa-chevron-right text-[10px]" />
                        </button>
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                          {PERSIAN_MONTHS[calMonth.getMonth()]} {toFa(calMonth.getFullYear())}
                        </span>
                        <button
                          className="w-7 h-7 rounded-lg border-none bg-transparent text-[var(--aw-text-secondary)] cursor-pointer hover:bg-[var(--aw-bg-card-hover)] flex items-center justify-center transition-colors"
                          onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                        >
                          <i className="fa-solid fa-chevron-left text-[10px]" />
                        </button>
                      </div>
                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {PERSIAN_WEEKDAYS.map(wd => (
                          <div key={wd} className="text-center text-[9px] text-[var(--aw-text-muted)] py-0.5" style={{ fontWeight: 600 }}>{wd}</div>
                        ))}
                      </div>
                      {/* Day cells */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {getCalendarDays(calMonth).map((day, idx) => {
                          if (day === null) return <div key={`empty-${idx}`} />;
                          const cellDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
                          const todayNow = new Date(); todayNow.setHours(0,0,0,0);
                          const isToday = cellDate.getTime() === todayNow.getTime();
                          const isPast = cellDate < todayNow;
                          const isSelected = selectedCalDate && cellDate.getTime() === selectedCalDate.getTime();
                          return (
                            <button
                              key={`day-${day}`}
                              disabled={isPast && !isToday}
                              className={`w-full aspect-square rounded-lg border-none text-[11px] cursor-pointer flex items-center justify-center transition-all ${
                                isSelected ? 'text-white' : isToday ? 'text-[#6366f1]' : isPast ? 'text-[var(--aw-text-muted)] opacity-40 cursor-not-allowed' : 'text-[var(--aw-text-secondary)] hover:bg-[var(--aw-bg-card-hover)]'
                              }`}
                              style={{
                                background: isSelected ? '#6366f1' : isToday && !isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                                fontWeight: isToday || isSelected ? 700 : 500,
                              }}
                              onClick={() => {
                                if (isPast && !isToday) return;
                                setSelectedCalDate(cellDate);
                                setNewDate(dateToCategoryLabel(cellDate));
                              }}
                            >
                              {toFa(day)}
                            </button>
                          );
                        })}
                      </div>
                      {/* Selected date label */}
                      {selectedCalDate && (
                        <div className="mt-2 text-center text-[10px] text-[var(--aw-text-muted)]">
                          <i className="fa-solid fa-check-circle text-[#6366f1] ml-1 text-[9px]" />
                          {formatSelectedDate(selectedCalDate)} — <span style={{ color: '#6366f1', fontWeight: 600 }}>{newDate}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-3">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 600 }}>نوع رویداد</div>
              <div className="flex gap-1.5 flex-wrap">
                {typeOptions.map(t => (
                  <button key={t.value}
                    className={`py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-1.5 ${
                      newType === t.value ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
                    }`}
                    style={newType === t.value ? { background: t.color, fontWeight: 600 } : { fontWeight: 500 }}
                    onClick={() => setNewType(t.value)}
                  >
                    <i className={`${t.icon} text-[9px]`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks list */}
            <div className="mb-3">
              <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5 flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                <i className="fa-solid fa-list-check text-[9px]" />
                وظایف برنامه ({toFa(newTaskDrafts.length)})
              </div>

              {newTaskDrafts.length > 0 && (
                <div className="mb-2">
                  {newTaskDrafts.map((d, idx) => {
                    const pr = priColors[d.priority];
                    return (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-2 mb-1.5 rounded-[10px] border border-[var(--aw-border)]"
                        style={{ background: 'var(--aw-bg-input)' }}>
                        <i className="fa-solid fa-circle text-[6px]" style={{ color: pr.color }} />
                        <span className="flex-1 text-[11.5px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{d.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${pr.color}18`, color: pr.color, fontWeight: 700 }}>{pr.label}</span>
                        <button
                          className="w-6 h-6 rounded-md border-none bg-transparent text-[var(--aw-text-muted)] cursor-pointer hover:text-red-400 flex items-center justify-center"
                          onClick={() => setNewTaskDrafts(prev => prev.filter((_, i) => i !== idx))}
                          title="حذف"
                        >
                          <i className="fa-solid fa-times text-[11px]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-1.5">
                <input
                  className="flex-1 rounded-[10px] border border-[var(--aw-border)] px-3 py-2 text-[11.5px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
                  style={{ background: 'var(--aw-bg-input)' }}
                  placeholder="افزودن وظیفه..."
                  value={newTaskInput}
                  onChange={e => setNewTaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTaskInput.trim()) {
                      e.preventDefault();
                      setNewTaskDrafts(prev => [...prev, { title: newTaskInput.trim(), priority: newTaskPriority }]);
                      setNewTaskInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-3 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[11px] cursor-pointer flex items-center gap-1"
                  style={{ color: priColors[newTaskPriority].color, fontWeight: 600 }}
                  onClick={() => {
                    const order: ('medium' | 'high' | 'low')[] = ['medium', 'high', 'low'];
                    const next = order[(order.indexOf(newTaskPriority) + 1) % order.length];
                    setNewTaskPriority(next);
                  }}
                  title="تغییر اولویت"
                >
                  <i className="fa-solid fa-flag text-[9px]" />
                  {priColors[newTaskPriority].label}
                </button>
                <button
                  type="button"
                  className="px-3 rounded-[10px] border-none text-white text-[11px] cursor-pointer flex items-center justify-center"
                  style={{ background: '#6366f1', fontWeight: 600 }}
                  onClick={() => {
                    if (!newTaskInput.trim()) return;
                    setNewTaskDrafts(prev => [...prev, { title: newTaskInput.trim(), priority: newTaskPriority }]);
                    setNewTaskInput('');
                  }}
                  title="افزودن"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-[10px] border-none text-white text-[12px] cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: '#6366f1', fontWeight: 600 }}
                onClick={submitNewEvent}
              >
                <i className="fa-solid fa-check text-[10px]" /> {editingId !== null ? 'ذخیره تغییرات' : 'ذخیره رویداد'}
              </button>
              <button
                className="py-2.5 px-4 rounded-[10px] border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-muted)] text-[12px] cursor-pointer"
                style={{ fontWeight: 500 }}
                onClick={() => { setShowNewForm(false); setEditingId(null); setNewTitle(''); setNewTime(''); setShowCalendar(false); setSelectedCalDate(null); setNewTaskDrafts([]); setNewTaskInput(''); setShowTimePicker(false); }}
              >
                انصراف
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button key="new-btn"
            className="w-full flex items-center justify-center gap-2 p-3 mb-4 rounded-[10px] border border-dashed cursor-pointer text-[12px] transition-all hover:border-[#6366f1] hover:bg-[rgba(99,102,241,0.06)]"
            style={{ borderColor: '#6366f1', background: 'transparent', color: '#6366f1', fontWeight: 600 }}
            onClick={() => setShowNewForm(true)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <i className="fa-solid fa-plus" /> ایجاد برنامه جدید
          </motion.button>
        )}
      </AnimatePresence>

      {renderGroup('امروز', 'fa-solid fa-sun', '#F59E0B', todayEvents, 0)}
      {renderGroup('فردا', 'fa-solid fa-moon', '#8B5CF6', tomorrowEvents, 0.2)}
      {renderGroup('تا یک ماه آینده', 'fa-solid fa-calendar', '#3B82F6', upToMonthEvents, 0.4)}
    </div>
  );
}

function AssistantTodoTab({ tasks, setTasks, events }: { tasks: AsstTask[]; setTasks: React.Dispatch<React.SetStateAction<AsstTask[]>>; events: CalEvent[] }) {
  const { showToast } = useApp();
  const [dragId, setDragId] = useState<number | null>(null);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    showToast('وضعیت وظیفه تغییر کرد');
  };

  const reorderTask = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    setTasks(prev => {
      const source = prev.find(t => t.id === sourceId);
      const target = prev.find(t => t.id === targetId);
      if (!source || !target || source.eventId !== target.eventId) return prev;
      const others = prev.filter(t => t.id !== sourceId);
      const targetIdx = others.findIndex(t => t.id === targetId);
      return [...others.slice(0, targetIdx), source, ...others.slice(targetIdx)];
    });
  };

  const inProgressEvents = events.filter(e => e.status === 'inprogress');
  const groups = inProgressEvents.map(ev => ({ ev, items: tasks.filter(t => t.eventId === ev.id) }));
  const orphanTasks = tasks.filter(t => !t.eventId || !inProgressEvents.some(ev => ev.id === t.eventId));

  const doneCount = tasks.filter(t => t.done).length;

  const renderTaskRow = (task: AsstTask, i: number) => {
    const pr = priColors[task.priority];
    return (
      <motion.div key={task.id}
        className={`flex items-center gap-2.5 p-3 mb-2 cursor-pointer ${dragId === task.id ? 'opacity-50' : ''}`}
        style={euCardStyle}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
        onClick={() => toggleTask(task.id)}
        draggable
        onDragStart={() => setDragId(task.id)}
        onDragEnd={() => setDragId(null)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (dragId !== null) { reorderTask(dragId, task.id); setDragId(null); } }}
      >
        <div className="w-5 h-7 flex items-center justify-center text-[var(--aw-text-muted)] cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={e => e.stopPropagation()} title="جابه‌جایی">
          <i className="fa-solid fa-grip-vertical text-[11px]" />
        </div>
        <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={{ borderColor: task.done ? '#10B981' : 'var(--aw-border)', background: task.done ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
          {task.done && <i className="fa-solid fa-check text-[10px] text-[#10B981]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] ${task.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 600 }}>{task.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusPill label={pr.label} color={pr.color} />
            <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-regular fa-clock text-[8px] ml-0.5" />{task.dueDate}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Progress summary */}
      <div className="p-3 mb-3 flex items-center gap-3" style={euCardStyle}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(126,95,170,0.15)" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--aw-eu-primary)" strokeWidth="3"
              strokeDasharray={`${(doneCount / Math.max(tasks.length, 1)) * 100}, 100`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
            {toFa(Math.round((doneCount / Math.max(tasks.length, 1)) * 100))}%
          </span>
        </div>
        <div>
          <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(doneCount)} از {toFa(tasks.length)} انجام شده</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(tasks.length - doneCount)} وظیفه باقی‌مانده</div>
        </div>
      </div>

      {groups.length === 0 && orphanTasks.length === 0 && (
        <div className="p-6 text-center rounded-2xl border border-dashed border-[var(--aw-border)]">
          <i className="fa-solid fa-list-check text-[22px] text-[var(--aw-text-muted)] mb-2 block" />
          <div className="text-[12px] text-[var(--aw-text-muted)]">وظیفه‌ای برای برنامه‌های در حال انجام ثبت نشده است.</div>
        </div>
      )}

      {groups.map(({ ev, items }) => {
        const ct = calTypeColors[ev.type];
        return (
          <div key={`grp-${ev.id}`} className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${ct.color}15` }}>
                <i className={`${ct.icon} text-[11px]`} style={{ color: ct.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>{ev.title}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{ev.date} · {ev.time}</div>
              </div>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-md flex items-center gap-1"
                style={{ background: planStatusStyles.inprogress.pillBg, color: planStatusStyles.inprogress.pillText, fontWeight: 700 }}>
                <i className={`${planStatusStyles.inprogress.icon} text-[8px]`} />{toFa(items.length)} وظیفه
              </span>
            </div>
            {items.length === 0 ? (
              <div className="text-[10.5px] text-[var(--aw-text-muted)] px-3 py-2.5 rounded-[10px] border border-dashed border-[var(--aw-border)] mb-2">
                وظیفه‌ای برای این برنامه ثبت نشده است.
              </div>
            ) : items.map((t, i) => renderTaskRow(t, i))}
          </div>
        );
      })}

      {orphanTasks.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] text-[var(--aw-text-muted)] mb-2 px-1 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
            <i className="fa-solid fa-inbox text-[10px]" /> سایر وظایف
          </div>
          {orphanTasks.map((t, i) => renderTaskRow(t, i))}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.trim();
  const parts: React.ReactNode[] = [];
  let i = 0;
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  while (i < text.length) {
    const idx = lowerText.indexOf(lowerQ, i);
    if (idx === -1) { parts.push(text.slice(i)); break; }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} style={{ background: 'rgba(99,102,241,0.30)', color: '#fff', padding: '0 2px', borderRadius: 3, fontWeight: 700 }}>
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

function AssistantSearchTab({ onBack }: { onBack?: () => void }) {
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const q = search.trim();
  const has = (s: string | undefined) => !!s && q !== '' && s.toLowerCase().includes(q.toLowerCase());

  const matchedOrders = q ? DINE_ORDERS.filter(o =>
    has(o.num) || has(o.items) || has(o.restaurant) || has(o.date) || has(o.total) || has(o.status) || has(o.eta)
  ) : [];
  const matchedEvents = q ? INITIAL_CAL_EVENTS.filter(e =>
    has(e.title) || has(e.time) || has(e.date) || has(e.type) || has(e.status) || has(e.description)
  ) : [];
  const matchedTasks = q ? INITIAL_TASKS.filter(t =>
    has(t.title) || has(t.priority) || has(t.dueDate)
  ) : [];

  const totalMatches = matchedOrders.length + matchedEvents.length + matchedTasks.length;

  const orderStatusLabel: Record<DineOrder['status'], { label: string; color: string }> = {
    preparing:  { label: 'در حال آماده‌سازی', color: '#F59E0B' },
    delivering: { label: 'در حال ارسال',     color: '#3B82F6' },
    delivered:  { label: 'تحویل شده',         color: '#10B981' },
    cancelled:  { label: 'لغو شده',           color: '#EF4444' },
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      <div className="flex items-center gap-2 mb-3">
        {onBack && (
          <button onClick={onBack} title="بازگشت"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--aw-eu-nav-bg)', border: '1px solid var(--aw-eu-nav-border)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
        )}
        <div className="flex-1 flex items-center gap-2 rounded-[10px] px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input className="flex-1 min-w-0 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="جستجو در سفارشات، برنامه‌ها و وظایف..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
        </div>
      </div>

      {q && (
        <div className="text-[10.5px] text-[var(--aw-text-muted)] mb-3 px-1">
          {totalMatches > 0 ? <><i className="fa-solid fa-circle-check text-[#10B981] ml-1 text-[9px]" />{toFa(totalMatches)} نتیجه برای «{q}»</> : <><i className="fa-solid fa-circle-info ml-1 text-[9px]" />نتیجه‌ای برای «{q}» یافت نشد</>}
        </div>
      )}

      {/* Orders results */}
      {matchedOrders.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="fa-solid fa-bag-shopping" title={`سفارشات (${toFa(matchedOrders.length)})`} />
          {matchedOrders.map((o, i) => {
            const st = orderStatusLabel[o.status];
            return (
              <motion.div key={o.id} className="p-3 mb-2" style={euCardStyle}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>
                    سفارش #<Highlight text={o.num} query={q} />
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: `${st.color}18`, color: st.color, fontWeight: 700 }}>{st.label}</span>
                </div>
                <div className="text-[11.5px] text-[var(--aw-text-secondary)] mb-0.5"><Highlight text={o.items} query={q} /></div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)] flex-wrap">
                  <span><i className="fa-solid fa-store text-[8px] ml-1" /><Highlight text={o.restaurant} query={q} /></span>
                  <span><i className="fa-regular fa-clock text-[8px] ml-1" /><Highlight text={o.date} query={q} /></span>
                  <span><i className="fa-solid fa-coins text-[8px] ml-1" /><Highlight text={o.total} query={q} /> تومان</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Plans results */}
      {matchedEvents.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="fa-solid fa-calendar-days" title={`برنامه‌ها (${toFa(matchedEvents.length)})`} />
          {matchedEvents.map((e, i) => {
            const ct = calTypeColors[e.type];
            const ss = planStatusStyles[e.status];
            return (
              <motion.div key={e.id} className="p-3 mb-2 rounded-2xl border"
                style={{ background: ss.bg, borderColor: ss.border }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ct.color}15` }}>
                    <i className={`${ct.icon} text-[11px]`} style={{ color: ct.color }} />
                  </div>
                  <span className="flex-1 text-[12.5px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 700 }}>
                    <Highlight text={e.title} query={q} />
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: ss.pillBg, color: ss.pillText, fontWeight: 700 }}>
                    <i className={`${ss.icon} text-[8px]`} />{ss.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)] flex-wrap mb-1">
                  <span><i className="fa-regular fa-calendar text-[8px] ml-1" /><Highlight text={e.date} query={q} /></span>
                  <span><i className="fa-regular fa-clock text-[8px] ml-1" /><Highlight text={e.time} query={q} /></span>
                  <StatusPill label={ct.label} color={ct.color} />
                </div>
                {e.description && (
                  <div className="text-[10.5px] text-[var(--aw-text-secondary)] leading-5">
                    <Highlight text={e.description} query={q} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tasks results */}
      {matchedTasks.length > 0 && (
        <div className="mb-4">
          <SectionTitle icon="fa-solid fa-list-check" title={`وظایف (${toFa(matchedTasks.length)})`} />
          {matchedTasks.map((t, i) => {
            const pr = priColors[t.priority];
            const parent = t.eventId ? INITIAL_CAL_EVENTS.find(e => e.id === t.eventId) : undefined;
            return (
              <motion.div key={t.id} className="p-3 mb-2" style={euCardStyle}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: t.done ? '#10B981' : 'var(--aw-border)', background: t.done ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
                    {t.done && <i className="fa-solid fa-check text-[8px] text-[#10B981]" />}
                  </div>
                  <span className={`flex-1 text-[12.5px] truncate ${t.done ? 'line-through text-[var(--aw-text-muted)]' : 'text-[var(--aw-text-primary)]'}`} style={{ fontWeight: 600 }}>
                    <Highlight text={t.title} query={q} />
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${pr.color}18`, color: pr.color, fontWeight: 700 }}>{pr.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--aw-text-muted)] flex-wrap">
                  <span><i className="fa-regular fa-clock text-[8px] ml-1" /><Highlight text={t.dueDate} query={q} /></span>
                  {parent && (
                    <span><i className="fa-solid fa-link text-[8px] ml-1" />{parent.title}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!q && (
        <>
          <SectionTitle icon="fa-solid fa-clock-rotate-left" title="جستجوهای اخیر" />
          <div className="flex flex-wrap gap-2 mb-4">
            {['گزارش ماهانه', 'جلسه تیم فنی', 'بررسی بودجه', 'ورزش صبحگاهی', 'مشتری آلفا'].map((term, i) => (
              <button key={i} type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--aw-border)] cursor-pointer hover:border-[#6366f1] transition-all"
                style={{ background: 'var(--aw-bg-input)' }}
                onClick={() => setSearch(term)}>
                <i className="fa-solid fa-clock-rotate-left text-[10px] text-[var(--aw-text-muted)]" />
                <span className="text-[11.5px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{term}</span>
              </button>
            ))}
          </div>

          <SectionTitle icon="fa-solid fa-sticky-note" title="یادداشت‌های اخیر" />
          {NOTES.map((n, i) => (
            <motion.div key={n.id} className="p-3 mb-2" style={euCardStyle}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{n.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: `${n.color}15`, color: n.color }}>{n.tag}</span>
              </div>
              <div className="text-[11px] text-[var(--aw-text-secondary)] truncate">{n.preview}</div>
              <div className="text-[9px] text-[var(--aw-text-muted)] mt-1"><i className="fa-regular fa-clock text-[8px] ml-0.5" />{n.date}</div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

type ReportRange = 'day' | 'week' | 'month' | 'year';
type ReportPeriod = 'hour' | 'day' | 'week' | 'month';

const RANGE_OPTIONS: { id: ReportRange; label: string; days: number }[] = [
  { id: 'day',   label: 'یک روزه',  days: 1 },
  { id: 'week',  label: 'یک هفته',  days: 7 },
  { id: 'month', label: 'یک ماهه',  days: 30 },
  { id: 'year',  label: 'یک ساله',  days: 365 },
];

const PERIOD_OPTIONS: { id: ReportPeriod; label: string }[] = [
  { id: 'hour',  label: 'ساعتی' },
  { id: 'day',   label: 'روزانه' },
  { id: 'week',  label: 'هفتگی' },
  { id: 'month', label: 'ماهانه' },
];

// Only periods finer than the selected range produce a multi-bucket chart.
const VALID_PERIODS: Record<ReportRange, ReportPeriod[]> = {
  day:   ['hour'],
  week:  ['hour', 'day'],
  month: ['day', 'week'],
  year:  ['week', 'month'],
};

const PRIORITY_WEIGHT: Record<AsstTask['priority'], number> = { high: 3, medium: 2, low: 1 };

interface SyntheticDoneRecord { type: 'task' | 'plan' | 'order'; title: string; date: Date; weight: number; meta: string }

function generateSyntheticHistory(tasks: AsstTask[], events: CalEvent[]): SyntheticDoneRecord[] {
  const now = new Date();
  const records: SyntheticDoneRecord[] = [];
  const seedRandom = (s: number) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

  // Build a deterministic year of synthetic completions distributed over past 365 days.
  // Tasks
  tasks.forEach((t, i) => {
    const base = t.done ? 8 : 2;
    for (let k = 0; k < base; k++) {
      const daysAgo = Math.floor(seedRandom(i * 31 + k * 7) * 365);
      const d = new Date(now); d.setDate(now.getDate() - daysAgo); d.setHours(Math.floor(seedRandom(i + k) * 24));
      records.push({ type: 'task', title: t.title, date: d, weight: PRIORITY_WEIGHT[t.priority], meta: t.dueDate });
    }
  });
  // Plans
  events.forEach((e, i) => {
    const base = e.status === 'done' ? 6 : 2;
    for (let k = 0; k < base; k++) {
      const daysAgo = Math.floor(seedRandom(i * 17 + k * 5 + 1) * 365);
      const d = new Date(now); d.setDate(now.getDate() - daysAgo); d.setHours(Math.floor(seedRandom(i + k + 7) * 24));
      records.push({ type: 'plan', title: e.title, date: d, weight: 2, meta: e.time });
    }
  });
  // Orders
  DINE_ORDERS.forEach((o, i) => {
    const base = o.status === 'delivered' ? 7 : 2;
    for (let k = 0; k < base; k++) {
      const daysAgo = Math.floor(seedRandom(i * 11 + k * 3 + 99) * 365);
      const d = new Date(now); d.setDate(now.getDate() - daysAgo); d.setHours(Math.floor(seedRandom(i + k + 13) * 24));
      const totalNum = Number(o.total.replace(/[٬,]/g, '')) || 100000;
      records.push({ type: 'order', title: `سفارش ${o.num}`, date: d, weight: Math.max(1, Math.round(totalNum / 100000)), meta: o.restaurant });
    }
  });
  return records;
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function printPDF(title: string, html: string) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: 'Vazirmatn', Tahoma, sans-serif; padding: 24px; color: #111; background:#fff; }
      h1 { font-size: 18px; margin: 0 0 16px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
      h2 { font-size: 14px; margin: 18px 0 8px; color: #6366f1; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: right; }
      th { background: #f3f4f6; }
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
      .label { color: #6b7280; font-size: 11px; }
      .value { font-size: 18px; font-weight: 700; }
    </style></head><body>${html}<script>setTimeout(()=>window.print(),250);</script></body></html>`);
  win.document.close();
}

const COLLECTION_OPTIONS: { id: 'order' | 'plan' | 'task'; label: string; icon: string; color: string }[] = [
  { id: 'order', label: 'سفارشات',   icon: 'fa-solid fa-bag-shopping',  color: '#F59E0B' },
  { id: 'plan',  label: 'برنامه‌ها', icon: 'fa-solid fa-calendar-days', color: '#3B82F6' },
  { id: 'task',  label: 'وظایف',     icon: 'fa-solid fa-list-check',    color: '#10B981' },
];

function AssistantReportTab({ tasks, events }: { tasks: AsstTask[]; events: CalEvent[] }) {
  const [range, setRange] = useState<ReportRange>('week');
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [collections, setCollections] = useState<Set<'order' | 'plan' | 'task'>>(new Set(['order', 'plan', 'task']));

  const periodOptions = PERIOD_OPTIONS.filter(p => VALID_PERIODS[range].includes(p.id));
  const selectRange = (r: ReportRange) => {
    setRange(r);
    if (!VALID_PERIODS[r].includes(period)) setPeriod(VALID_PERIODS[r][VALID_PERIODS[r].length - 1]);
  };

  const toggleCollection = (id: 'order' | 'plan' | 'task') => {
    setCollections(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); } else next.add(id);
      return next;
    });
  };

  const history = useMemo(() => generateSyntheticHistory(tasks, events), [tasks, events]);

  const rangeDays = RANGE_OPTIONS.find(r => r.id === range)!.days;
  const since = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - rangeDays); return d; }, [rangeDays]);
  const inRange = useMemo(
    () => history.filter(h => h.date >= since && collections.has(h.type)),
    [history, since, collections]
  );

  // Line chart: completed tasks over the range, bucketed by period
  const lineData = useMemo(() => {
    const buckets = new Map<string, { label: string; ts: number; count: number }>();
    const bucketKey = (d: Date) => {
      if (period === 'hour') return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      if (period === 'day')  return `${d.getMonth() + 1}/${d.getDate()}`;
      if (period === 'week') { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); return `هفته ${ws.getMonth() + 1}/${ws.getDate()}`; }
      return `${d.getFullYear()}/${d.getMonth() + 1}`;
    };
    inRange.filter(h => h.type === 'task').forEach(h => {
      const k = bucketKey(h.date);
      const cur = buckets.get(k) || { label: k, ts: h.date.getTime(), count: 0 };
      cur.count += 1; if (h.date.getTime() < cur.ts) cur.ts = h.date.getTime();
      buckets.set(k, cur);
    });
    return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts).map(b => ({ name: b.label, value: b.count }));
  }, [inRange, period]);

  // Pie: count of completed operations split by type
  const pieData = useMemo(() => {
    const c = { task: 0, plan: 0, order: 0 };
    inRange.forEach(h => { c[h.type] += 1; });
    return [
      { name: 'وظایف',     value: c.task,  color: '#10B981' },
      { name: 'برنامه‌ها', value: c.plan,  color: '#3B82F6' },
      { name: 'سفارشات',   value: c.order, color: '#F59E0B' },
    ];
  }, [inRange]);

  // Weighted average by period: sum(weight)/count
  const weightedData = useMemo(() => {
    const buckets = new Map<string, { label: string; ts: number; sumW: number; cnt: number; tasksW: number; tasksCnt: number; ordersW: number; ordersCnt: number }>();
    const bucketKey = (d: Date) => {
      if (period === 'hour') return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      if (period === 'day')  return `${d.getMonth() + 1}/${d.getDate()}`;
      if (period === 'week') { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); return `هفته ${ws.getMonth() + 1}/${ws.getDate()}`; }
      return `${d.getFullYear()}/${d.getMonth() + 1}`;
    };
    inRange.filter(h => h.type === 'task' || h.type === 'order').forEach(h => {
      const k = bucketKey(h.date);
      const cur = buckets.get(k) || { label: k, ts: h.date.getTime(), sumW: 0, cnt: 0, tasksW: 0, tasksCnt: 0, ordersW: 0, ordersCnt: 0 };
      cur.sumW += h.weight; cur.cnt += 1;
      if (h.type === 'task')  { cur.tasksW  += h.weight; cur.tasksCnt  += 1; }
      if (h.type === 'order') { cur.ordersW += h.weight; cur.ordersCnt += 1; }
      if (h.date.getTime() < cur.ts) cur.ts = h.date.getTime();
      buckets.set(k, cur);
    });
    return Array.from(buckets.values()).sort((a, b) => a.ts - b.ts).map(b => ({
      name: b.label,
      tasks:  b.tasksCnt  ? +(b.tasksW  / b.tasksCnt ).toFixed(2) : 0,
      orders: b.ordersCnt ? +(b.ordersW / b.ordersCnt).toFixed(2) : 0,
      total:  b.cnt       ? +(b.sumW    / b.cnt      ).toFixed(2) : 0,
    }));
  }, [inRange, period]);

  // Operation log
  const log = useMemo(() => [...inRange].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 40), [inRange]);

  const fmtDate = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;

  const exportExcel = () => {
    const headers = ['نوع', 'عنوان', 'تاریخ', 'وزن', 'توضیح'];
    const rows = log.map(l => [
      l.type === 'task' ? 'وظیفه' : l.type === 'plan' ? 'برنامه' : 'سفارش',
      l.title, fmtDate(l.date), l.weight, l.meta,
    ]);
    downloadCSV(`report-${range}-${period}.csv`, headers, rows);
  };

  const exportPDF = () => {
    const summary = `<div class="summary">
      <div class="card"><div class="label">وظایف انجام‌شده</div><div class="value">${pieData[0].value}</div></div>
      <div class="card"><div class="label">برنامه‌های انجام‌شده</div><div class="value">${pieData[1].value}</div></div>
      <div class="card"><div class="label">سفارشات تکمیل‌شده</div><div class="value">${pieData[2].value}</div></div>
    </div>`;
    const wTable = `<h2>میانگین وزنی</h2><table><thead><tr><th>دوره</th><th>وظایف</th><th>سفارشات</th><th>کل</th></tr></thead><tbody>${
      weightedData.map(w => `<tr><td>${w.name}</td><td>${w.tasks}</td><td>${w.orders}</td><td>${w.total}</td></tr>`).join('')
    }</tbody></table>`;
    const lTable = `<h2>لاگ عملیات</h2><table><thead><tr><th>نوع</th><th>عنوان</th><th>تاریخ</th><th>وزن</th><th>توضیح</th></tr></thead><tbody>${
      log.map(l => `<tr><td>${l.type === 'task' ? 'وظیفه' : l.type === 'plan' ? 'برنامه' : 'سفارش'}</td><td>${l.title}</td><td>${fmtDate(l.date)}</td><td>${l.weight}</td><td>${l.meta}</td></tr>`).join('')
    }</tbody></table>`;
    printPDF('گزارش Neura', `<h1>گزارش تجمیعی · بازه ${RANGE_OPTIONS.find(r => r.id === range)!.label} · دوره ${PERIOD_OPTIONS.find(p => p.id === period)!.label}</h1>${summary}${wTable}${lTable}`);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Collection filter */}
      <div className="mb-3">
        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 700 }}>کالکشن‌های گزارش</div>
        <div className="flex gap-1.5 flex-wrap">
          {COLLECTION_OPTIONS.map(c => {
            const active = collections.has(c.id);
            return (
              <button key={c.id}
                className="py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center gap-1.5"
                style={active
                  ? { background: c.color, color: '#fff', borderColor: 'transparent', fontWeight: 700 }
                  : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 500 }}
                onClick={() => toggleCollection(c.id)}>
                <i className={`${c.icon} text-[9px]`} />
                {c.label}
                {active && <i className="fa-solid fa-check text-[8px]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Range selector */}
      <div className="mb-3">
        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 700 }}>بازه گزارش</div>
        <div className="flex gap-1.5 flex-wrap">
          {RANGE_OPTIONS.map(r => (
            <button key={r.id}
              className="py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all"
              style={range === r.id
                ? { background: '#6366f1', color: '#fff', borderColor: 'transparent', fontWeight: 700 }
                : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 500 }}
              onClick={() => selectRange(r.id)}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Period selector */}
      <div className="mb-3">
        <div className="text-[10px] text-[var(--aw-text-muted)] mb-1.5 px-0.5" style={{ fontWeight: 700 }}>دوره تجمیع</div>
        <div className="flex gap-1.5 flex-wrap">
          {periodOptions.map(p => (
            <button key={p.id}
              className="py-1.5 px-3 rounded-lg border text-[11px] cursor-pointer transition-all"
              style={period === p.id
                ? { background: '#10B981', color: '#fff', borderColor: 'transparent', fontWeight: 700 }
                : { background: 'transparent', color: 'var(--aw-text-secondary)', borderColor: 'var(--aw-border)', fontWeight: 500 }}
              onClick={() => setPeriod(p.id)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <button className="flex-1 py-2 rounded-[10px] border-none text-white text-[11.5px] cursor-pointer flex items-center justify-center gap-1.5"
          style={{ background: '#10B981', fontWeight: 700 }} onClick={exportExcel}>
          <i className="fa-solid fa-file-excel text-[11px]" /> خروجی اکسل
        </button>
        <button className="flex-1 py-2 rounded-[10px] border-none text-white text-[11.5px] cursor-pointer flex items-center justify-center gap-1.5"
          style={{ background: '#EF4444', fontWeight: 700 }} onClick={exportPDF}>
          <i className="fa-solid fa-file-pdf text-[11px]" /> خروجی PDF
        </button>
      </div>

      {/* Summary cards */}
      <SectionTitle icon="fa-solid fa-chart-pie" title="گزارش تجمیعی" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {pieData.map((s, i) => (
          <motion.div key={s.name} className="p-3 flex flex-col gap-1.5" style={euCardStyle}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
              <i className="fa-solid fa-circle-check text-[10px]" style={{ color: s.color }} />
            </div>
            <span className="text-[16px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{toFa(s.value)}</span>
            <span className="text-[10px] text-[var(--aw-text-muted)]">{s.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Line chart: done tasks */}
      <SectionTitle icon="fa-solid fa-chart-line" title="وظایف انجام‌شده در بازه" />
      <div className="p-2 mb-4" style={euCardStyle}>
        {lineData.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-[var(--aw-text-muted)]">داده‌ای برای این بازه/دوره ثبت نشده است.</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(126,95,170,0.10)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart: operations split */}
      <SectionTitle icon="fa-solid fa-chart-pie" title="تفکیک عملیات‌ها" />
      <div className="p-2 mb-4" style={euCardStyle}>
        {pieData.every(p => p.value === 0) ? (
          <div className="py-8 text-center text-[11px] text-[var(--aw-text-muted)]">داده‌ای برای این بازه ثبت نشده است.</div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} paddingAngle={2}>
                {pieData.map(p => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--aw-text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weighted average chart */}
      <SectionTitle icon="fa-solid fa-scale-balanced" title="میانگین وزنی وظایف و سفارشات" />
      <div className="p-2 mb-4" style={euCardStyle}>
        {weightedData.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-[var(--aw-text-muted)]">داده‌ای برای این بازه/دوره ثبت نشده است.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weightedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(126,95,170,0.10)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--aw-text-secondary)' }} />
              <Bar dataKey="tasks"  name="وظایف"   fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" name="سفارشات" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Operation log */}
      <SectionTitle icon="fa-solid fa-list-ul" title={`لاگ عملیات (${toFa(log.length)})`} />
      <div className="p-2" style={euCardStyle}>
        {log.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-[var(--aw-text-muted)]">لاگی برای این بازه ثبت نشده است.</div>
        ) : log.map((l, i) => {
          const meta = l.type === 'task'
            ? { icon: 'fa-solid fa-list-check', color: '#10B981', label: 'وظیفه' }
            : l.type === 'plan'
              ? { icon: 'fa-solid fa-calendar-days', color: '#3B82F6', label: 'برنامه' }
              : { icon: 'fa-solid fa-bag-shopping', color: '#F59E0B', label: 'سفارش' };
          return (
            <div key={`${l.type}-${i}`} className="flex items-center gap-2.5 py-2 border-b border-[rgba(126,95,170,0.08)] last:border-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}18` }}>
                <i className={`${meta.icon} text-[10px]`} style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: 600 }}>{l.title}</div>
                <div className="text-[9.5px] text-[var(--aw-text-muted)]">{meta.label} · {l.meta}</div>
              </div>
              <div className="text-[9.5px] text-[var(--aw-text-muted)] flex-shrink-0 text-left">
                {fmtDate(l.date)}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: `${meta.color}18`, color: meta.color, fontWeight: 700 }}>w {l.weight}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssistantNewChat({ resetSignal = 0, loadMessages = null, loadSignal = 0 }: { resetSignal?: number; loadMessages?: { from: 'user' | 'agent'; text: string }[] | null; loadSignal?: number }) {
  const { showToast, speakMessage, speakingMsgId } = useApp();
  const [messages, setMessages] = useState<{ from: 'user' | 'agent'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // + (new chat) → reset conversation in-place, no new page
  useEffect(() => {
    if (resetSignal === 0) return;
    setMessages([]);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [resetSignal]);

  // Selecting a topic from the history drawer loads that topic's sample conversation
  useEffect(() => {
    if (loadSignal === 0) return;
    setMessages(loadMessages || []);
    setInputText('');
  }, [loadSignal]);

  // Lightweight offline intent matcher — picks a relevant reply based on
  // keywords in the question (works without any network/AI backend).
  const generateReply = (raw: string): string => {
    const q = raw.toLowerCase().replace(/[؟?!.،,]/g, ' ');
    const has = (...ws: string[]) => ws.some(w => q.includes(w));

    if (has('سلام', 'درود', 'وقت بخیر', 'صبح بخیر', 'hi', 'hello')) return 'سلام! 👋 چطور می‌تونم کمکتون کنم؟';
    if (has('خداحافظ', 'بای', 'فعلا', 'مرسی', 'ممنون', 'تشکر', 'سپاس')) return 'خواهش می‌کنم! هر زمان کاری داشتید در خدمتم. 🙏';
    if (has('اسمت', 'کی هستی', 'معرفی')) return 'من دستیار هوشمند شما هستم؛ کارهای روزمره، یادآوری‌ها، تسک‌ها و جستجوی اطلاعات رو برات انجام می‌دم.';

    if (has('برنامه', 'امروز', 'تقویم', 'جلسه امروز', 'برنامه‌م')) return '📅 برنامه‌ی امروز شما: \n• جلسه‌ی تیم محصول ساعت ۱۰:۰۰\n• تماس با تأمین‌کننده ساعت ۱۳:۳۰\n• بازبینی گزارش فروش ساعت ۱۶:۰۰\nمی‌خواید مورد جدیدی اضافه کنم؟';
    if (has('جلسه', 'قرار', 'میتینگ', 'meeting')) return 'جلسه رو ثبت کنم؟ لطفاً تاریخ، ساعت و شرکت‌کننده‌ها رو بگید تا توی تقویم بذارم و یادآوری تنظیم کنم.';
    if (has('تسک', 'وظیفه', 'کار جدید', 'task', 'بساز')) return '✅ باشه، تسک جدید رو اضافه کردم. عنوانش رو دقیق‌تر بگید تا اولویت و موعدش رو هم تنظیم کنم.';
    if (has('یادآوری', 'یادم', 'ریمایندر', 'reminder', 'هشدار')) return '⏰ یادآوری تنظیم شد. چه ساعتی بهتون اطلاع بدم؟';
    if (has('ایمیل', 'میل', 'email', 'نامه')) return '✉️ پیش‌نویس ایمیل رو آماده می‌کنم. گیرنده و موضوع رو بگید تا متنش رو بنویسم.';
    if (has('تماس', 'زنگ', 'call', 'شماره')) return '📞 با چه کسی تماس بگیرم؟ اسم یا شماره رو بفرستید تا برقرار کنم.';
    if (has('هوا', 'آب و هوا', 'weather', 'بارون', 'دما')) return '🌤️ هوای امروز تهران: آفتابی، حدود ۲۴ درجه. برای بعدازظهر احتمال وزش باد ملایم هست.';
    if (has('فروش', 'درآمد', 'فاکتور', 'مالی', 'گزارش', 'سود')) return '📊 خلاصه‌ی امروز: فروش ۱۲ سفارش، درآمد ۸٫۴ میلیون تومان، رشد ۶٪ نسبت به دیروز. گزارش کامل رو باز کنم؟';
    if (has('خرید', 'سفارش', 'تأمین', 'انبار', 'موجودی')) return '🛒 ۳ قلم کالا به سطح هشدار موجودی رسیده. می‌خواید درخواست خرید ثبت کنم؟';
    if (has('خلاصه', 'جمع‌بندی', 'summary')) return 'بله، خلاصه‌ش می‌کنم: لطفاً متن یا موضوعی که می‌خواید خلاصه کنم رو بفرستید.';
    if (has('ترجمه', 'translate', 'انگلیسی', 'به فارسی')) return '🌐 حتماً — متن موردنظر رو بفرستید تا برات ترجمه کنم.';
    if (has('چطور', 'چگونه', 'راهنما', 'کمک', 'help', 'بلدی')) return 'حتماً کمک می‌کنم. دقیق‌تر بگید دنبال چی هستید تا قدم‌به‌قدم راهنماییتون کنم.';
    if (q.trim().split(/\s+/).length <= 2) return `در مورد «${raw.trim()}» می‌خواید چه کاری انجام بدم؟ جستجو کنم، یادآوری بذارم یا اطلاعات بیشتری بدم؟`;
    return `متوجه شدم: «${raw.trim()}». الان روش کار می‌کنم و نتیجه رو بهتون می‌گم. اگر جزئیات بیشتری دارید بفرمایید تا دقیق‌تر کمک کنم.`;
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setTimeout(() => {
      const reply = generateReply(userMsg);
      setMessages(prev => [...prev, { from: 'agent', text: reply }]);
    }, 700);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 aw-scroll space-y-2">
        {messages.length === 0 && (
          <motion.div className="flex flex-col items-center justify-center h-full text-center py-12"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h3 className="text-[15px] text-[var(--aw-text-primary)] mb-1" style={{ fontWeight: 700 }}>گفتگوی جدید</h3>
            <p className="text-[12px] text-[var(--aw-text-muted)] max-w-[220px]">سوالی بپرسید یا دستوری بدهید، دستیار هوشمند آماده کمک است.</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {['برنامه امروزم چیه؟', 'یه تسک جدید بساز', 'یادآوری تنظیم کن'].map((suggestion, i) => (
                <button key={i} className="px-3 py-1.5 rounded-full border border-[var(--aw-border)] bg-transparent text-[11px] text-[var(--aw-text-secondary)] cursor-pointer hover:border-[#6366f1] hover:text-[#6366f1] transition-all"
                  onClick={() => { setInputText(suggestion); inputRef.current?.focus(); }}>
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {messages.map((m, i) => (
          <motion.div key={i} className={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-[12px] ${
              m.from === 'user'
                ? 'bg-[var(--aw-eu-primary)] text-white rounded-br-md'
                : 'rounded-bl-md'
            }`} style={m.from === 'agent' ? { background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' } : {}}>
              {m.from === 'agent' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px]" style={{ background: '#6366f1' }}>
                    <i className="fa-solid fa-robot" />
                  </div>
                  <span className="text-[10px] text-[var(--aw-text-muted)]" style={{ fontWeight: 600 }}>دستیار شخصی</span>
                  <button onClick={() => speakMessage('asst-' + i, m.text)} title="خواندن متن"
                    className="mr-auto w-6 h-6 rounded-md border-none cursor-pointer flex items-center justify-center transition-all"
                    style={speakingMsgId === 'asst-' + i
                      ? { background: '#6366f1', color: '#fff' }
                      : { background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                    <i className={`fa-solid ${speakingMsgId === 'asst-' + i ? 'fa-volume-high' : 'fa-volume-low'} text-[10px]`} />
                  </button>
                </div>
              )}
              <span style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>{m.text}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input bar — matches the shared chat popup (Figma) */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{
          background: 'var(--aw-eu-glass-card, rgba(255,255,255,0.2))',
          borderTop: '0.5px solid white',
          boxShadow: '-2px -2px 4px 0px rgba(123,98,252,0.2)',
          paddingTop: 10,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Send button — circular, lavender */}
        <button
          className="flex-shrink-0 flex items-center justify-center rounded-full border-none cursor-pointer"
          style={{
            width: 40, height: 40,
            background: inputText.trim() ? '#7b62fc' : '#d6cefe',
            boxShadow: 'inset 2px 2px 1px 0px rgba(255,255,255,0.45), 2px 4px 4px 0px rgba(0,0,0,0.25)',
            border: '1px solid white',
          }}
          onClick={sendMessage}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d={svgChatIcons.p11544700} fill="white" />
          </svg>
        </button>

        {/* Pill input */}
        <div
          className="flex-1 flex items-center gap-2 relative"
          style={{
            height: 40,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            boxShadow: 'inset 2px 2px 8px 4px rgba(0,0,0,0.2)',
            border: '1px solid white',
            paddingRight: 10,
            paddingLeft: 10,
          }}
        >
          {/* Mic icon (RTL start = right side) */}
          <div className="flex-shrink-0 w-[22px] h-[22px] relative" onClick={() => showToast('ضبط صدا شروع شد...')} style={{ cursor: 'pointer' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d={svgChatIcons.p7f348f0} fill="#565656" />
              <path d={svgChatIcons.p1899c780} fill="#565656" />
            </svg>
          </div>

          {/* Text input */}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-right"
            style={{ fontSize: 14, color: 'var(--aw-text-primary)', fontFamily: "'Kamand', sans-serif", minWidth: 0 }}
            placeholder="پیام خود را بنویسید..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          />

          {/* Add/attach icon (RTL end = left side) */}
          <div className="flex-shrink-0 w-[22px] h-[22px] relative" onClick={() => showToast('ارسال فایل')} style={{ cursor: 'pointer' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d={svgChatIcons.p12f1a600} fill="#565656" />
              <path d={svgChatIcons.p29988c00} fill="#565656" />
              <path d={svgChatIcons.p2050cb80} fill="#565656" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EuAssistantScreen() {
  const { setEuScreen, openChat, showToast, startCall, goBack, speakMessage, speakingMsgId } = useApp();
  const [tab, setTab] = useState('chat');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_CAL_EVENTS);
  const [showTopics, setShowTopics] = useState(false);
  const [drawerView, setDrawerView] = useState<'history' | 'folders'>('history');
  const [newChatSignal, setNewChatSignal] = useState(0);
  const [topicMsgs, setTopicMsgs] = useState<{ from: 'user' | 'agent'; text: string }[] | null>(null);
  const [loadSignal, setLoadSignal] = useState(0);
  const [drawerEditId, setDrawerEditId] = useState<number|null>(null);
  const [drawerEditVal, setDrawerEditVal] = useState('');
  const [topicsList, setTopicsList] = useState([
    { id: 1, title: 'گفتگوی اولیه', date: 'امروز', msgs: 5, active: true },
    { id: 2, title: 'بررسی برنامه هفتگی', date: 'دیروز', msgs: 12, active: false },
    { id: 3, title: 'یادآوری جلسات', date: '۲ روز پیش', msgs: 8, active: false },
    { id: 4, title: 'لیست خرید', date: '۳ روز پیش', msgs: 4, active: false },
    { id: 5, title: 'برنامه‌ریزی سفر', date: '۵ روز پیش', msgs: 7, active: false },
    { id: 6, title: 'گزارش هفتگی', date: 'هفته پیش', msgs: 9, active: false },
    { id: 7, title: 'پیگیری پرونده‌ها', date: 'هفته پیش', msgs: 3, active: false },
    { id: 8, title: 'یادداشت‌های جلسه', date: '۲ هفته پیش', msgs: 6, active: false },
    { id: 9, title: 'تنظیمات کلی', date: '۲ هفته پیش', msgs: 2, active: false },
    { id: 10, title: 'درخواست‌های معوق', date: '۱ ماه پیش', msgs: 11, active: false },
  ]);
  const [foldersList, setFoldersList] = useState([
    { id: 1, title: 'کارها و یادآوری‌ها', date: '۱۲ مورد', active: true },
    { id: 2, title: 'برنامه‌های سفر', date: '۵ مورد', active: false },
    { id: 3, title: 'گزارش‌های ماهانه', date: '۸ مورد', active: false },
    { id: 4, title: 'پروژه‌های جاری', date: '۳ مورد', active: false },
    { id: 5, title: 'ایده‌ها و نکات', date: '۱۵ مورد', active: false },
    { id: 6, title: 'تماس‌های مهم', date: '۷ مورد', active: false },
    { id: 7, title: 'اسناد مالی', date: '۴ مورد', active: false },
    { id: 8, title: 'آموزش و مطالعه', date: '۹ مورد', active: false },
  ]);

  // Drag sheet (mobile) — mirrors the admin chat overlay: 3 snaps (full / below-header / closed)
  const FULL_TOP = 0;
  const [headerBottom, setHeaderBottom] = useState(120);
  const [sheetTop, setSheetTop] = useState<number | null>(null); // null = follow live anchor (below header)
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const dragRef = useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);
  const curTop = sheetTop != null ? sheetTop : headerBottom;

  useEffect(() => { const r = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(r); }, []);

  useEffect(() => {
    const measure = () => {
      const anchor = document.querySelector('[data-chat-top-anchor]') || document.querySelector('header');
      if (anchor) setHeaderBottom(anchor.getBoundingClientRect().bottom);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const anchor = document.querySelector('[data-chat-top-anchor]') || document.querySelector('header');
    if (anchor) ro.observe(anchor);
    const iv = setInterval(measure, 160);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); clearInterval(iv); window.removeEventListener('resize', measure); };
  }, []);

  const onSheetDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 768) return;
    if ((e.target as HTMLElement).closest('button')) return; // keep header buttons clickable
    dragRef.current = { startY: e.clientY, startTop: curTop, moved: false };
    setDragging(true);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onSheetMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = e.clientY - dragRef.current.startY;
    if (Math.abs(d) > 6) dragRef.current.moved = true;
    setSheetTop(Math.max(FULL_TOP, dragRef.current.startTop + d)); // up to full-screen
  };
  const onSheetUp = () => {
    if (!dragRef.current) return;
    const wasTap = !dragRef.current.moved;
    dragRef.current = null;
    setDragging(false);
    if (wasTap) {
      // Tap: full-screen → collapse below avatar; below avatar → full-screen.
      if (curTop < headerBottom - 4) setSheetTop(null);
      else setSheetTop(FULL_TOP);
      return;
    }
    if (curTop > headerBottom + 90) { goBack(); return; }             // pulled down → close
    if (curTop < headerBottom - 60) { setSheetTop(FULL_TOP); return; } // pulled up → full-screen
    setSheetTop(null);                                                 // snap back below the avatar
  };

  const pendingTasks = tasks.filter(t => !t.done).length;
  const asstTabs = ASSISTANT_TABS.map(t => t.id === 'todo' ? { ...t, badge: pendingTasks } : t);

  const TOPICS_LIST = topicsList;

  const TOPIC_MESSAGES: Record<number, { from: 'user' | 'agent'; text: string }[]> = {
    1: [
      { from: 'user', text: 'سلام، می‌تونی کمکم کنی امروز رو سازماندهی کنم؟' },
      { from: 'agent', text: 'سلام! حتماً. سه کار با اولویت بالا برای امروز دارید و یک جلسه ساعت ۱۴. می‌خواید از کجا شروع کنیم؟' },
      { from: 'user', text: 'اول جلسه رو مرور کنیم.' },
      { from: 'agent', text: 'جلسه «بازبینی پروژه» ساعت ۱۴ با تیم محصول است. دستور جلسه و یادداشت جلسه قبل را آماده کرده‌ام.' },
    ],
    2: [
      { from: 'user', text: 'برنامه این هفته‌ام چطوره؟' },
      { from: 'agent', text: 'این هفته ۵ جلسه، ۳ ضرب‌الاجل و ۲ سفر کاری دارید. شنبه و دوشنبه سنگین‌ترین روزها هستند.' },
      { from: 'user', text: 'چیزی هست که بشه جابه‌جا کرد؟' },
      { from: 'agent', text: 'جلسه روز دوشنبه با تیم فروش قابل انتقال به سه‌شنبه است تا بار دوشنبه سبک‌تر شود. منتقل کنم؟' },
    ],
    3: [
      { from: 'agent', text: '⏰ یادآوری: جلسه «بازبینی بودجه» فردا ساعت ۱۰ صبح.' },
      { from: 'user', text: 'برای نیم ساعت قبلش هم یادآوری بذار.' },
      { from: 'agent', text: 'انجام شد. یادآوری ساعت ۹:۳۰ تنظیم شد و دعوت‌نامه برای شرکت‌کنندگان ارسال شد.' },
    ],
    4: [
      { from: 'user', text: 'لیست خرید این هفته رو بساز.' },
      { from: 'agent', text: '🛒 لیست خرید:\n• شیر و تخم‌مرغ\n• میوه و سبزیجات تازه\n• قهوه\n• مواد شوینده\nچیزی اضافه کنم؟' },
      { from: 'user', text: 'نان و پنیر هم اضافه کن.' },
      { from: 'agent', text: 'اضافه شد. لیست حالا ۶ قلم دارد و در بخش «کارها و یادآوری‌ها» ذخیره شد.' },
    ],
  };

  const FOLDERS_LIST = foldersList;

  const toggleDrawer = (view: 'history' | 'folders') => {
    if (showTopics && drawerView === view) { setShowTopics(false); }
    else { setDrawerView(view); setShowTopics(true); }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Mobile: draggable bottom-sheet (like the agent chat overlay) — 3 snaps (full / below-avatar / closed),
  // tap the handle to collapse/close. Desktop: normal flow.
  const sheetStyle: React.CSSProperties = isMobile ? {
    position: 'fixed', top: curTop, bottom: 0, left: 0, right: 0, zIndex: 60,
    borderRadius: curTop > headerBottom + 4 ? '18px 18px 0 0' : 0,
    paddingTop: curTop <= headerBottom - 40 ? 'env(safe-area-inset-top, 0px)' : 0,
    transition: dragging ? 'none' : 'top 0.32s cubic-bezier(0.32,0.72,0,1)',
    background: 'var(--aw-chat-bg, rgba(240,238,250,0.62))',
    backdropFilter: 'blur(20px) saturate(1.2)', WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
    boxShadow: curTop > headerBottom + 4 ? '0 -8px 32px rgba(0,0,0,0.18)' : 'none',
  } : {
    position: 'relative', height: '100%',
    background: 'var(--aw-chat-bg, rgba(240,238,250,0.62))',
    backdropFilter: 'blur(20px) saturate(1.2)', WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
  };

  const sheet = (
    <div data-chat-sheet="1" className="flex flex-col aw-chat-pattern" style={sheetStyle}>
      {/* Drag handle (mobile) — drag to resize, tap to collapse/close */}
      <div className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0" style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onSheetDown} onPointerMove={onSheetMove} onPointerUp={onSheetUp} onPointerCancel={onSheetUp}>
        <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--aw-eu-nav-border)' }} />
      </div>
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--aw-border)] flex-shrink-0"
        style={{ background: 'var(--aw-bg-header)' }}>
        {/* Action icons — right corner (RTL start) */}
        <div className="flex items-center gap-1.5">
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all relative"
            style={showTopics && drawerView === 'history' ? { background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderColor: '#6366f1' } : {}}
            onClick={() => toggleDrawer('history')} title="تاریخچه گفتگو">
            <i className="fa-solid fa-clock-rotate-left text-[13px]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ background: '#6366f1', fontWeight: 700 }}>{TOPICS_LIST.length}</span>
          </button>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all relative"
            style={showTopics && drawerView === 'folders' ? { background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderColor: '#6366f1' } : {}}
            onClick={() => toggleDrawer('folders')} title="پوشه‌ها">
            <i className="fa-solid fa-folder-open text-[13px]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ background: '#6366f1', fontWeight: 700 }}>{FOLDERS_LIST.length}</span>
          </button>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[#6366f1] hover:border-[#6366f1] transition-all"
            onClick={() => { setNewChatSignal(s => s + 1); showToast('گفتگوی جدید'); }} title="گفتگوی جدید">
            <i className="fa-solid fa-plus text-[13px]" />
          </button>
        </div>
        {/* Title — left side */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>دستیار شخصی</div>
            <div className="text-[10px]" style={{ color: '#10b981' }}>آنلاین</div>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: '#6366f1', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
            <i className="fa-solid fa-robot text-[14px]" />
          </div>
          <button className="w-8 h-8 rounded-[10px] border border-[var(--aw-border)] bg-transparent cursor-pointer flex items-center justify-center text-[var(--aw-text-secondary)] hover:text-[var(--aw-eu-primary)] hover:border-[var(--aw-eu-primary)] transition-all"
            onClick={goBack} title="بازگشت">
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
        </div>
      </div>

      {/* Topics/folders drawer — slides in from the right with a blurred backdrop */}
      <AnimatePresence>
        {showTopics && (
          <>
          <motion.div className="absolute inset-0 z-20 flex items-center justify-center p-4"
            style={{ background: 'transparent', height: '100%' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setShowTopics(false)}>
          <motion.div className="w-[88%] max-w-[360px] overflow-y-auto aw-scroll rounded-2xl"
            style={{ height: '70%', maxHeight: '90%', background: 'var(--aw-bg-card)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid var(--aw-border)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            initial={{ scale: 0.92, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--aw-border)] sticky top-0 z-10" style={{ background: 'var(--aw-chat-bg, rgba(240,238,250,0.72))', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
              <span className="text-[13px] text-[var(--aw-text-primary)] flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <i className={`fa-solid ${drawerView === 'folders' ? 'fa-folder-open' : 'fa-clock-rotate-left'} text-[12px]`} style={{ color: '#6366f1' }} /> {drawerView === 'folders' ? 'پوشه‌ها' : 'تاریخچه گفتگو'}
              </span>
              <button className="text-[11px] px-2.5 py-1 rounded-lg border-none cursor-pointer text-white flex items-center gap-1"
                style={{ background: '#6366f1', fontWeight: 600 }}
                onClick={() => {
                  if (drawerView === 'folders') {
                    const newId = Date.now();
                    setFoldersList((l: any[]) => [{ id: newId, title: 'پوشه جدید', date: '۰ مورد', active: false }, ...l]);
                    setDrawerEditId(newId); setDrawerEditVal('پوشه جدید');
                  } else {
                    const newId = Date.now();
                    setTopicsList((l: any[]) => [{ id: newId, title: 'گفتگوی جدید', date: 'همین الان', msgs: 0, active: false }, ...l]);
                    setDrawerEditId(newId); setDrawerEditVal('گفتگوی جدید');
                  }
                }}>
                <i className="fa-solid fa-plus text-[9px]" /> جدید
              </button>
            </div>
            {(drawerView === 'folders' ? FOLDERS_LIST : TOPICS_LIST).map((item: any) => {
              const setList = drawerView === 'folders' ? setFoldersList : setTopicsList;
              const isEditing = drawerEditId === item.id;
              const openItem = () => { setShowTopics(false); setTab('chat'); if (drawerView !== 'folders') { setTopicMsgs(TOPIC_MESSAGES[item.id] || []); setLoadSignal(s => s + 1); } };
              return (
                <div key={item.id} className="w-full flex items-center gap-1 px-2 py-2 transition-all"
                  style={item.active ? { background: 'rgba(99,102,241,0.08)' } : {}}>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: item.active ? '#6366f122' : 'var(--aw-bg-app)' }} onClick={openItem}>
                    <i className={`fa-solid ${drawerView === 'folders' ? (item.active ? 'fa-folder-open' : 'fa-folder') : (item.active ? 'fa-comment-dots' : 'fa-file-lines')} text-[12px]`}
                      style={{ color: item.active ? '#6366f1' : 'var(--aw-text-muted)' }} />
                  </button>
                  {isEditing ? (
                    <input autoFocus className="flex-1 min-w-0 text-[12px] px-2 py-1 rounded-lg border border-[#6366f1] outline-none bg-transparent text-right"
                      style={{ color: 'var(--aw-text-primary)', fontFamily: 'inherit' }}
                      value={drawerEditVal}
                      onChange={e => setDrawerEditVal(e.target.value)}
                      onBlur={() => { setList((l: any[]) => l.map((x: any) => x.id === item.id ? { ...x, title: drawerEditVal || x.title } : x)); setDrawerEditId(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setDrawerEditId(null); }} />
                  ) : (
                    <button className="flex-1 min-w-0 text-right border-none bg-transparent cursor-pointer p-0" onClick={openItem}>
                      <div className="text-[12px] text-[var(--aw-text-primary)] truncate" style={{ fontWeight: item.active ? 700 : 500 }}>{item.title}</div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{drawerView === 'folders' ? item.date : item.date + ' · ' + item.msgs + ' پیام'}</div>
                    </button>
                  )}
                  {item.active && !isEditing && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />}
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: 'transparent', color: 'var(--aw-text-muted)' }}
                    onClick={e => { e.stopPropagation(); setDrawerEditId(item.id); setDrawerEditVal(item.title); }}>
                    <i className="fa-solid fa-pen text-[10px]" />
                  </button>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border-none cursor-pointer"
                    style={{ background: 'transparent', color: '#ef4444' }}
                    onClick={e => { e.stopPropagation(); setList((l: any[]) => l.filter((x: any) => x.id !== item.id)); }}>
                    <i className="fa-solid fa-trash text-[10px]" />
                  </button>
                </div>
              );
            })}
          </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === 'chat' && <AssistantNewChat resetSignal={newChatSignal} loadMessages={topicMsgs} loadSignal={loadSignal} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return isMobile ? createPortal(sheet, document.body) : sheet;
}


// =====================================================================
//  SEARCH SCREEN (جستجو – مستقل)
// =====================================================================
export function EuSearchScreen() {
  const { setEuScreen } = useApp();
  return (
    <div className="flex flex-col h-full">
      <AssistantSearchTab onBack={() => setEuScreen('euHomeScreen')} />
    </div>
  );
}

// =====================================================================
//  REPORT SCREEN (گزارش – مستقل)
// =====================================================================
export function EuReportScreen() {
  const { setEuScreen } = useApp();
  const [tasks] = useState(INITIAL_TASKS);
  const [events] = useState(INITIAL_CAL_EVENTS);
  return (
    <div className="flex flex-col h-full">
      <AssistantReportTab tasks={tasks} events={events} />
    </div>
  );
}

// =====================================================================
//  PLANNER SCREEN (برنامه‌ها و وظایف – ادغام‌شده)
// =====================================================================
export function EuPlannerScreen() {
  const { setEuScreen, showToast } = useApp();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_CAL_EVENTS);

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        <motion.div key="calendar" className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          <AssistantCalendarTab events={events} setEvents={setEvents} tasks={tasks} setTasks={setTasks} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
