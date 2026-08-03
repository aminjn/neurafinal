import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';
import { collections } from './seed-data.js';
import { seedStorefront } from './seed-storefront.js';
import { seedDemo } from './seed-demo.js';

dotenv.config();

async function seedSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin@12345';
  const email = process.env.SUPERADMIN_EMAIL || 'admin@neura.app';
  const hash = await bcrypt.hash(password, 10);
  // فقط اگر وجود ندارد ساخته شود — تا رمز/تغییرات بعدی با هر دیپلوی پاک نشود
  await query(
    `INSERT INTO app_users (username, password_hash, name, email, role, company)
       VALUES ($1, $2, 'مدیر ارشد', $3, 'superadmin', 'alpha')
     ON CONFLICT (username) DO NOTHING`,
    [username, hash, email]
  );
  console.log(`✓ superadmin ready (username: ${username})`);
}

async function seedDocuments() {
  let total = 0;
  for (const [collection, items] of Object.entries(collections)) {
    for (const item of items) {
      // insert-if-missing — تا ویرایش‌های کاربر (نام مدل‌ها، کلید API، انتساب‌ها) با re-seed پاک نشود
      await query(
        `INSERT INTO documents (collection, id, company, data)
           VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (collection, id) DO NOTHING`,
        [collection, String(item.id), item.company || null, JSON.stringify(item)]
      );
      total++;
    }
    console.log(`  • ${collection}: ${items.length}`);
  }
  console.log(`✓ documents seeded (${total})`);
}

async function run() {
  await seedSuperAdmin();
  await seedDocuments();
  // seedStorefront عمداً اجرا نمی‌شود: کاتالوگِ دموِ رستوران/فروشگاه (شاندیز/برگر لند/…) فیک بود و
  // کاربر آن را در سفارش غذا/مارکت می‌دید. حالا فقط رستوران‌ها/فروشنده‌های واقعی نمایش داده می‌شوند.
  // (migration 008 ردیف‌های sf_* موجود را هم پاک می‌کند.)
  void seedStorefront; // بدونِ فراخوانی — تا importِ بی‌استفاده اخطار ندهد
  // seedDemo عمداً اجرا نمی‌شود: دادهٔ کسب‌وکارِ فیک (مشتری/معامله/سفارش/محصول/پرسنل/…) را روی
  // company='alpha' می‌ریخت و با prune دادهٔ واقعی را هم پاک می‌کرد — برای همین «ایجنتِ جدید از قبل
  // دیتای فیک داشت». حالا هر ایجنتِ تازه‌استخدام تمیز و بدونِ دادهٔ فیک شروع می‌کند.
  // (اگر برای دموِ فروش لازم شد، دستی: `node -e "import('./src/seed-demo.js').then(m=>m.seedDemo())"`)
  // await seedDemo();
  await pool.end();
  console.log('✓ seed done (demo business data NOT seeded)');
}

run().catch((e) => {
  console.error('seed failed:', e);
  process.exit(1);
});
