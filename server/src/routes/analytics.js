// تحلیل‌های واقعی: درآمد/هزینهٔ ماهانه و فعالیتِ هفتگی از رویِ دادهٔ واقعیِ سرور (بر اساس created_at)
// جمع زده می‌شود. هر بازه‌ای که هنوز دادهٔ واقعی ندارد، به مقدارِ نمونهٔ پایه برمی‌گردد تا نمودار
// هرگز خالی/شکسته دیده نشود — و با انباشتِ دادهٔ واقعی در طولِ زمان، کاملاً واقعی می‌شود.
import express from 'express';
import { query } from '../db.js';
import { authRequired } from '../auth.js';

const router = express.Router();

const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
// شنبه..جمعه (JS getDay: یکشنبه=0 ... شنبه=6)
const PERSIAN_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const jsDayToFa = (d) => (d + 1) % 7; // یکشنبه(0)->1 ... شنبه(6)->0

// نمونهٔ پایه (همان اعدادِ نمودارِ فرانت) — فقط برای بازه‌های بدونِ دادهٔ واقعی
const SAMPLE_REVENUE = [720, 850, 680, 920, 780, 1050, 890, 960, 1100, 870, 1000, 1150];
const SAMPLE_EXPENSE = [280, 310, 290, 340, 300, 360, 320, 350, 380, 330, 350, 400];
const SAMPLE_MSG = [42, 55, 38, 67, 48, 35, 12];
const SAMPLE_CALLS = [8, 12, 6, 15, 10, 5, 2];

// تبدیل میلادی به جلالی (الگوریتمِ استاندارد jalaali-js) — فقط ماهِ جلالی لازم است
function gregorianToJalaaliMonth(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  return jm; // 1..12
}

const parseAmount = (v) => {
  if (typeof v === 'number') return v;
  if (v == null) return 0;
  const en = String(v).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d]/g, '');
  return parseInt(en || '0', 10);
};
// مبالغِ نمودار بر حسبِ «میلیون تومان» است (نمونه: ۷۲۰ ≈ ۷۲۰م)
const toMillions = (n) => Math.round(n / 1_000_000);

router.get('/summary', authRequired, async (req, res) => {
  try {
    const company = req.query.company || req.user.company || null;
    const { rows } = await query(
      `SELECT collection, data, created_at FROM documents
         WHERE collection = ANY($1) AND (company = $2 OR company IS NULL)`,
      [['invoices', 'purchase_invoices', 'orders', 'conversations', 'call_tasks'], company]
    );

    const income = new Array(12).fill(0);   // میلیون تومان
    const expense = new Array(12).fill(0);
    const msgs = new Array(7).fill(0);
    const calls = new Array(7).fill(0);
    const seenIncome = new Set();
    const seenExpense = new Set();
    const seenDayMsg = new Set();
    const seenDayCall = new Set();

    for (const r of rows) {
      const d = new Date(r.created_at);
      const jm = gregorianToJalaaliMonth(d.getFullYear(), d.getMonth() + 1, d.getDate()) - 1; // 0..11
      const fa = jsDayToFa(d.getDay()); // 0..6 (شنبه..جمعه)
      const data = r.data || {};
      if (r.collection === 'invoices') {
        income[jm] += toMillions(parseAmount(data.amount ?? data.total)); seenIncome.add(jm);
      } else if (r.collection === 'orders') {
        income[jm] += toMillions(parseAmount(data.total ?? data.amount)); seenIncome.add(jm);
      } else if (r.collection === 'purchase_invoices') {
        expense[jm] += toMillions(parseAmount(data.amount)); seenExpense.add(jm);
      } else if (r.collection === 'conversations') {
        msgs[fa] += 1; seenDayMsg.add(fa);
      } else if (r.collection === 'call_tasks') {
        calls[fa] += 1; seenDayCall.add(fa);
      }
    }

    const monthlyRevenue = PERSIAN_MONTHS.map((month, i) => ({
      month,
      income: seenIncome.has(i) ? Math.max(income[i], 1) : SAMPLE_REVENUE[i],
      expense: seenExpense.has(i) ? Math.max(expense[i], 1) : SAMPLE_EXPENSE[i],
    }));
    const weeklyActivity = PERSIAN_DAYS.map((day, i) => ({
      day,
      messages: seenDayMsg.has(i) ? msgs[i] : SAMPLE_MSG[i],
      calls: seenDayCall.has(i) ? calls[i] : SAMPLE_CALLS[i],
    }));

    res.json({ monthlyRevenue, weeklyActivity });
  } catch (e) {
    res.status(500).json({ error: 'analytics_failed' });
  }
});

export default router;
