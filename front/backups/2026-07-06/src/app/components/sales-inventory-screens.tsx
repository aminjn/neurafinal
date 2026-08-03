import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { toFa } from './data';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Line,
  Legend,
} from 'recharts';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

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
// SALES FUNNEL SCREEN
// ========================
interface FunnelStage {
  id: string;
  name: string;
  count: number;
  value: string;
  color: string;
  percentage: number;
  deals: { id: string; name: string; customer: string; value: string; days: number; probability: number }[];
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: 'lead', name: 'سرنخ', count: 24, value: '۴۸۰,۰۰۰,۰۰۰', color: '#8B5CF6', percentage: 100,
    deals: [
      { id: 'fd1', name: 'پروژه وب‌سایت شرکت آلفا', customer: 'شرکت آلفا', value: '۸۰,۰۰۰,۰۰۰', days: 2, probability: 15 },
      { id: 'fd2', name: 'طراحی اپلیکیشن موبایل', customer: 'فروشگاه سامان', value: '۱۲۰,۰۰۰,۰۰۰', days: 5, probability: 20 },
      { id: 'fd3', name: 'سیستم حسابداری ابری', customer: 'شرکت نوآوران', value: '۶۵,۰۰۰,۰۰۰', days: 1, probability: 10 },
    ],
  },
  {
    id: 'qualified', name: 'واجد شرایط', count: 16, value: '۳۲۰,۰۰۰,۰۰۰', color: '#3B82F6', percentage: 67,
    deals: [
      { id: 'fd4', name: 'خدمات سئو ماهانه', customer: 'فروشگاه آنلاین مهر', value: '۳۵,۰۰۰,۰۰۰', days: 8, probability: 35 },
      { id: 'fd5', name: 'پشتیبانی سالانه سرور', customer: 'بیمه پارسیان', value: '۹۰,۰۰۰,۰۰۰', days: 12, probability: 40 },
    ],
  },
  {
    id: 'proposal', name: 'ارائه پیشنهاد', count: 9, value: '۲۱۰,۰۰۰,۰۰۰', color: '#F59E0B', percentage: 38,
    deals: [
      { id: 'fd6', name: 'سیستم مدیریت انبار', customer: 'پخش البرز', value: '۱۵۰,۰۰۰,۰۰۰', days: 15, probability: 55 },
      { id: 'fd7', name: 'بسته آموزشی آنلاین', customer: 'آموزشگاه نور', value: '۴۵,۰۰۰,۰۰۰', days: 10, probability: 50 },
    ],
  },
  {
    id: 'negotiation', name: 'مذاکره', count: 5, value: '۱۵۰,۰۰۰,۰۰۰', color: '#F97316', percentage: 21,
    deals: [
      { id: 'fd8', name: 'قرارداد نگهداری شبکه', customer: 'گروه صنعتی بهمن', value: '۱۰۰,۰۰۰,۰۰۰', days: 20, probability: 75 },
    ],
  },
  {
    id: 'closed', name: 'نهایی شده', count: 3, value: '۹۵,۰۰۰,۰۰۰', color: '#10B981', percentage: 12,
    deals: [
      { id: 'fd9', name: 'طراحی لوگو و برند', customer: 'استارتاپ زیبا', value: '۲۵,۰۰۰,۰۰۰', days: 30, probability: 100 },
      { id: 'fd10', name: 'لایسنس نرم‌افزار', customer: 'شرکت رایان', value: '۷۰,۰۰۰,۰۰۰', days: 25, probability: 100 },
    ],
  },
];

export function SalesFunnelScreen() {
  const { openModal, showToast } = useApp();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const totalValue = '۴۸۰,۰۰۰,۰۰۰';
  const totalDeals = FUNNEL_STAGES.reduce((acc, s) => acc + s.count, 0);
  const conversionRate = '۱۲.۵';

  return (
    <div className="flex flex-col h-full">
      {/* Summary Cards */}
      <motion.div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[18px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(totalDeals)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">کل فرصت‌ها</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[14px] text-[#10b981]" style={{ fontWeight: 700 }}>{totalValue}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">ارزش کل (ریال)</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[18px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{conversionRate}٪</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">نرخ تبدیل</div>
        </motion.div>
      </motion.div>

      {/* Funnel Visual */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {FUNNEL_STAGES.map((stage, idx) => (
            <motion.div key={stage.id} variants={fadeInUp} className="mb-2">
              {/* Stage Bar */}
              <div
                className="rounded-[10px] p-3.5 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
                style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}
                onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm" style={{ fontWeight: 600 }}>{stage.name}</span>
                    <span className="text-[11px] text-[var(--aw-text-muted)]">({toFa(stage.count)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--aw-text-secondary)]" style={{ fontWeight: 600 }}>{stage.value} ریال</span>
                    <i className={`fa-solid fa-chevron-down text-[10px] text-[var(--aw-text-muted)] transition-transform ${expandedStage === stage.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {/* Funnel bar */}
                <div className="relative">
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: stage.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.percentage}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                    />
                  </div>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] text-[var(--aw-text-muted)] pr-1">{toFa(stage.percentage)}٪</span>
                </div>
              </div>

              {/* Expanded Deals */}
              <AnimatePresence>
                {expandedStage === stage.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1.5 space-y-1.5">
                      {stage.deals.map(deal => (
                        <div
                          key={deal.id}
                          className="rounded-[10px] p-3 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)] mr-4"
                          style={{ background: 'var(--aw-bg-input)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(deal.name, (
                              <div className="space-y-3 text-[13px]">
                                <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">مشتری:</span><span>{deal.customer}</span></div>
                                <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">ارزش:</span><span>{deal.value} ریال</span></div>
                                <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">مرحله:</span><span style={{ color: stage.color }}>{stage.name}</span></div>
                                <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">مدت در این مرحله:</span><span>{toFa(deal.days)} روز</span></div>
                                <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">احتمال موفقیت:</span><span>{toFa(deal.probability)}٪</span></div>
                                <button className="w-full mt-3 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: stage.color, fontWeight: 600 }} onClick={() => showToast('انتقال به مرحله بعد')}>
                                  <i className="fa-solid fa-arrow-left ml-2" />انتقال به مرحله بعد
                                </button>
                              </div>
                            ));
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[12px]" style={{ fontWeight: 600 }}>{deal.name}</span>
                            <span className="text-[11px]" style={{ color: stage.color, fontWeight: 600 }}>{toFa(deal.probability)}٪</span>
                          </div>
                          <div className="flex justify-between items-center mt-1 text-[11px] text-[var(--aw-text-muted)]">
                            <span><i className="fa-solid fa-building ml-1" />{deal.customer}</span>
                            <span>{deal.value} ریال</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Funnel Chart */}
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="rounded-[10px] p-4 border border-[var(--aw-border)] mt-3" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <h3 className="text-[13px] mb-3 text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>نمودار قیف فروش</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FUNNEL_STAGES.map(s => ({ name: s.name, value: s.count, fill: s.color }))} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--aw-text-secondary)', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {FUNNEL_STAGES.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

// ========================
// SALES FORECAST SCREEN
// ========================
interface ForecastMonth {
  month: string;
  actual: number;
  forecast: number;
  target: number;
}

const FORECAST_DATA: ForecastMonth[] = [
  { month: 'فروردین', actual: 180, forecast: 170, target: 200 },
  { month: 'اردیبهشت', actual: 220, forecast: 210, target: 200 },
  { month: 'خرداد', actual: 195, forecast: 200, target: 220 },
  { month: 'تیر', actual: 250, forecast: 240, target: 230 },
  { month: 'مرداد', actual: 210, forecast: 220, target: 240 },
  { month: 'شهریور', actual: 280, forecast: 270, target: 250 },
  { month: 'مهر', actual: 0, forecast: 300, target: 280 },
  { month: 'آبان', actual: 0, forecast: 320, target: 300 },
  { month: 'آذر', actual: 0, forecast: 290, target: 310 },
];

interface ForecastProduct {
  id: string;
  name: string;
  currentSales: string;
  forecastSales: string;
  trend: 'up' | 'down' | 'stable';
  growth: string;
  confidence: number;
}

const FORECAST_PRODUCTS: ForecastProduct[] = [
  { id: 'fp1', name: 'خدمات طراحی وب', currentSales: '۱۲۰,۰۰۰,۰۰۰', forecastSales: '۱۵۰,۰۰۰,۰۰۰', trend: 'up', growth: '+۲۵٪', confidence: 85 },
  { id: 'fp2', name: 'پشتیبانی فنی', currentSales: '۸۵,۰۰۰,۰۰۰', forecastSales: '۹۲,۰۰۰,۰۰۰', trend: 'up', growth: '+۸٪', confidence: 90 },
  { id: 'fp3', name: 'مشاوره IT', currentSales: '۶۰,۰۰۰,۰۰۰', forecastSales: '۵۵,۰۰۰,۰۰۰', trend: 'down', growth: '-۸٪', confidence: 70 },
  { id: 'fp4', name: 'لایسنس نرم‌افزار', currentSales: '۲۰۰,۰۰۰,۰۰۰', forecastSales: '۲۳۰,۰۰۰,۰۰۰', trend: 'up', growth: '+۱۵٪', confidence: 78 },
  { id: 'fp5', name: 'آموزش سازمانی', currentSales: '۴۵,۰۰۰,۰۰۰', forecastSales: '۴۵,۰۰۰,۰۰۰', trend: 'stable', growth: '۰٪', confidence: 65 },
];

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  up: { icon: 'fa-solid fa-arrow-trend-up', color: '#10b981' },
  down: { icon: 'fa-solid fa-arrow-trend-down', color: '#ef4444' },
  stable: { icon: 'fa-solid fa-minus', color: '#f59e0b' },
};

export function SalesForecastScreen() {
  const { openModal } = useApp();
  const [view, setView] = useState<'chart' | 'products'>('chart');

  const totalForecast = '۱,۲۵۵,۰۰۰,۰۰۰';
  const avgGrowth = '+۱۲٪';
  const avgConfidence = '۷۸';

  return (
    <div className="flex flex-col h-full">
      {/* Summary Cards */}
      <motion.div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[13px] text-[#10b981]" style={{ fontWeight: 700 }}>{totalForecast}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">پیش‌بینی سال (ریال)</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[18px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{avgGrowth}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">رشد میانگین</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[18px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{avgConfidence}٪</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">اطمینان</div>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 py-2 flex-shrink-0">
        <button
          className={`py-2 px-3.5 rounded-[20px] border text-[11px] cursor-pointer transition-all ${
            view === 'chart' ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
          }`}
          style={view === 'chart' ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
          onClick={() => setView('chart')}
        >
          <i className="fa-solid fa-chart-area ml-1" />نمودار روند
        </button>
        <button
          className={`py-2 px-3.5 rounded-[20px] border text-[11px] cursor-pointer transition-all ${
            view === 'products' ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
          }`}
          style={view === 'products' ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
          onClick={() => setView('products')}
        >
          <i className="fa-solid fa-boxes-stacked ml-1" />محصولات
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
        {view === 'chart' && (
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            {/* Main Forecast Chart */}
            <motion.div variants={fadeInUp} className="rounded-[10px] p-4 border border-[var(--aw-border)] mb-3" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
              <h3 className="text-[13px] mb-3 text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>روند فروش و پیش‌بینی (میلیون ریال)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={FORECAST_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--aw-border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--aw-text-muted)', fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="actual" name="فروش واقعی" stroke="#10B981" fill="rgba(16,185,129,0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="forecast" name="پیش‌بینی" stroke="#3B82F6" fill="rgba(59,130,246,0.1)" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="target" name="هدف" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Quarterly Breakdown */}
            <motion.div variants={fadeInUp} className="rounded-[10px] p-4 border border-[var(--aw-border)] mb-3" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
              <h3 className="text-[13px] mb-3 text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>عملکرد فصلی</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { q: 'بهار', actual: '۵۹۵', target: '۶۲۰', pct: 96, color: '#10b981' },
                  { q: 'تابستان', actual: '۷۴۰', target: '۷۲۰', pct: 103, color: '#3B82F6' },
                  { q: 'پاییز (پیش‌بینی)', actual: '۹۱۰', target: '۸۹۰', pct: 102, color: '#8B5CF6' },
                  { q: 'زمستان (پیش‌بینی)', actual: '۸۵۰', target: '۹۰۰', pct: 94, color: '#F59E0B' },
                ].map(item => (
                  <div key={item.q} className="rounded-[10px] p-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
                    <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">{item.q}</div>
                    <div className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.actual}M</div>
                    <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--aw-bg-app)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.pct)}%`, background: item.color }} />
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: item.pct >= 100 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {toFa(item.pct)}٪ از هدف
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'products' && (
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            {FORECAST_PRODUCTS.map(product => (
              <motion.div
                key={product.id}
                variants={fadeInUp}
                className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
                style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}
                onClick={() => openModal(product.name, (
                  <div className="space-y-3 text-[13px]">
                    <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">فروش فعلی:</span><span>{product.currentSales} ریال</span></div>
                    <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">پیش‌بینی فروش:</span><span>{product.forecastSales} ریال</span></div>
                    <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">رشد:</span><span style={{ color: TREND_ICONS[product.trend].color }}>{product.growth}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">اطمینان پیش‌بینی:</span><span>{toFa(product.confidence)}٪</span></div>
                    <div className="mt-2">
                      <div className="text-[11px] text-[var(--aw-text-muted)] mb-1">سطح اطمینان</div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}>
                        <div className="h-full rounded-full" style={{ width: `${product.confidence}%`, background: product.confidence >= 80 ? '#10b981' : product.confidence >= 60 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>
                  </div>
                ))}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ fontWeight: 600 }}>{product.name}</span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: TREND_ICONS[product.trend].color, fontWeight: 600 }}>
                    <i className={TREND_ICONS[product.trend].icon} />
                    {product.growth}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--aw-text-secondary)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-coins text-[var(--aw-text-muted)]" /> فعلی: {product.currentSales}</span>
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-chart-line text-[var(--aw-text-muted)]" /> پیش‌بینی: {product.forecastSales}</span>
                  </div>
                </div>
                {/* Confidence bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-[var(--aw-text-muted)] mb-0.5">
                    <span>اطمینان</span>
                    <span>{toFa(product.confidence)}٪</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${product.confidence}%`,
                        background: product.confidence >= 80 ? '#10b981' : product.confidence >= 60 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ========================
// INVENTORY SCREEN (Procurement)
// ========================
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  price: string;
  location: string;
  lastUpdated: string;
  status: 'sufficient' | 'low' | 'critical';
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'کاغذ A4 (بسته ۵۰۰ برگی)', category: 'لوازم اداری', quantity: 45, unit: 'بسته', minStock: 20, price: '۲۸۰,۰۰۰', location: 'انبار اصلی', lastUpdated: '۱۴۰۴/۱۲/۰۱', status: 'sufficient' },
  { id: 'inv2', name: 'کارتریج پرینتر HP', category: 'لوازم IT', quantity: 3, unit: 'عدد', minStock: 5, price: '۱,۸۰۰,۰۰۰', location: 'انبار IT', lastUpdated: '۱۴۰۴/۱۱/۲۸', status: 'low' },
  { id: 'inv3', name: 'روغن موتور صنعتی', category: 'مواد مصرفی', quantity: 12, unit: 'لیتر', minStock: 50, price: '۴۵۰,۰۰۰', location: 'انبار فنی', lastUpdated: '۱۴۰۴/۱۱/۲۵', status: 'critical' },
  { id: 'inv4', name: 'دستکش کار ایمنی', category: 'ایمنی', quantity: 120, unit: 'جفت', minStock: 30, price: '۸۵,۰۰۰', location: 'انبار اصلی', lastUpdated: '۱۴۰۴/۱۲/۰۲', status: 'sufficient' },
  { id: 'inv5', name: 'پیچ و مهره M8', category: 'قطعات', quantity: 8, unit: 'بسته', minStock: 15, price: '۳۲۰,۰۰۰', location: 'انبار فنی', lastUpdated: '۱۴۰۴/۱۱/۳۰', status: 'low' },
  { id: 'inv6', name: 'کابل شبکه Cat6 (متری)', category: 'لوازم IT', quantity: 200, unit: 'متر', minStock: 50, price: '۱۵,۰۰۰', location: 'انبار IT', lastUpdated: '۱۴۰۴/۱۲/۰۱', status: 'sufficient' },
  { id: 'inv7', name: 'لامپ LED صنعتی', category: 'برقی', quantity: 2, unit: 'عدد', minStock: 10, price: '۵۵۰,۰۰۰', location: 'انبار فنی', lastUpdated: '۱۴۰۴/۱۱/۲۰', status: 'critical' },
  { id: 'inv8', name: 'ماسک تنفسی FFP2', category: 'ایمنی', quantity: 85, unit: 'عدد', minStock: 50, price: '۴۵,۰۰۰', location: 'انبار اصلی', lastUpdated: '۱۴۰۴/۱۲/۰۲', status: 'sufficient' },
];

const INV_STATUS_LABELS: Record<string, string> = { sufficient: 'کافی', low: 'کم', critical: 'بحرانی' };
const INV_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  sufficient: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  low: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  critical: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
};

// ---- Warehouse movements (inbound receipts / outbound issues) ----
interface StockMove {
  id: string; code: string; item: string; qty: number; unit: string;
  party: string; date: string; time: string; ref: string; user: string;
}
const INBOUND_MOVES: StockMove[] = [
  { id: 'in1', code: 'IN-۲۰۵۱', item: 'نوشابه خانواده', qty: 240, unit: 'بطری', party: 'پخش سراسری آریا', date: 'امروز', time: '۰۹:۱۵', ref: 'PO-۲۰۴۴', user: 'حسین نوری' },
  { id: 'in2', code: 'IN-۲۰۵۰', item: 'روغن سرخ‌کردنی', qty: 60, unit: 'حلب', party: 'لبنیات پگاه', date: 'امروز', time: '۰۸:۴۰', ref: 'PO-۲۰۴۳', user: 'حسین نوری' },
  { id: 'in3', code: 'IN-۲۰۴۹', item: 'نان فانتزی', qty: 120, unit: 'بسته', party: 'نان فانتزی سحر', date: 'دیروز', time: '۱۷:۲۰', ref: 'PO-۲۰۴۱', user: 'زهرا صادقی' },
  { id: 'in4', code: 'IN-۲۰۴۸', item: 'پنیر پیتزا', qty: 45, unit: 'کیلو', party: 'لبنیات پگاه', date: 'دیروز', time: '۱۰:۰۵', ref: 'PO-۲۰۴۰', user: 'حسین نوری' },
  { id: 'in5', code: 'IN-۲۰۴۷', item: 'سیب‌زمینی منجمد', qty: 80, unit: 'کیلو', party: 'پخش سراسری آریا', date: '۲ روز پیش', time: '۱۴:۳۰', ref: 'PO-۲۰۳۹', user: 'زهرا صادقی' },
];
const OUTBOUND_MOVES: StockMove[] = [
  { id: 'out1', code: 'OUT-۳۱۲۰', item: 'نوشابه خانواده', qty: 36, unit: 'بطری', party: 'فروش صندوق ۱', date: 'امروز', time: '۱۳:۵۰', ref: 'فاکتور ۱۰۸۸', user: 'مریم رضایی' },
  { id: 'out2', code: 'OUT-۳۱۱۹', item: 'پنیر پیتزا', qty: 12, unit: 'کیلو', party: 'آشپزخانه', date: 'امروز', time: '۱۲:۱۰', ref: 'حواله داخلی', user: 'آشپز ارشد' },
  { id: 'out3', code: 'OUT-۳۱۱۸', item: 'روغن سرخ‌کردنی', qty: 8, unit: 'حلب', party: 'آشپزخانه', date: 'امروز', time: '۱۰:۳۰', ref: 'حواله داخلی', user: 'آشپز ارشد' },
  { id: 'out4', code: 'OUT-۳۱۱۷', item: 'نان فانتزی', qty: 40, unit: 'بسته', party: 'فروش صندوق ۲', date: 'دیروز', time: '۱۹:۰۰', ref: 'فاکتور ۱۰۸۵', user: 'مریم رضایی' },
  { id: 'out5', code: 'OUT-۳۱۱۶', item: 'سیب‌زمینی منجمد', qty: 25, unit: 'کیلو', party: 'ضایعات (انقضا)', date: '۲ روز پیش', time: '۰۹:۴۵', ref: 'حواله ضایعات', user: 'حسین نوری' },
];

function StockMovesView({ kind }: { kind: 'in' | 'out' }) {
  const { showToast, openModal } = useApp();
  const [search, setSearch] = useState('');
  const isIn = kind === 'in';
  const moves = (isIn ? INBOUND_MOVES : OUTBOUND_MOVES).filter(m => !search || m.item.includes(search) || m.party.includes(search) || m.code.includes(search));
  const accent = isIn ? '#10b981' : '#ef4444';
  const accentBg = isIn ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)';
  const totalQty = (isIn ? INBOUND_MOVES : OUTBOUND_MOVES).reduce((s, m) => s + m.qty, 0);
  const todayCount = (isIn ? INBOUND_MOVES : OUTBOUND_MOVES).filter(m => m.date === 'امروز').length;

  return (
    <div className="flex flex-col h-full">
      <motion.div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[20px]" style={{ color: accent, fontWeight: 700 }}>{toFa((isIn ? INBOUND_MOVES : OUTBOUND_MOVES).length)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">{isIn ? 'کل رسیدها' : 'کل حواله‌ها'}</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[20px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(totalQty)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">مجموع اقلام</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[20px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{toFa(todayCount)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">امروز</div>
        </motion.div>
      </motion.div>

      <div className="px-4 pb-2">
        <button className="w-full flex items-center gap-3 p-3 mb-2 rounded-2xl border cursor-pointer transition-all" style={{ background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' }}
          onClick={() => openModal(isIn ? 'ثبت رسید انبار' : 'ثبت حواله خروج', <StockMoveForm kind={kind} onDone={() => showToast(isIn ? 'رسید انبار ثبت شد ✅' : 'حواله خروج ثبت شد ✅', 'success')} />)}>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))' }}>
            <i className={`fa-solid ${isIn ? 'fa-arrow-down-to-bracket' : 'fa-arrow-up-from-bracket'} text-white text-[14px]`} />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[13px]" style={{ fontWeight: 700, color: 'var(--aw-primary)' }}>{isIn ? 'ثبت رسید ورود کالا' : 'ثبت حواله خروج کالا'}</div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">{isIn ? 'افزودن کالای دریافتی به انبار' : 'کسر کالا از موجودی انبار'}</div>
          </div>
          <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--aw-primary)' }} />
        </button>
        <div className="relative">
          <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-[var(--aw-text-muted)] text-xs" />
          <input className="w-full py-2.5 pr-9 pl-3 rounded-[12px] border border-[var(--aw-border)] text-sm text-[var(--aw-text-primary)] placeholder-[var(--aw-text-muted)]"
            style={{ background: 'var(--aw-bg-input)', fontWeight: 500 }} placeholder={isIn ? 'جستجوی رسید...' : 'جستجوی حواله...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {moves.map(m => (
            <motion.div key={m.id} variants={fadeInUp} className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)]" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
                  <i className={`fa-solid ${isIn ? 'fa-arrow-down' : 'fa-arrow-up'} text-[14px]`} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[13px]" style={{ fontWeight: 700 }}>{m.item}</span>
                    <span className="text-[13px]" style={{ color: accent, fontWeight: 700 }}>{isIn ? '+' : '−'}{toFa(m.qty)} {m.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--aw-text-secondary)]"><i className={`fa-solid ${isIn ? 'fa-truck-ramp-box' : 'fa-store'} text-[9px] ml-1 text-[var(--aw-text-muted)]`} />{m.party}</span>
                    <span className="text-[10px] text-[var(--aw-primary)]" style={{ fontWeight: 600 }}>{m.code}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[var(--aw-border)] text-[10px] text-[var(--aw-text-muted)]">
                <span><i className="fa-solid fa-clock text-[9px] ml-1" />{m.date} · {m.time}</span>
                <span><i className="fa-solid fa-file-lines text-[9px] ml-1" />{m.ref}</span>
                <span><i className="fa-solid fa-user text-[9px] ml-1" />{m.user}</span>
              </div>
            </motion.div>
          ))}
          {moves.length === 0 && (
            <div className="text-center py-12 text-[var(--aw-text-muted)]">
              <i className={`fa-solid ${isIn ? 'fa-arrow-down-to-bracket' : 'fa-arrow-up-from-bracket'} text-3xl mb-3 block opacity-40`} />
              <p className="text-sm">موردی یافت نشد</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StockMoveForm({ kind, onDone }: { kind: 'in' | 'out'; onDone: () => void }) {
  const { closeModal } = useApp();
  const isIn = kind === 'in';
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [party, setParty] = useState('');
  const submit = () => { onDone(); closeModal(); };
  return (
    <div className="p-4 space-y-3">
      <div>
        <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>نام کالا</label>
        <input autoFocus value={item} onChange={e => setItem(e.target.value)} placeholder="مثلاً نوشابه خانواده" className="w-full py-2.5 px-3 rounded-[12px] border border-[var(--aw-border)] text-sm text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-input)' }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>تعداد</label>
          <input value={qty} onChange={e => setQty(e.target.value)} inputMode="numeric" placeholder="۰" className="w-full py-2.5 px-3 rounded-[12px] border border-[var(--aw-border)] text-sm text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-input)' }} />
        </div>
        <div>
          <label className="text-[12px] mb-1.5 block" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{isIn ? 'تأمین‌کننده' : 'مقصد / گیرنده'}</label>
          <input value={party} onChange={e => setParty(e.target.value)} placeholder={isIn ? 'نام تأمین‌کننده' : 'صندوق / آشپزخانه'} className="w-full py-2.5 px-3 rounded-[12px] border border-[var(--aw-border)] text-sm text-[var(--aw-text-primary)]" style={{ background: 'var(--aw-bg-input)' }} />
        </div>
      </div>
      <button onClick={submit} className="w-full py-3 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'linear-gradient(135deg, var(--aw-primary-light), var(--aw-primary-dark))', fontWeight: 700 }}>
        <i className={`fa-solid ${isIn ? 'fa-arrow-down-to-bracket' : 'fa-arrow-up-from-bracket'} ml-1.5`} />{isIn ? 'ثبت رسید ورود' : 'ثبت حواله خروج'}
      </button>
    </div>
  );
}

export function InventoryScreen() {
  const { showToast, openModal } = useApp();
  const [invMode, setInvMode] = useState<'stock' | 'in' | 'out'>('stock');
  const [filter, setFilter] = useState<'all' | 'sufficient' | 'low' | 'critical'>('all');
  const [search, setSearch] = useState('');
  const [inventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  const filtered = inventory.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (search && !i.name.includes(search) && !i.category.includes(search)) return false;
    return true;
  });

  const totalItems = inventory.length;
  const lowCount = inventory.filter(i => i.status === 'low').length;
  const criticalCount = inventory.filter(i => i.status === 'critical').length;

  const filters = [
    { id: 'all' as const, label: 'همه' },
    { id: 'sufficient' as const, label: 'کافی' },
    { id: 'low' as const, label: 'کم' },
    { id: 'critical' as const, label: 'بحرانی' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Mode tabs: موجودی / ورودی / خروجی */}
      <div className="px-4 pt-3">
        <div className="flex gap-0.5 p-[3px] rounded-full border" style={{ background: 'var(--aw-eu-nav-bg)', borderColor: 'var(--aw-eu-nav-border)' }}>
          {([
            { id: 'stock' as const, label: 'موجودی', icon: 'fa-solid fa-boxes-stacked' },
            { id: 'in' as const, label: 'ورودی', icon: 'fa-solid fa-arrow-down-to-bracket' },
            { id: 'out' as const, label: 'خروجی', icon: 'fa-solid fa-arrow-up-from-bracket' },
          ]).map(t => {
            const active = invMode === t.id;
            return (
              <button key={t.id} onClick={() => setInvMode(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full border-none cursor-pointer text-[12px] transition-all"
                style={active ? { background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)', fontWeight: 700, boxShadow: 'inset 0 0 0 1px var(--aw-border), 0 2px 6px rgba(0,0,0,0.10)' } : { background: 'transparent', color: 'var(--aw-text-secondary)', fontWeight: 500 }}>
                <i className={`${t.icon} text-[11px]`} style={active ? { color: 'var(--aw-primary)' } : {}} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {invMode === 'in' && <StockMovesView kind="in" />}
      {invMode === 'out' && <StockMovesView kind="out" />}
      {invMode === 'stock' && (<>
      {/* Summary Cards act as filters: کل / کم / بحرانی */}
      <motion.div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'all' ? 'all' : 'all')} className="aw-no-pill rounded-[8px] p-3 border text-center cursor-pointer transition-all" style={filter === 'all' ? { background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[20px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(totalItems)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">کل اقلام</div>
        </motion.button>
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'low' ? 'all' : 'low')} className="aw-no-pill rounded-[8px] p-3 border text-center cursor-pointer transition-all" style={filter === 'low' ? { background: 'rgba(245,158,11,0.12)', borderColor: '#f59e0b' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[20px] text-[#f59e0b]" style={{ fontWeight: 700 }}>{toFa(lowCount)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">موجودی کم</div>
        </motion.button>
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')} className="aw-no-pill rounded-[8px] p-3 border text-center cursor-pointer transition-all" style={filter === 'critical' ? { background: 'rgba(239,68,68,0.12)', borderColor: '#ef4444' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[20px] text-[#ef4444]" style={{ fontWeight: 700 }}>{toFa(criticalCount)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">بحرانی</div>
        </motion.button>
      </motion.div>

      {/* Search only */}
      <div className="px-4 pb-2">
        <div className="relative">
          <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-[var(--aw-text-muted)] text-xs" />
          <input
            className="w-full py-2.5 pr-9 pl-3 rounded-[12px] border border-[var(--aw-border)] text-sm text-[var(--aw-text-primary)] placeholder-[var(--aw-text-muted)]"
            style={{ background: 'var(--aw-bg-input)', fontWeight: 500 }}
            placeholder="جستجوی کالا..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {filtered.map(item => (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
              style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}
              onClick={() => openModal(item.name, (
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">دسته‌بندی:</span><span>{item.category}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">موجودی فعلی:</span><span>{toFa(item.quantity)} {item.unit}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">حداقل موجودی:</span><span>{toFa(item.minStock)} {item.unit}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">قیمت واحد:</span><span>{item.price} ریال</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">محل نگهداری:</span><span>{item.location}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">آخرین به‌روزرسانی:</span><span>{item.lastUpdated}</span></div>
                  <button className="w-full mt-3 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: 'var(--aw-primary)', fontWeight: 600 }} onClick={() => showToast('درخواست خرید ثبت شد')}>
                    <i className="fa-solid fa-cart-plus ml-2" />ثبت درخواست خرید
                  </button>
                </div>
              ))}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ fontWeight: 600 }}>{item.name}</span>
                <span className="px-2.5 py-0.5 rounded-[20px] text-[10px]" style={{ background: INV_STATUS_COLORS[item.status].bg, color: INV_STATUS_COLORS[item.status].text, fontWeight: 600 }}>
                  {INV_STATUS_LABELS[item.status]}
                </span>
              </div>
              <div className="text-[12px] text-[var(--aw-text-secondary)] space-y-1">
                <div className="flex items-center gap-1.5"><i className="fa-solid fa-layer-group text-[var(--aw-text-muted)]" /> {item.category}</div>
                <div className="flex items-center gap-1.5"><i className="fa-solid fa-cubes text-[var(--aw-text-muted)]" /> موجودی: {toFa(item.quantity)} {item.unit}</div>
                <div className="flex items-center gap-1.5"><i className="fa-solid fa-location-dot text-[var(--aw-text-muted)]" /> {item.location}</div>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--aw-bg-input)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (item.quantity / item.minStock) * 100)}%`,
                      background: INV_STATUS_COLORS[item.status].text,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--aw-text-muted)]">
              <i className="fa-solid fa-box-open text-3xl mb-3 block opacity-40" />
              <p className="text-sm">کالایی یافت نشد</p>
            </div>
          )}
        </motion.div>
      </div>
      </>)}
    </div>
  );
}

// ========================
// PURCHASE REQUEST SCREEN (Procurement)
// ========================
interface PurchaseRequest {
  id: string;
  title: string;
  requester: string;
  department: string;
  items: string;
  quantity: string;
  estimatedCost: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'delivered';
  date: string;
  supplier: string;
  notes: string;
}

const INITIAL_PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: 'pr1', title: 'خرید کارتریج پرینتر', requester: 'محمد حسینی', department: 'IT', items: 'کارتریج HP 26A', quantity: '۱۰ عدد', estimatedCost: '۱۸,۰۰۰,۰۰۰', priority: 'high', status: 'approved', date: '۱۴۰۴/۱۲/۰۱', supplier: 'تأمین‌کالای البرز', notes: 'موجودی انبار تمام شده' },
  { id: 'pr2', title: 'سفارش لوازم اداری', requester: 'نرگس کریمی', department: 'اداری', items: 'کاغذ، خودکار، پوشه', quantity: '۵۰ بسته + ۱۰۰ عدد + ۲۰۰ عدد', estimatedCost: '۲۲,۵۰۰,۰۰۰', priority: 'medium', status: 'pending', date: '۱۴۰۴/۱۲/۰۲', supplier: '-', notes: 'برای سه‌ماهه بعد' },
  { id: 'pr3', title: 'خرید لامپ LED صنعتی', requester: 'امیر کاظمی', department: 'فنی', items: 'لامپ LED 50W', quantity: '۲۰ عدد', estimatedCost: '۱۱,۰۰۰,۰۰۰', priority: 'high', status: 'ordered', date: '۱۴۰۴/۱۱/۲۸', supplier: 'روشنایی پارس', notes: 'لامپ‌های سالن تولید سوخته' },
  { id: 'pr4', title: 'تأمین روغن موتور صنعتی', requester: 'رضا امینی', department: 'تولید', items: 'روغن صنعتی 20W-50', quantity: '۱۰۰ لیتر', estimatedCost: '۴۵,۰۰۰,۰۰۰', priority: 'medium', status: 'pending', date: '۱۴۰۴/۱۲/۰۱', supplier: '-', notes: 'موجودی انبار کمتر از حد مجاز' },
  { id: 'pr5', title: 'خرید تجهیزات ایمنی', requester: 'علی رضایی', department: 'HSE', items: 'دستکش، عینک، کلاه ایمنی', quantity: '۵۰ ست', estimatedCost: '۳۵,۰۰۰,۰۰۰', priority: 'low', status: 'delivered', date: '۱۴۰۴/۱۱/۲۰', supplier: 'ایمنی صنعت', notes: 'تحویل کامل انجام شد' },
  { id: 'pr6', title: 'سفارش پیچ و مهره M8', requester: 'امیر کاظمی', department: 'فنی', items: 'پیچ و مهره استنلس M8', quantity: '۳۰ بسته', estimatedCost: '۹,۶۰۰,۰۰۰', priority: 'medium', status: 'rejected', date: '۱۴۰۴/۱۱/۲۵', supplier: '-', notes: 'بودجه کافی نیست - به ماه بعد موکول شود' },
];

const PR_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  ordered: 'سفارش داده شده',
  delivered: 'تحویل شده',
};
const PR_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(46,134,255,0.15)', text: '#2E86FF' },
  approved: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  rejected: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  ordered: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  delivered: { bg: 'rgba(16,185,129,0.25)', text: '#059669' },
};

export function PurchaseRequestScreen() {
  const { showToast, openModal } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'ordered' | 'delivered' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [requests] = useState<PurchaseRequest[]>(INITIAL_PURCHASE_REQUESTS);

  const filtered = requests.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.title.includes(search) && !r.requester.includes(search)) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved' || r.status === 'ordered').length;
  const deliveredCount = requests.filter(r => r.status === 'delivered').length;

  const filters = [
    { id: 'all' as const, label: 'همه' },
    { id: 'pending' as const, label: 'در انتظار' },
    { id: 'approved' as const, label: 'تأیید شده' },
    { id: 'ordered' as const, label: 'سفارش شده' },
    { id: 'delivered' as const, label: 'تحویل شده' },
    { id: 'rejected' as const, label: 'رد شده' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Summary Cards */}
      <motion.div className="grid grid-cols-3 gap-2.5 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[20px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{toFa(pendingCount)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">در انتظار</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[20px] text-[var(--aw-primary)]" style={{ fontWeight: 700 }}>{toFa(approvedCount)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">در جریان</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="rounded-[8px] p-3 border border-[var(--aw-border)] text-center" style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}>
          <div className="text-[20px] text-[#10b981]" style={{ fontWeight: 700 }}>{toFa(deliveredCount)}</div>
          <div className="text-[10px] text-[var(--aw-text-muted)]">تحویل شده</div>
        </motion.div>
      </motion.div>

      {/* Search + Filter */}
      <div className="px-4 pb-2">
        <div className="relative mb-2">
          <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-[var(--aw-text-muted)] text-xs" />
          <input
            className="w-full py-2.5 pr-9 pl-3 rounded-[12px] border border-[var(--aw-border)] text-sm text-[var(--aw-text-primary)] placeholder-[var(--aw-text-muted)]"
            style={{ background: 'var(--aw-bg-input)', fontWeight: 500 }}
            placeholder="جستجوی درخواست..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.id}
              className={`py-1.5 px-3 rounded-[20px] border text-[11px] cursor-pointer transition-all ${
                filter === f.id ? 'text-white border-[var(--aw-primary)]' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
              }`}
              style={filter === f.id ? { background: 'var(--aw-primary)', fontWeight: 600 } : { fontWeight: 600 }}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Request Button */}
      <div className="px-4 pb-2">
        <button
          className="w-full py-2.5 rounded-[12px] border-2 border-dashed border-[var(--aw-primary)] bg-transparent text-[var(--aw-primary)] cursor-pointer transition-all hover:bg-[var(--aw-primary-bg)] text-[13px] flex items-center justify-center gap-2"
          style={{ fontWeight: 600 }}
          onClick={() => showToast('فرم درخواست خرید جدید (به زودی)')}
        >
          <i className="fa-solid fa-plus" />
          ثبت درخواست خرید جدید
        </button>
      </div>

      {/* Request List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 aw-scroll">
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {filtered.map(req => (
            <motion.div
              key={req.id}
              variants={fadeInUp}
              className="rounded-[10px] p-3.5 mb-2 border border-[var(--aw-border)] cursor-pointer transition-all hover:border-[var(--aw-primary)]"
              style={{ background: 'color-mix(in srgb, var(--aw-primary) 5%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid color-mix(in srgb, var(--aw-primary) 22%, transparent)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px color-mix(in srgb, var(--aw-primary) 12%, transparent)' }}
              onClick={() => openModal(req.title, (
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">درخواست‌کننده:</span><span>{req.requester}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">بخش:</span><span>{req.department}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">اقلام:</span><span>{req.items}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">تعداد:</span><span>{req.quantity}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">هزینه تخمینی:</span><span>{req.estimatedCost} ریال</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">تأمین‌کننده:</span><span>{req.supplier}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--aw-text-muted)]">تاریخ:</span><span>{req.date}</span></div>
                  <div><span className="text-[var(--aw-text-muted)]">یادداشت:</span><p className="mt-1 text-[var(--aw-text-secondary)]">{req.notes}</p></div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: '#10b981', fontWeight: 600 }} onClick={() => showToast('درخواست تأیید شد')}>
                        <i className="fa-solid fa-check ml-1" /> تأیید
                      </button>
                      <button className="flex-1 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: '#ef4444', fontWeight: 600 }} onClick={() => showToast('درخواست رد شد')}>
                        <i className="fa-solid fa-times ml-1" /> رد
                      </button>
                    </div>
                  )}
                </div>
              ))}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ fontWeight: 600 }}>{req.title}</span>
                <span className="px-2.5 py-0.5 rounded-[20px] text-[10px]" style={{ background: PR_STATUS_COLORS[req.status].bg, color: PR_STATUS_COLORS[req.status].text, fontWeight: 600 }}>
                  {PR_STATUS_LABELS[req.status]}
                </span>
              </div>
              <div className="text-[12px] text-[var(--aw-text-secondary)] space-y-1">
                <div className="flex items-center gap-1.5"><i className="fa-solid fa-user text-[var(--aw-text-muted)]" /> {req.requester} — {req.department}</div>
                <div className="flex items-center gap-1.5"><i className="fa-solid fa-boxes-stacked text-[var(--aw-text-muted)]" /> {req.items}</div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><i className="fa-solid fa-coins text-[var(--aw-accent)]" /> {req.estimatedCost} ریال</span>
                  <span className="text-[11px] text-[var(--aw-text-muted)]">{req.date}</span>
                </div>
              </div>
              {req.priority === 'high' && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#ef4444]" style={{ fontWeight: 600 }}>
                  <i className="fa-solid fa-arrow-up" /> اولویت بالا
                </div>
              )}
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--aw-text-muted)]">
              <i className="fa-solid fa-file-circle-xmark text-3xl mb-3 block opacity-40" />
              <p className="text-sm">درخواستی یافت نشد</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
