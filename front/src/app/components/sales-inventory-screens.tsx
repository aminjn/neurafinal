import React, { useState, useEffect } from 'react';

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
import { api } from '../services/api';
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

const FUNNEL_STAGES: FunnelStage[] = [];

export function SalesFunnelScreen() {
  const { openModal, showToast } = useApp();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const totalValue = '۰';
  const totalDeals = FUNNEL_STAGES.reduce((acc, s) => acc + s.count, 0);
  const conversionRate = '۰';

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

const FORECAST_DATA: ForecastMonth[] = [];

interface ForecastProduct {
  id: string;
  name: string;
  currentSales: string;
  forecastSales: string;
  trend: 'up' | 'down' | 'stable';
  growth: string;
  confidence: number;
}

const FORECAST_PRODUCTS: ForecastProduct[] = [];

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  up: { icon: 'fa-solid fa-arrow-trend-up', color: '#10b981' },
  down: { icon: 'fa-solid fa-arrow-trend-down', color: '#ef4444' },
  stable: { icon: 'fa-solid fa-minus', color: '#f59e0b' },
};

export function SalesForecastScreen() {
  const { openModal } = useApp();
  const [view, setView] = useState<'chart' | 'products'>('chart');

  const totalForecast = '۰';
  const avgGrowth = '۰٪';
  const avgConfidence = '۰';

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
  urgentQueue: number;   // تعداد مشتریان در صف انتظار خرید این کالا
  urgencyFactor: number; // ضریب اضطرار (۰ تا ۱۰)
}

const INITIAL_INVENTORY: InventoryItem[] = [];

const INV_STATUS_LABELS: Record<string, string> = { sufficient: 'کافی', low: 'کم', critical: 'ناموجود' };
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
const INBOUND_MOVES: StockMove[] = [];
const OUTBOUND_MOVES: StockMove[] = [];

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

// procwarehouse: مدیریتِ کاملِ کالا/محصولِ انبار (per-user، proc_inventory)
const PW_INPUT: React.CSSProperties = { background: 'var(--aw-bg-input)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', borderRadius: 10, padding: '10px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: "'Kamand','Vazirmatn',sans-serif" };
function pwStatus(qty: number, min: number): 'critical' | 'low' | 'sufficient' { if (!(qty > 0)) return 'critical'; if (qty < (min || 0)) return 'low'; return 'sufficient'; }
const PW_STATUS_META: any = { sufficient: { label: 'کافی', color: '#10b981' }, low: { label: 'موجودی کم', color: '#f59e0b' }, critical: { label: 'ناموجود', color: '#ef4444' } };
const PW_FA = (n: any) => String(n == null ? '' : n).replace(/[0-9]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const PW_EN = (s: any) => String(s == null ? '' : s).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d.-]/g, '');
const PW_COLS = ['code', 'name', 'category', 'unit', 'quantity', 'minStock', 'purchasePrice', 'salePrice', 'supplier', 'location', 'barcode', 'description'];
const PW_HEADER = 'کد,نام کالا,دسته,واحد,موجودی,حداقل موجودی,قیمت خرید,قیمت فروش,تأمین‌کننده,محل انبار,بارکد,توضیحات';
const PW_SAMPLE = '﻿' + PW_HEADER + '\n' + 'A-1001,کاغذ A4 بسته ۵۰۰ برگ,لوازم اداری,بسته,10,20,280000,0,شرکت نمونه,انبار اصلی,6260000000001,نمونه توضیحات\n' + 'IT-2003,کارتریج پرینتر,لوازم IT,عدد,3,5,1800000,0,,انبار IT,,';
function pwParseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) { const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } }
  out.push(cur); return out.map(x => x.trim());
}
function pwParseCsv(text: string): any[] {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];
  let start = 0; const first = pwParseCsvLine(lines[0]);
  if (first[0] === 'کد' || first[1] === 'نام کالا' || first[0] === 'code') start = 1; // ردِ سطرِ سرصفحه
  const items: any[] = [];
  for (let li = start; li < lines.length; li++) {
    const c = pwParseCsvLine(lines[li]); if (!c.length || !(c[1] || c[0])) continue;
    const rec: any = {}; PW_COLS.forEach((k, i) => { rec[k] = c[i] != null ? c[i] : ''; });
    if (!String(rec.name || '').trim()) continue;
    const qty = Number(PW_EN(rec.quantity)) || 0; const min = Number(PW_EN(rec.minStock)) || 0;
    items.push({ id: Date.now() + li, code: rec.code || '', name: rec.name.trim(), category: rec.category || 'عمومی', unit: rec.unit || 'عدد', quantity: qty, minStock: min, purchasePrice: PW_EN(rec.purchasePrice) || '0', salePrice: PW_EN(rec.salePrice) || '0', supplier: rec.supplier || '', location: rec.location || 'انبار اصلی', barcode: rec.barcode || '', description: rec.description || '', status: pwStatus(qty, min) });
  }
  return items;
}
function pwDownloadSample() {
  try {
    const blob = new Blob([PW_SAMPLE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'نمونه-کالاها.csv'; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  } catch (_e) {}
}

function ProcItemForm({ initial, units, categories, onSave }: { initial?: any; units: string[]; categories: string[]; onSave: (v: any) => void }) {
  const [f, setF] = useState<any>(() => ({ code: '', name: '', category: '', unit: (units[0] || 'عدد'), quantity: '', minStock: '', purchasePrice: '', salePrice: '', supplier: '', location: 'انبار اصلی', barcode: '', description: '', ...(initial || {}) }));
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const { showToast } = useApp();
  const submit = () => {
    if (!String(f.name).trim()) { showToast('«نام کالا» را وارد کنید'); return; }
    const qty = Number(PW_EN(f.quantity)) || 0; const min = Number(PW_EN(f.minStock)) || 0;
    onSave({ ...f, name: String(f.name).trim(), quantity: qty, minStock: min, purchasePrice: PW_EN(f.purchasePrice) || '0', salePrice: PW_EN(f.salePrice) || '0', status: pwStatus(qty, min) });
  };
  const L = (t: string) => <label className="text-[11.5px]" style={{ color: 'var(--aw-text-secondary)', fontWeight: 600 }}>{t}</label>;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">{L('کد کالا (SKU)')}<input style={PW_INPUT} value={f.code} onChange={e => set('code', e.target.value)} placeholder="اختیاری" /></div>
        <div className="flex-[2] flex flex-col gap-1">{L('نام کالا *')}<input style={PW_INPUT} value={f.name} onChange={e => set('name', e.target.value)} placeholder="نام کالا" /></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">{L('دسته‌بندی')}<select style={PW_INPUT} value={f.category} onChange={e => set('category', e.target.value)}><option value="">انتخاب دسته…</option>{(categories && categories.length ? categories : ['عمومی']).map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="flex-1 flex flex-col gap-1">{L('واحد')}<select style={PW_INPUT} value={f.unit} onChange={e => set('unit', e.target.value)}>{(units.length ? units : ['عدد']).map((u: string) => <option key={u} value={u}>{u}</option>)}</select></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">{L('موجودی فعلی')}<input style={PW_INPUT} inputMode="numeric" value={f.quantity} onChange={e => set('quantity', e.target.value)} placeholder="۰" /></div>
        <div className="flex-1 flex flex-col gap-1">{L('حداقل موجودی')}<input style={PW_INPUT} inputMode="numeric" value={f.minStock} onChange={e => set('minStock', e.target.value)} placeholder="۰" /></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">{L('قیمت خرید (تومان)')}<input style={PW_INPUT} inputMode="numeric" value={f.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="۰" /></div>
        <div className="flex-1 flex flex-col gap-1">{L('قیمت فروش (تومان)')}<input style={PW_INPUT} inputMode="numeric" value={f.salePrice} onChange={e => set('salePrice', e.target.value)} placeholder="۰" /></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">{L('تأمین‌کننده')}<input style={PW_INPUT} value={f.supplier} onChange={e => set('supplier', e.target.value)} placeholder="اختیاری" /></div>
        <div className="flex-1 flex flex-col gap-1">{L('محل انبار')}<input style={PW_INPUT} value={f.location} onChange={e => set('location', e.target.value)} placeholder="انبار اصلی" /></div>
      </div>
      <div className="flex flex-col gap-1">{L('بارکد')}<input style={PW_INPUT} value={f.barcode} onChange={e => set('barcode', e.target.value)} placeholder="اختیاری" /></div>
      <div className="flex flex-col gap-1">{L('توضیحات')}<textarea rows={2} style={{ ...PW_INPUT, resize: 'none' }} value={f.description} onChange={e => set('description', e.target.value)} placeholder="اختیاری" /></div>
      <button type="button" onClick={submit} className="mt-1 py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[13px]" style={{ background: 'var(--aw-primary)', fontWeight: 700 }}>{initial && initial.id ? 'ذخیرهٔ تغییرات' : 'افزودن کالا'}</button>
    </div>
  );
}

function ProcWarehouse() {
  const { showToast, openModal, closeModal, company, companies } = useApp();
  const __shopName = () => { try { return (companies && (companies as any)[company] && (companies as any)[company].name) || ''; } catch (_e) { return ''; } };
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<string[]>(['عدد', 'کیلوگرم', 'تن', 'لیتر', 'متر', 'بسته', 'کارتن']);
  const [cats, setCats] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'sufficient' | 'low' | 'critical'>('all');
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const load = () => { (api as any).myList('proc_inventory').then((r: any) => setItems(Array.isArray(r) ? r : [])).catch(() => {}); };
  React.useEffect(() => {
    load();
    (api as any).getSettings().then((cfg: any) => { if (cfg && Array.isArray(cfg.procUnits) && cfg.procUnits.length) setUnits(cfg.procUnits); if (cfg && Array.isArray(cfg.procCategories) && cfg.procCategories.length) setCats(cfg.procCategories); }).catch(() => {});
  }, []);
  const save = async (v: any) => {
    const _v = { ...v, shopName: v.shopName || __shopName() };  // تگِ نامِ فروشگاه/شرکت برای بازار
    try {
      if (_v.id && items.some(x => String(x.id) === String(_v.id))) await (api as any).myUpdate('proc_inventory', String(_v.id), _v);
      else await (api as any).myCreate('proc_inventory', { ..._v, id: _v.id || Date.now() });
      // ثبتِ خودکارِ «کسب‌وکار» فعال تا نامِ فروشگاه در بازار = نامِ شرکت (نه نامِ شخص) شود.
      try { const __cn = __shopName(); if (__cn && company) (api as any).myCreate('businesses', { id: company, name: __cn, type: (((companies as any)[company] && (companies as any)[company].type)) || 'فروشگاه' }).catch(() => {}); } catch (_e2) {}
      showToast('کالا ذخیره شد'); closeModal(); load();
    } catch (_e) { showToast('خطا در ذخیره'); }
  };
  const del = async (it: any) => { try { await (api as any).myRemove('proc_inventory', String(it.id)); showToast('کالا حذف شد'); load(); } catch (_e) { showToast('خطا در حذف'); } };
  const openForm = (it?: any) => openModal(it ? ('ویرایش: ' + it.name) : 'افزودن کالا', <ProcItemForm initial={it} units={units} onSave={save} />);
  const onFile = (e: any) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const parsed = pwParseCsv(String(reader.result || ''));
      if (!parsed.length) { showToast('کالایی در فایل یافت نشد'); return; }
      try {
        const merged = [...items];
        for (const p of parsed) merged.push(p);
        await (api as any).myBulkSave('proc_inventory', merged);
        showToast(PW_FA(parsed.length) + ' کالا وارد شد ✅'); load();
      } catch (_e) { showToast('خطا در ورود اطلاعات'); }
    };
    reader.readAsText(file, 'utf-8'); e.target.value = '';
  };
  const list = items.filter(i => (filter === 'all' || i.status === filter) && (!search || String(i.name || '').includes(search) || String(i.code || '').includes(search) || String(i.category || '').includes(search)));
  const cnt = (st: string) => items.filter(i => i.status === st).length;
  const cards = [
    { id: 'all', label: 'کل اقلام', v: items.length, color: 'var(--aw-text-primary)' },
    { id: 'sufficient', label: 'کافی', v: cnt('sufficient'), color: '#10b981' },
    { id: 'low', label: 'موجودی کم', v: cnt('low'), color: '#f59e0b' },
    { id: 'critical', label: 'ناموجود', v: cnt('critical'), color: '#ef4444' },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-2 px-4 pt-3 pb-2">
        {cards.map(c => (
          <button key={c.id} type="button" onClick={() => setFilter(c.id as any)} className="aw-no-pill rounded-[8px] p-2.5 border text-center cursor-pointer" style={filter === c.id ? { background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
            <div className="text-[18px]" style={{ color: c.color, fontWeight: 700 }}>{PW_FA(c.v)}</div>
            <div className="text-[9.5px] text-[var(--aw-text-muted)]">{c.label}</div>
          </button>
        ))}
      </div>
      <div className="px-4 pb-2 flex gap-2">
        <div className="relative flex-1">
          <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-[var(--aw-text-muted)] text-xs" />
          <input className="w-full py-2.5 pr-9 pl-3 rounded-[12px] border border-[var(--aw-border)] text-sm" style={{ background: 'var(--aw-bg-input)', color: 'var(--aw-text-primary)' }} placeholder="جستجوی کالا..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="px-4 pb-2 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => openForm()} className="py-2.5 rounded-[10px] border-none cursor-pointer text-white text-[12px] flex items-center justify-center gap-1.5" style={{ background: 'var(--aw-primary)', fontWeight: 700 }}><i className="fa-solid fa-plus text-[11px]" />افزودن کالا</button>
        <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className="py-2.5 rounded-[10px] cursor-pointer text-[12px] flex items-center justify-center gap-1.5" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', fontWeight: 700 }}><i className="fa-solid fa-file-excel text-[11px]" style={{ color: '#10b981' }} />ورود اکسل</button>
        <button type="button" onClick={pwDownloadSample} className="py-2.5 rounded-[10px] cursor-pointer text-[12px] flex items-center justify-center gap-1.5" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)', color: 'var(--aw-text-primary)', fontWeight: 700 }}><i className="fa-solid fa-download text-[11px]" />فایل نمونه</button>
      </div>
      <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" style={{ display: 'none' }} onChange={onFile} />
      <div className="flex-1 overflow-y-auto px-4 pb-24 aw-scroll">
        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--aw-text-muted)]">
            <i className="fa-solid fa-box-open text-[30px] mb-3 opacity-40" />
            <div className="text-[13px]">کالایی یافت نشد — «افزودن کالا» یا «ورود اکسل» را بزنید</div>
          </div>
        )}
        {list.map(it => { const st = PW_STATUS_META[it.status] || PW_STATUS_META.sufficient; return (
          <div key={it.id} className="rounded-[10px] p-3 mb-2 flex items-center gap-3" style={{ background: 'var(--aw-bg-card)', border: '1px solid var(--aw-border)' }}>
            <div className="flex-1 min-w-0" onClick={() => openForm(it)} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-2"><span className="text-[13px] truncate" style={{ fontWeight: 700 }}>{it.name}</span>{it.code ? <span className="text-[9px] text-[var(--aw-text-muted)]">#{it.code}</span> : null}</div>
              <div className="text-[10.5px] text-[var(--aw-text-muted)] truncate">{it.category || 'عمومی'} · موجودی: {PW_FA(it.quantity)} {it.unit || ''} · حداقل: {PW_FA(it.minStock)}</div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: st.color + '22', color: st.color, fontWeight: 700 }}>{st.label}</span>
            <button type="button" onClick={() => openForm(it)} className="w-8 h-8 rounded-lg border-none cursor-pointer flex-shrink-0" style={{ background: 'rgba(46,134,255,0.14)', color: 'var(--aw-primary)' }}><i className="fa-solid fa-pen text-[11px]" /></button>
            <button type="button" onClick={() => del(it)} className="w-8 h-8 rounded-lg border-none cursor-pointer flex-shrink-0" style={{ background: 'rgba(239,68,68,0.14)', color: '#ef4444' }}><i className="fa-solid fa-trash text-[11px]" /></button>
          </div>
        ); })}
      </div>
    </div>
  );
}

export function InventoryScreen({ isProc = false }: { isProc?: boolean }) {
  const { showToast, openModal } = useApp();
  // The انبار screen is shared between the procurement agent and the seller/cashier.
  // Procurement shows purchase-urgency fields (ضریب اضطرار / تعداد در صف) and the
  // «ناموجود» label; the seller keeps its original layout (نوع کالا + «بحرانی»).
  if (isProc) return <ProcWarehouse />;
  const criticalLabel = isProc ? 'ناموجود' : 'بحرانی';
  const [filter, setFilter] = useState<'all' | 'sufficient' | 'low' | 'critical' | 'none'>('none');
  const [search, setSearch] = useState('');
  const __coInv = (useApp() as any).company;
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  useEffect(() => { if (!__coInv) return; (async () => { try { const v: any = await (api as any).list('inventory', __coInv); if (Array.isArray(v)) setInventory((v as any[]).map((it: any) => ({ id: it.id, name: it.name || '', category: it.category || 'عمومی', quantity: it.quantity ?? 0, unit: it.unit || 'عدد', minStock: it.minStock ?? 0, price: it.price || '۰', location: it.location || 'انبار اصلی', lastUpdated: it.lastUpdated || '—', status: it.status || 'sufficient', urgentQueue: it.urgentQueue ?? 0, urgencyFactor: it.urgencyFactor ?? 1 })) as any); } catch (_) {} })(); }, [__coInv]);

  const filtered = inventory.filter(i => {
    if (filter !== 'all' && filter !== 'none' && i.status !== filter) return false;
    if (search && !i.name.includes(search) && !i.category.includes(search)) return false;
    return true;
  });

  const totalItems = inventory.length;
  const lowCount = inventory.filter(i => i.status === 'low').length;
  const criticalCount = inventory.filter(i => i.status === 'critical').length;
  const sufficientCount = inventory.filter(i => i.status === 'sufficient').length;

  const filters = [
    { id: 'all' as const, label: 'همه' },
    { id: 'sufficient' as const, label: 'کافی' },
    { id: 'low' as const, label: 'کم' },
    { id: 'critical' as const, label: criticalLabel },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Summary Cards act as filters: کل / کافی / کم / بحرانی — click active card to clear filter */}
      <motion.div className="grid grid-cols-4 gap-2 px-4 pt-3 pb-2" variants={staggerContainer} initial="initial" animate="animate">
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'all' ? 'none' : 'all')} className="aw-no-pill rounded-[8px] p-2.5 border text-center cursor-pointer transition-all" style={filter === 'all' ? { background: 'var(--aw-primary-bg)', borderColor: 'var(--aw-primary)' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[19px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(totalItems)}</div>
          <div className="text-[9.5px] text-[var(--aw-text-muted)]">کل اقلام</div>
        </motion.button>
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'sufficient' ? 'none' : 'sufficient')} className="aw-no-pill rounded-[8px] p-2.5 border text-center cursor-pointer transition-all" style={filter === 'sufficient' ? { background: 'rgba(16,185,129,0.12)', borderColor: '#10b981' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[19px] text-[#10b981]" style={{ fontWeight: 700 }}>{toFa(sufficientCount)}</div>
          <div className="text-[9.5px] text-[var(--aw-text-muted)]">کافی</div>
        </motion.button>
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'low' ? 'none' : 'low')} className="aw-no-pill rounded-[8px] p-2.5 border text-center cursor-pointer transition-all" style={filter === 'low' ? { background: 'rgba(245,158,11,0.12)', borderColor: '#f59e0b' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[19px] text-[#f59e0b]" style={{ fontWeight: 700 }}>{toFa(lowCount)}</div>
          <div className="text-[9.5px] text-[var(--aw-text-muted)]">موجودی کم</div>
        </motion.button>
        <motion.button variants={fadeInUp} onClick={() => setFilter(filter === 'critical' ? 'none' : 'critical')} className="aw-no-pill rounded-[8px] p-2.5 border text-center cursor-pointer transition-all" style={filter === 'critical' ? { background: 'rgba(239,68,68,0.12)', borderColor: '#ef4444' } : { background: 'var(--aw-bg-card)', borderColor: 'var(--aw-border)' }}>
          <div className="text-[19px] text-[#ef4444]" style={{ fontWeight: 700 }}>{toFa(criticalCount)}</div>
          <div className="text-[9.5px] text-[var(--aw-text-muted)]">{criticalLabel}</div>
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
                  <button className="w-full mt-3 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: 'var(--aw-primary)', fontWeight: 600 }} onClick={() => { try { (api as any).create('purchase_requests', { title: item.name, quantity: item.minStock, unit: item.unit, status: 'pending', urgency: 'high', createdAt: new Date().toISOString(), company: __coInv }); } catch (_) {} showToast('درخواست خرید ثبت شد'); }}>
                    <i className="fa-solid fa-cart-plus ml-2" />ثبت درخواست خرید
                  </button>
                </div>
              ))}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ fontWeight: 600 }}>{item.name}</span>
                <span className="px-2.5 py-0.5 rounded-[20px] text-[10px]" style={{ background: INV_STATUS_COLORS[item.status].bg, color: INV_STATUS_COLORS[item.status].text, fontWeight: 600 }}>
                  {item.status === 'critical' ? criticalLabel : INV_STATUS_LABELS[item.status]}
                </span>
              </div>
              <div className="text-[12px] text-[var(--aw-text-secondary)] space-y-1">
                {isProc ? (<>
                <div className="flex items-center gap-1.5"><span className="text-[var(--aw-text-muted)]">ضریب اضطرار:</span> <span style={{ fontWeight: 700, color: item.urgencyFactor >= 7 ? '#ef4444' : item.urgencyFactor >= 4 ? '#f59e0b' : 'var(--aw-text-secondary)' }}>{toFa(item.urgencyFactor)}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[var(--aw-text-muted)]">تعداد در صف:</span> <span style={{ fontWeight: 700, color: item.urgentQueue > 0 ? '#ef4444' : 'var(--aw-text-muted)' }}>{toFa(item.urgentQueue)} نفر</span></div>
                </>) : (
                <div className="flex items-center gap-1.5"><i className="fa-solid fa-layer-group text-[var(--aw-text-muted)]" /> {item.category}</div>
                )}
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

const INITIAL_PURCHASE_REQUESTS: PurchaseRequest[] = [];

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
  const { showToast, openModal, company } = useApp() as any;
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
          onClick={() => { const nm = window.prompt('نام کالای درخواستی:'); if (nm) { (api as any).create('purchase_requests', { title: nm, status: 'pending', urgency: 'medium', createdAt: new Date().toISOString() }, company); showToast('درخواست خرید «' + nm + '» ثبت شد ✅'); } }}
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
                      <button className="flex-1 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: '#10b981', fontWeight: 600 }} onClick={() => { (api as any).create('purchase_requests', { ...req, status: 'approved' }, company); showToast('درخواست تأیید شد ✅'); }}>
                        <i className="fa-solid fa-check ml-1" /> تأیید
                      </button>
                      <button className="flex-1 py-2.5 rounded-[12px] text-white border-none cursor-pointer text-[13px]" style={{ background: '#ef4444', fontWeight: 600 }} onClick={() => { (api as any).create('purchase_requests', { ...req, status: 'rejected' }, company); showToast('درخواست رد شد'); }}>
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
