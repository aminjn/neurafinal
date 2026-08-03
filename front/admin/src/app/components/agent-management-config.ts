import {
  Users,
  Megaphone,
  Map,
  Activity,
  Mail,
  FileBarChart2,
  Receipt,
  BookOpen,
  Banknote,
  CalendarDays,
  Phone,
  StickyNote,
  ClipboardCheck,
  ShoppingBag,
  Truck,
  Boxes,
  FileSignature,
  Tag,
  CreditCard,
  Clock,
  Package,
} from "lucide-react";
import type { GridColumn } from "./data-grid";

export type AgentTypeKey =
  | "secretary"
  | "marketer"
  | "finance"
  | "procurement"
  | "cashier";

export type SubMenu = {
  key: string;
  label: string;
  icon: any;
  columns: GridColumn[];
  rows: any[];
  itemLabel: string;
};

export type AgentTypeConfig = {
  label: string;
  description: string;
  subMenus: SubMenu[];
  agentsColumns: GridColumn[];
  agents: any[];
};

const agentsBaseColumns: GridColumn[] = [
  { field: "name", headerName: "نام ایجنت", filterType: "text" },
  { field: "business", headerName: "بیزینس خریدار", filterType: "set" },
  { field: "plan", headerName: "پلن", filterType: "set" },
  { field: "purchasedAt", headerName: "تاریخ خرید", filterType: "date" },
  { field: "remainingTokens", headerName: "توکن باقیمانده", filterType: "number" },
  { field: "status", headerName: "وضعیت", filterType: "set" },
];

export const agentTypeConfig: Record<AgentTypeKey, AgentTypeConfig> = {
  secretary: {
    label: "ایجنت منشی",
    description: "مدیریت قرارها، تماس‌ها و امور دفتری",
    agentsColumns: agentsBaseColumns,
    agents: [
      { id: "SC-1", name: "منشی فروشگاه آلفا", business: "فروشگاه آلفا", plan: "حرفه‌ای", purchasedAt: "2026-02-12", remainingTokens: 86000, status: "فعال" },
      { id: "SC-2", name: "منشی خدمات گاما", business: "خدمات گاما", plan: "استاندارد", purchasedAt: "2026-03-05", remainingTokens: 32000, status: "فعال" },
      { id: "SC-3", name: "منشی انبار بتا", business: "انبار بتا", plan: "پایه", purchasedAt: "2026-04-01", remainingTokens: 0, status: "غیرفعال" },
    ],
    subMenus: [
      {
        key: "appointments",
        label: "قرارها",
        icon: CalendarDays,
        itemLabel: "قرار",
        columns: [
          { field: "title", headerName: "عنوان قرار", filterType: "text" },
          { field: "with", headerName: "طرف مقابل", filterType: "text" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
          { field: "time", headerName: "ساعت", filterType: "text" },
          { field: "channel", headerName: "نحوه برگزاری", filterType: "set" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { title: "جلسه با تأمین‌کننده", with: "شرکت آریا", date: "2026-05-12", time: "10:00", channel: "حضوری", status: "تأیید شده" },
          { title: "تماس با مشتری ویژه", with: "علی حسینی", date: "2026-05-13", time: "14:30", channel: "تلفنی", status: "در انتظار" },
          { title: "بازدید از انبار", with: "تیم انبار", date: "2026-05-15", time: "09:00", channel: "حضوری", status: "تأیید شده" },
        ],
      },
      {
        key: "calls",
        label: "تماس‌ها",
        icon: Phone,
        itemLabel: "تماس",
        columns: [
          { field: "contact", headerName: "تماس‌گیرنده", filterType: "text" },
          { field: "phone", headerName: "شماره", filterType: "text" },
          { field: "type", headerName: "نوع", filterType: "set" },
          { field: "duration", headerName: "مدت (ثانیه)", filterType: "number" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { contact: "زهرا قاسمی", phone: "0912-1112233", type: "ورودی", duration: 320, date: "2026-05-08", status: "پاسخ داده" },
          { contact: "علی محمدی", phone: "0912-2223344", type: "خروجی", duration: 180, date: "2026-05-09", status: "پاسخ داده" },
          { contact: "ناشناس", phone: "0912-3334455", type: "ورودی", duration: 0, date: "2026-05-10", status: "بی‌پاسخ" },
        ],
      },
      {
        key: "notes",
        label: "یادداشت‌ها",
        icon: StickyNote,
        itemLabel: "یادداشت",
        columns: [
          { field: "title", headerName: "عنوان", filterType: "text" },
          { field: "category", headerName: "دسته", filterType: "set" },
          { field: "priority", headerName: "اولویت", filterType: "set" },
          { field: "createdAt", headerName: "تاریخ", filterType: "date" },
          { field: "owner", headerName: "ایجاد توسط", filterType: "text" },
        ],
        rows: [
          { title: "پیگیری ارسال فاکتور", category: "اداری", priority: "بالا", createdAt: "2026-05-05", owner: "منشی" },
          { title: "آماده‌سازی گزارش هفتگی", category: "گزارش‌گیری", priority: "متوسط", createdAt: "2026-05-06", owner: "منشی" },
        ],
      },
      {
        key: "tasks",
        label: "وظایف",
        icon: ClipboardCheck,
        itemLabel: "وظیفه",
        columns: [
          { field: "title", headerName: "عنوان وظیفه", filterType: "text" },
          { field: "assignee", headerName: "مسئول", filterType: "set" },
          { field: "due", headerName: "مهلت", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { title: "هماهنگی جلسه ماهیانه", assignee: "منشی", due: "2026-05-14", status: "در حال انجام" },
          { title: "آرشیو مکاتبات فروردین", assignee: "منشی", due: "2026-05-18", status: "باز" },
        ],
      },
    ],
  },

  marketer: {
    label: "ایجنت بازاریاب",
    description: "مدیریت لیدها، کمپین‌ها و عملکرد فروش",
    agentsColumns: [
      ...agentsBaseColumns.slice(0, 5),
      { field: "activeCampaigns", headerName: "کمپین فعال", filterType: "number" },
      agentsBaseColumns[5],
    ],
    agents: [
      { id: "MA-1", name: "بازاریاب کمپین بهار", business: "خدمات گاما", plan: "حرفه‌ای", purchasedAt: "2026-04-12", remainingTokens: 9800, activeCampaigns: 3, status: "فعال" },
      { id: "MA-2", name: "بازاریاب فروشگاه آلفا", business: "فروشگاه آلفا", plan: "استاندارد", purchasedAt: "2026-03-08", remainingTokens: 42000, activeCampaigns: 2, status: "فعال" },
      { id: "MA-3", name: "بازاریاب انبار بتا", business: "انبار بتا", plan: "پایه", purchasedAt: "2026-02-22", remainingTokens: 0, activeCampaigns: 0, status: "غیرفعال" },
      { id: "MA-4", name: "بازاریاب نوروزی", business: "خدمات گاما", plan: "حرفه‌ای", purchasedAt: "2026-01-30", remainingTokens: 128000, activeCampaigns: 4, status: "فعال" },
    ],
    subMenus: [
      {
        key: "leads",
        label: "لیدها",
        icon: Users,
        itemLabel: "لید",
        columns: [
          { field: "name", headerName: "نام لید", filterType: "text" },
          { field: "phone", headerName: "تلفن", filterType: "text" },
          { field: "source", headerName: "منبع", filterType: "set" },
          { field: "stage", headerName: "مرحله", filterType: "set" },
          { field: "score", headerName: "امتیاز", filterType: "number" },
          { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
        ],
        rows: [
          { name: "حسین رحیمی", phone: "0912-3334441", source: "اینستاگرام", stage: "تماس اولیه", score: 78, createdAt: "2026-04-22" },
          { name: "زهرا قاسمی", phone: "0912-3334442", source: "گوگل ادز", stage: "مذاکره", score: 65, createdAt: "2026-04-28" },
          { name: "علی محمدی", phone: "0912-3334443", source: "ایمیل", stage: "بسته شده - برد", score: 92, createdAt: "2026-05-01" },
          { name: "مریم حسنی", phone: "0912-3334444", source: "ارجاع", stage: "بسته شده - باخت", score: 40, createdAt: "2026-05-03" },
        ],
      },
      {
        key: "campaigns",
        label: "کمپین‌ها",
        icon: Megaphone,
        itemLabel: "کمپین",
        columns: [
          { field: "name", headerName: "نام کمپین", filterType: "text" },
          { field: "channel", headerName: "کانال", filterType: "set" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
          { field: "budget", headerName: "بودجه (تومان)", filterType: "number" },
          { field: "leads", headerName: "تعداد لید", filterType: "number" },
          { field: "startedAt", headerName: "تاریخ شروع", filterType: "date" },
        ],
        rows: [
          { name: "کمپین بهار ۱۴۰۵", channel: "اینستاگرام", status: "فعال", budget: 12000000, leads: 124, startedAt: "2026-03-21" },
          { name: "تخفیف نوروز", channel: "گوگل ادز", status: "پایان یافته", budget: 8000000, leads: 89, startedAt: "2026-02-15" },
          { name: "محصول جدید X", channel: "ایمیل", status: "فعال", budget: 4500000, leads: 41, startedAt: "2026-04-10" },
        ],
      },
      {
        key: "markets",
        label: "بازارها",
        icon: Map,
        itemLabel: "بازار",
        columns: [
          { field: "name", headerName: "نام بازار", filterType: "text" },
          { field: "region", headerName: "منطقه", filterType: "set" },
          { field: "size", headerName: "حجم بازار", filterType: "number" },
          { field: "share", headerName: "سهم (٪)", filterType: "number" },
          { field: "priority", headerName: "اولویت", filterType: "set" },
        ],
        rows: [
          { name: "تهران مرکزی", region: "تهران", size: 850000, share: 18, priority: "بالا" },
          { name: "اصفهان", region: "اصفهان", size: 320000, share: 9, priority: "متوسط" },
          { name: "مشهد", region: "خراسان رضوی", size: 410000, share: 12, priority: "بالا" },
        ],
      },
      {
        key: "performance",
        label: "عملکرد",
        icon: Activity,
        itemLabel: "شاخص",
        columns: [
          { field: "metric", headerName: "شاخص", filterType: "text" },
          { field: "value", headerName: "مقدار", filterType: "number" },
          { field: "target", headerName: "هدف", filterType: "number" },
          { field: "delta", headerName: "تغییر", filterType: "text" },
          { field: "period", headerName: "بازه", filterType: "set" },
        ],
        rows: [
          { metric: "نرخ تبدیل لید", value: 18, target: 25, delta: "▲ ۳٪", period: "ماه جاری" },
          { metric: "هزینه جذب مشتری", value: 240000, target: 200000, delta: "▼ ۸٪", period: "ماه جاری" },
          { metric: "بازگشت سرمایه (ROI)", value: 312, target: 300, delta: "▲ ۱۲٪", period: "فصل جاری" },
        ],
      },
    ],
  },

  finance: {
    label: "ایجنت مالی/اداری",
    description: "مدیریت نامه‌ها، گزارشات و امور مالی-اداری",
    agentsColumns: agentsBaseColumns,
    agents: [
      { id: "FA-1", name: "مالی فروشگاه آلفا", business: "فروشگاه آلفا", plan: "حرفه‌ای", purchasedAt: "2026-01-22", remainingTokens: 158000, status: "فعال" },
      { id: "FA-2", name: "مالی خدمات گاما", business: "خدمات گاما", plan: "حرفه‌ای", purchasedAt: "2026-02-10", remainingTokens: 92000, status: "فعال" },
      { id: "FA-3", name: "مالی انبار بتا", business: "انبار بتا", plan: "استاندارد", purchasedAt: "2026-03-18", remainingTokens: 27000, status: "فعال" },
    ],
    subMenus: [
      {
        key: "letters",
        label: "نامه‌ها",
        icon: Mail,
        itemLabel: "نامه",
        columns: [
          { field: "number", headerName: "شماره نامه", filterType: "text" },
          { field: "subject", headerName: "موضوع", filterType: "text" },
          { field: "to", headerName: "گیرنده", filterType: "text" },
          { field: "type", headerName: "نوع", filterType: "set" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { number: "L-2026-001", subject: "اعلام تغییر ساعت کاری", to: "همه پرسنل", type: "داخلی", date: "2026-04-10", status: "ارسال شده" },
          { number: "L-2026-002", subject: "قرارداد همکاری", to: "شرکت بهار", type: "خارجی", date: "2026-04-22", status: "پیش‌نویس" },
          { number: "L-2026-003", subject: "اطلاعیه مالیاتی", to: "اداره دارایی", type: "خارجی", date: "2026-05-02", status: "ارسال شده" },
        ],
      },
      {
        key: "reports",
        label: "گزارشات",
        icon: FileBarChart2,
        itemLabel: "گزارش",
        columns: [
          { field: "title", headerName: "عنوان گزارش", filterType: "text" },
          { field: "period", headerName: "دوره", filterType: "set" },
          { field: "type", headerName: "نوع", filterType: "set" },
          { field: "createdAt", headerName: "تاریخ تولید", filterType: "date" },
          { field: "owner", headerName: "تهیه‌کننده", filterType: "text" },
        ],
        rows: [
          { title: "صورت سود و زیان", period: "فصل اول ۱۴۰۵", type: "مالی", createdAt: "2026-04-15", owner: "بخش مالی" },
          { title: "ترازنامه", period: "فصل اول ۱۴۰۵", type: "مالی", createdAt: "2026-04-15", owner: "بخش مالی" },
          { title: "گزارش حقوق و دستمزد", period: "اردیبهشت ۱۴۰۵", type: "اداری", createdAt: "2026-05-01", owner: "منابع انسانی" },
        ],
      },
      {
        key: "transactions",
        label: "تراکنش‌های مالی",
        icon: Receipt,
        itemLabel: "تراکنش",
        columns: [
          { field: "id", headerName: "شناسه", filterType: "text" },
          { field: "type", headerName: "نوع", filterType: "set" },
          { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
          { field: "account", headerName: "حساب", filterType: "set" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { id: "FT-9001", type: "واریز", amount: 12000000, account: "بانک ملت", date: "2026-04-25", status: "تأیید شده" },
          { id: "FT-9002", type: "برداشت", amount: 3500000, account: "صندوق", date: "2026-04-28", status: "تأیید شده" },
          { id: "FT-9003", type: "انتقال", amount: 8000000, account: "بانک پاسارگاد", date: "2026-05-02", status: "در انتظار" },
        ],
      },
      {
        key: "ledger",
        label: "اسناد حسابداری",
        icon: BookOpen,
        itemLabel: "سند حسابداری",
        columns: [
          { field: "voucher", headerName: "شماره سند", filterType: "text" },
          { field: "description", headerName: "شرح", filterType: "text" },
          { field: "debit", headerName: "بدهکار", filterType: "number" },
          { field: "credit", headerName: "بستانکار", filterType: "number" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
        ],
        rows: [
          { voucher: "V-1042", description: "فروش نقدی فروردین", debit: 0, credit: 18500000, date: "2026-04-02" },
          { voucher: "V-1043", description: "خرید مواد اولیه", debit: 6200000, credit: 0, date: "2026-04-08" },
        ],
      },
      {
        key: "payroll",
        label: "حقوق و دستمزد",
        icon: Banknote,
        itemLabel: "فیش حقوق",
        columns: [
          { field: "employee", headerName: "پرسنل", filterType: "text" },
          { field: "position", headerName: "سمت", filterType: "set" },
          { field: "month", headerName: "ماه", filterType: "set" },
          { field: "gross", headerName: "حقوق ناخالص", filterType: "number" },
          { field: "net", headerName: "حقوق خالص", filterType: "number" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { employee: "سارا احمدی", position: "مدیر بازاریابی", month: "اردیبهشت", gross: 18000000, net: 15600000, status: "پرداخت شده" },
          { employee: "محمد کریمی", position: "حسابدار", month: "اردیبهشت", gross: 14000000, net: 12100000, status: "در انتظار" },
        ],
      },
    ],
  },

  procurement: {
    label: "ایجنت خرید/تدارکات",
    description: "مدیریت سفارش‌های خرید، تأمین‌کنندگان و انبار",
    agentsColumns: agentsBaseColumns,
    agents: [
      { id: "PR-1", name: "تدارکات فروشگاه آلفا", business: "فروشگاه آلفا", plan: "حرفه‌ای", purchasedAt: "2026-02-01", remainingTokens: 64000, status: "فعال" },
      { id: "PR-2", name: "تدارکات انبار بتا", business: "انبار بتا", plan: "حرفه‌ای", purchasedAt: "2026-02-25", remainingTokens: 110000, status: "فعال" },
      { id: "PR-3", name: "تدارکات خدمات گاما", business: "خدمات گاما", plan: "استاندارد", purchasedAt: "2026-03-12", remainingTokens: 0, status: "غیرفعال" },
    ],
    subMenus: [
      {
        key: "purchase-orders",
        label: "سفارش‌های خرید",
        icon: ShoppingBag,
        itemLabel: "سفارش خرید",
        columns: [
          { field: "id", headerName: "شماره سفارش", filterType: "text" },
          { field: "supplier", headerName: "تأمین‌کننده", filterType: "set" },
          { field: "items", headerName: "تعداد اقلام", filterType: "number" },
          { field: "total", headerName: "مبلغ (تومان)", filterType: "number" },
          { field: "createdAt", headerName: "تاریخ ثبت", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { id: "PO-7001", supplier: "شرکت آریا", items: 12, total: 48000000, createdAt: "2026-04-12", status: "ارسال شده" },
          { id: "PO-7002", supplier: "صنایع بهار", items: 5, total: 12500000, createdAt: "2026-04-20", status: "در انتظار تأیید" },
          { id: "PO-7003", supplier: "بازرگانی پارس", items: 20, total: 65000000, createdAt: "2026-05-01", status: "تحویل شده" },
        ],
      },
      {
        key: "suppliers",
        label: "تأمین‌کنندگان",
        icon: Truck,
        itemLabel: "تأمین‌کننده",
        columns: [
          { field: "name", headerName: "نام تأمین‌کننده", filterType: "text" },
          { field: "category", headerName: "دسته کالا", filterType: "set" },
          { field: "rating", headerName: "امتیاز (از ۵)", filterType: "number" },
          { field: "leadTime", headerName: "زمان تحویل (روز)", filterType: "number" },
          { field: "active", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { name: "شرکت آریا", category: "مواد اولیه", rating: 4.6, leadTime: 7, active: "فعال" },
          { name: "صنایع بهار", category: "بسته‌بندی", rating: 4.2, leadTime: 10, active: "فعال" },
          { name: "بازرگانی پارس", category: "تجهیزات", rating: 3.8, leadTime: 14, active: "غیرفعال" },
        ],
      },
      {
        key: "inventory",
        label: "موجودی انبار",
        icon: Boxes,
        itemLabel: "قلم موجودی",
        columns: [
          { field: "sku", headerName: "کد کالا", filterType: "text" },
          { field: "name", headerName: "نام کالا", filterType: "text" },
          { field: "category", headerName: "دسته", filterType: "set" },
          { field: "stock", headerName: "موجودی", filterType: "number" },
          { field: "reorderPoint", headerName: "نقطه سفارش مجدد", filterType: "number" },
          { field: "warehouse", headerName: "انبار", filterType: "set" },
        ],
        rows: [
          { sku: "SKU-001", name: "کارتن بسته‌بندی", category: "بسته‌بندی", stock: 480, reorderPoint: 200, warehouse: "انبار اصلی" },
          { sku: "SKU-002", name: "ماده اولیه A", category: "مواد اولیه", stock: 120, reorderPoint: 150, warehouse: "انبار اصلی" },
          { sku: "SKU-003", name: "قطعه یدکی B", category: "تجهیزات", stock: 35, reorderPoint: 40, warehouse: "انبار فرعی" },
        ],
      },
      {
        key: "contracts",
        label: "قراردادها",
        icon: FileSignature,
        itemLabel: "قرارداد",
        columns: [
          { field: "number", headerName: "شماره قرارداد", filterType: "text" },
          { field: "party", headerName: "طرف قرارداد", filterType: "text" },
          { field: "value", headerName: "ارزش (تومان)", filterType: "number" },
          { field: "startDate", headerName: "تاریخ شروع", filterType: "date" },
          { field: "endDate", headerName: "تاریخ پایان", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { number: "C-3001", party: "شرکت آریا", value: 180000000, startDate: "2026-01-01", endDate: "2026-12-29", status: "فعال" },
          { number: "C-3002", party: "صنایع بهار", value: 95000000, startDate: "2026-03-01", endDate: "2026-08-31", status: "فعال" },
        ],
      },
    ],
  },

  cashier: {
    label: "ایجنت فروشنده/صندوقدار",
    description: "مدیریت فروش، محصولات و صندوق",
    agentsColumns: agentsBaseColumns,
    agents: [
      { id: "CS-1", name: "صندوقدار شعبه ۱", business: "فروشگاه آلفا", plan: "حرفه‌ای", purchasedAt: "2026-02-05", remainingTokens: 240000, status: "فعال" },
      { id: "CS-2", name: "صندوقدار شعبه ۲", business: "فروشگاه آلفا", plan: "استاندارد", purchasedAt: "2026-03-18", remainingTokens: 88000, status: "فعال" },
      { id: "CS-3", name: "فروشنده خدمات گاما", business: "خدمات گاما", plan: "حرفه‌ای", purchasedAt: "2026-04-02", remainingTokens: 19000, status: "فعال" },
    ],
    subMenus: [
      {
        key: "sales",
        label: "فروش‌ها",
        icon: Receipt,
        itemLabel: "فروش",
        columns: [
          { field: "invoice", headerName: "شماره فاکتور", filterType: "text" },
          { field: "customer", headerName: "مشتری", filterType: "text" },
          { field: "items", headerName: "تعداد اقلام", filterType: "number" },
          { field: "total", headerName: "مبلغ (تومان)", filterType: "number" },
          { field: "paymentMethod", headerName: "روش پرداخت", filterType: "set" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
        ],
        rows: [
          { invoice: "S-10001", customer: "علی حسینی", items: 3, total: 1240000, paymentMethod: "کارت‌خوان", date: "2026-05-05" },
          { invoice: "S-10002", customer: "زهرا قاسمی", items: 1, total: 380000, paymentMethod: "نقد", date: "2026-05-06" },
          { invoice: "S-10003", customer: "مهمان", items: 5, total: 2150000, paymentMethod: "آنلاین", date: "2026-05-07" },
        ],
      },
      {
        key: "products",
        label: "محصولات",
        icon: Package,
        itemLabel: "محصول",
        columns: [
          { field: "sku", headerName: "کد", filterType: "text" },
          { field: "name", headerName: "نام محصول", filterType: "text" },
          { field: "category", headerName: "دسته", filterType: "set" },
          { field: "price", headerName: "قیمت (تومان)", filterType: "number" },
          { field: "stock", headerName: "موجودی", filterType: "number" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { sku: "P-001", name: "محصول الف", category: "خوراکی", price: 120000, stock: 240, status: "فعال" },
          { sku: "P-002", name: "محصول ب", category: "بهداشتی", price: 85000, stock: 180, status: "فعال" },
          { sku: "P-003", name: "محصول ج", category: "خانگی", price: 540000, stock: 0, status: "ناموجود" },
        ],
      },
      {
        key: "discounts",
        label: "تخفیف‌ها",
        icon: Tag,
        itemLabel: "تخفیف",
        columns: [
          { field: "code", headerName: "کد تخفیف", filterType: "text" },
          { field: "type", headerName: "نوع", filterType: "set" },
          { field: "value", headerName: "مقدار", filterType: "number" },
          { field: "usage", headerName: "تعداد استفاده", filterType: "number" },
          { field: "expiresAt", headerName: "تاریخ انقضا", filterType: "date" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { code: "SPRING20", type: "درصدی", value: 20, usage: 124, expiresAt: "2026-06-15", status: "فعال" },
          { code: "VIP50K", type: "مبلغی", value: 50000, usage: 38, expiresAt: "2026-07-01", status: "فعال" },
        ],
      },
      {
        key: "payments",
        label: "پرداخت‌ها",
        icon: CreditCard,
        itemLabel: "پرداخت",
        columns: [
          { field: "id", headerName: "شناسه", filterType: "text" },
          { field: "invoice", headerName: "فاکتور", filterType: "text" },
          { field: "amount", headerName: "مبلغ (تومان)", filterType: "number" },
          { field: "method", headerName: "روش", filterType: "set" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
          { field: "date", headerName: "تاریخ", filterType: "date" },
        ],
        rows: [
          { id: "PM-2001", invoice: "S-10001", amount: 1240000, method: "کارت‌خوان", status: "موفق", date: "2026-05-05" },
          { id: "PM-2002", invoice: "S-10002", amount: 380000, method: "نقد", status: "موفق", date: "2026-05-06" },
          { id: "PM-2003", invoice: "S-10003", amount: 2150000, method: "آنلاین", status: "موفق", date: "2026-05-07" },
        ],
      },
      {
        key: "shifts",
        label: "شیفت‌های صندوق",
        icon: Clock,
        itemLabel: "شیفت",
        columns: [
          { field: "shiftId", headerName: "شماره شیفت", filterType: "text" },
          { field: "cashier", headerName: "صندوقدار", filterType: "set" },
          { field: "startedAt", headerName: "شروع", filterType: "date" },
          { field: "endedAt", headerName: "پایان", filterType: "date" },
          { field: "totalSales", headerName: "جمع فروش (تومان)", filterType: "number" },
          { field: "status", headerName: "وضعیت", filterType: "set" },
        ],
        rows: [
          { shiftId: "SH-501", cashier: "صندوقدار شعبه ۱", startedAt: "2026-05-07", endedAt: "2026-05-07", totalSales: 18400000, status: "بسته" },
          { shiftId: "SH-502", cashier: "صندوقدار شعبه ۲", startedAt: "2026-05-08", endedAt: "2026-05-08", totalSales: 9200000, status: "بسته" },
          { shiftId: "SH-503", cashier: "صندوقدار شعبه ۱", startedAt: "2026-05-09", endedAt: "", totalSales: 6300000, status: "باز" },
        ],
      },
    ],
  },
};

export function getAgentTypeFromKey(menuKey: string): AgentTypeKey | null {
  const m = menuKey.match(/^agents\.(secretary|marketer|finance|procurement|cashier)$/);
  return (m?.[1] as AgentTypeKey) ?? null;
}
