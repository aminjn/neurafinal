import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// حداکثر اتصالِ هر worker. با cluster (مثلاً ۴ worker) کلِ اتصال‌ها = POOL_MAX × workers؛
// پیش‌فرض ۱۰ → با ۴ هسته می‌شود ۴۰ که زیرِ سقفِ پیش‌فرضِ Postgres (۱۰۰) می‌ماند.
const POOL_MAX = Number(process.env.PG_POOL_MAX || 10);
const COMMON = { max: POOL_MAX, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 };

// یک Pool واحد برای هر پروسه — مناسب مقیاس و چند اتصال هم‌زمان.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ...COMMON }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'neura',
        password: process.env.PGPASSWORD || 'neura',
        database: process.env.PGDATABASE || 'neura',
        ...COMMON,
      }
);

export const query = (text, params) => pool.query(text, params);

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});
