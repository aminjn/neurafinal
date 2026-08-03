import { query } from './db.js';

const ACTION_BY_METHOD = { POST: 'ایجاد', PUT: 'آپدیت', PATCH: 'آپدیت', DELETE: 'حذف' };

const RESOURCE_FA = {
  users: 'کاربران', settings: 'تنظیمات', agents: 'ایجنت‌ها', customers: 'مشتریان',
  transactions: 'تراکنش‌ها', invoices: 'فاکتورها', wallets: 'کیف پول‌ها', tickets: 'تیکت‌ها',
  businesses: 'بیزینس‌ها', ai_providers: 'ارائه‌دهنده AI', ai_models: 'مدل‌های AI',
  tasks: 'وظایف', deals: 'معاملات', finance: 'مالی', ai: 'هوش مصنوعی',
};

// نام منبع و هدف را از مسیر استخراج می‌کند: /api/data/agents/marketing -> {resource:'ایجنت‌ها', target:'marketing'}
function describe(path) {
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean); // ['api','data','agents','marketing']
  parts.shift(); // drop 'api'
  let seg = parts.shift(); // 'data' | 'users' | 'ai' | 'settings'
  let resourceKey = seg;
  let target = '';
  if (seg === 'data') { resourceKey = parts.shift() || 'data'; target = parts.shift() || ''; }
  else { target = parts.join('/'); }
  return { resource: RESOURCE_FA[resourceKey] || resourceKey, target };
}

// Middleware: اعمال نوشتنِ کاربرانِ احراز‌هویت‌شده را پس از پاسخ موفق ثبت می‌کند.
export function auditMiddleware(req, res, next) {
  const method = req.method;
  if (!ACTION_BY_METHOD[method]) return next();
  // مسیر را همین حالا بگیر (روترها بعداً req.url را تغییر می‌دهند)
  const fullPath = (req.originalUrl || req.url || '').split('?')[0];
  if (fullPath.startsWith('/api/logs') || fullPath.startsWith('/api/auth')) return next();

  res.on('finish', () => {
    try {
      if (!req.user) return; // فقط اقدامات احراز‌هویت‌شده
      const { resource, target } = describe(fullPath);
      const status = res.statusCode < 400 ? 'موفق' : 'ناموفق';
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
      query(
        `INSERT INTO admin_logs (admin, role, action, resource, target, ip, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.user.name || req.user.username, req.user.role, ACTION_BY_METHOD[method], resource, target || (req.body && req.body.id) || '', ip, status]
      ).catch(() => {});
    } catch {}
  });
  next();
}
