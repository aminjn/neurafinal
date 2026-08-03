// دادهٔ واقعیِ ویترینِ فروشگاه (غذا/مارکت) — سمتِ سرور نگهداری می‌شود و فرانت از /api/shop می‌خواند.
// insert-if-missing تا ویرایش‌های بعدیِ سوپرادمین با re-seed پاک نشود.
import { query } from './db.js';

const RESTAURANTS = [
  { id: 'r1', name: 'رستوران شاندیز', type: 'ایرانی سنتی', cuisine: 'iranian', rating: 4.8, distance: '۱.۲ km', deliveryTime: '۳۰-۴۵ دقیقه', isOpen: true, minOrder: '۱۵۰,۰۰۰', icon: 'fa-solid fa-utensils', color: '#F59E0B' },
  { id: 'r2', name: 'فست‌فود برگر لند', type: 'فست‌فود', cuisine: 'fastfood', rating: 4.5, distance: '۰.۸ km', deliveryTime: '۲۵-۴۰ دقیقه', isOpen: true, minOrder: '۱۰۰,۰۰۰', icon: 'fa-solid fa-burger', color: '#EF4444' },
  { id: 'r3', name: 'کافه سالادِ سبز', type: 'سالاد و سالم', cuisine: 'salad', rating: 4.6, distance: '۱.۵ km', deliveryTime: '۲۰-۳۵ دقیقه', isOpen: true, minOrder: '۸۰,۰۰۰', icon: 'fa-solid fa-leaf', color: '#10B981' },
  { id: 'r4', name: 'پیتزا ایتالیانو', type: 'پیتزا', cuisine: 'fastfood', rating: 4.7, distance: '۲.۱ km', deliveryTime: '۳۵-۵۰ دقیقه', isOpen: true, minOrder: '۱۲۰,۰۰۰', icon: 'fa-solid fa-pizza-slice', color: '#F97316' },
];

const MENU = [
  { id: 'm1', name: 'چلوکباب سلطانی', desc: 'یک سیخ کوبیده + یک سیخ برگ با برنج زعفرانی', price: '۲۸۵,۰۰۰', priceNum: 285000, category: 'iranian', restaurant: 'r1', image: '', rating: 4.8 },
  { id: 'm2', name: 'جوجه‌کباب زعفرانی', desc: 'ران مرغِ زعفرانی با برنج و گوجه کبابی', price: '۲۲۰,۰۰۰', priceNum: 220000, category: 'iranian', restaurant: 'r1', image: '', rating: 4.7 },
  { id: 'm3', name: 'قورمه‌سبزی', desc: 'خورش سنتی با گوشت و برنج', price: '۱۸۵,۰۰۰', priceNum: 185000, category: 'iranian', restaurant: 'r1', image: '', rating: 4.6 },
  { id: 'm4', name: 'برگر مخصوص دوبل', desc: 'دو لایه گوشت، پنیر چدار، سس مخصوص', price: '۱۹۵,۰۰۰', priceNum: 195000, category: 'fastfood', restaurant: 'r2', image: '', rating: 4.5 },
  { id: 'm5', name: 'ساندویچ مرغ کریسپی', desc: 'فیله مرغ سوخاری با سیب‌زمینی', price: '۱۵۵,۰۰۰', priceNum: 155000, category: 'fastfood', restaurant: 'r2', image: '', rating: 4.4 },
  { id: 'm6', name: 'سالاد سزار مرغ گریل', desc: 'کاهو، مرغ گریل، پنیر پارمزان، سس سزار', price: '۱۳۵,۰۰۰', priceNum: 135000, category: 'salad', restaurant: 'r3', image: '', rating: 4.6 },
  { id: 'm7', name: 'سالاد یونانی', desc: 'گوجه، خیار، زیتون، پنیر فتا', price: '۱۱۰,۰۰۰', priceNum: 110000, category: 'salad', restaurant: 'r3', image: '', rating: 4.5 },
  { id: 'm8', name: 'پیتزا پپرونی', desc: 'خمیر دستی، پپرونی، پنیر موزارلا', price: '۲۴۰,۰۰۰', priceNum: 240000, category: 'fastfood', restaurant: 'r4', image: '', rating: 4.7 },
  { id: 'm9', name: 'پیتزا مخصوص', desc: 'ژامبون، قارچ، فلفل دلمه، پنیر', price: '۲۶۵,۰۰۰', priceNum: 265000, category: 'fastfood', restaurant: 'r4', image: '', rating: 4.8 },
  { id: 'm10', name: 'نوشابه خانواده', desc: 'یک‌ونیم لیتری', price: '۳۵,۰۰۰', priceNum: 35000, category: 'drink', restaurant: 'r1', image: '', rating: 4.3 },
];

const DINE_OFFERS = [
  { id: 'do1', title: 'تخفیف اولین سفارش', desc: 'با ثبت اولین سفارش از هر رستوران', discount: 30, restaurant: 'همه رستوران‌ها', validUntil: 'تا پایان ماه', code: 'FIRST30', color: '#10B981', icon: 'fa-solid fa-gift' },
  { id: 'do2', title: 'ارسال رایگان', desc: 'برای سفارش‌های بالای ۳۰۰ هزار تومان', discount: 0, restaurant: 'همه رستوران‌ها', validUntil: 'تا پایان هفته', code: 'FREESHIP', color: '#3B82F6', icon: 'fa-solid fa-truck' },
];

const SHOPS = [
  { id: 's1', name: 'دیجی‌تک', type: 'لوازم دیجیتال', cat: 'electronics', rating: 4.8, distance: '۲.۵ km', deliveryTime: '۱-۲ روز', isOpen: true, products: 48, icon: 'fa-solid fa-microchip', color: '#3B82F6' },
  { id: 's2', name: 'مد اسپورت', type: 'پوشاک ورزشی', cat: 'fashion', rating: 4.6, distance: '۱.۸ km', deliveryTime: '۲-۳ روز', isOpen: true, products: 62, icon: 'fa-solid fa-shirt', color: '#EC4899' },
  { id: 's3', name: 'خانه و آشپزخانه مهر', type: 'لوازم خانگی', cat: 'home', rating: 4.5, distance: '۳.۱ km', deliveryTime: '۲-۴ روز', isOpen: true, products: 35, icon: 'fa-solid fa-house', color: '#10B981' },
];

const PRODUCTS = [
  { id: 'p101', name: 'هدفون بی‌سیم پرو', desc: 'نویزکنسلینگ، باتری ۳۰ ساعت', price: '۲,۴۵۰,۰۰۰', priceNum: 2450000, category: 'electronics', shop: 'دیجی‌تک', image: '', rating: 4.7, inStock: true, discount: 10 },
  { id: 'p102', name: 'ماوس گیمینگ RGB', desc: '۱۶۰۰۰ DPI، ۷ دکمه قابل برنامه‌ریزی', price: '۸۹۰,۰۰۰', priceNum: 890000, category: 'electronics', shop: 'دیجی‌تک', image: '', rating: 4.6, inStock: true, discount: 0 },
  { id: 'p103', name: 'کیبورد مکانیکال', desc: 'سوییچ آبی، بک‌لایت RGB', price: '۱,۳۵۰,۰۰۰', priceNum: 1350000, category: 'electronics', shop: 'دیجی‌تک', image: '', rating: 4.8, inStock: true, discount: 15 },
  { id: 'p201', name: 'کفش دویدن حرفه‌ای', desc: 'سبک، ضدلغزش، تهویه‌دار', price: '۱,۸۰۰,۰۰۰', priceNum: 1800000, category: 'fashion', shop: 'مد اسپورت', image: '', rating: 4.5, inStock: true, discount: 0 },
  { id: 'p202', name: 'ست ورزشی مردانه', desc: 'پارچه خنک، سایزبندی کامل', price: '۹۵۰,۰۰۰', priceNum: 950000, category: 'fashion', shop: 'مد اسپورت', image: '', rating: 4.4, inStock: true, discount: 20 },
  { id: 'p301', name: 'سرویس قابلمه ۷ پارچه', desc: 'استیل ضدزنگ، مناسب اجاق القایی', price: '۳,۲۰۰,۰۰۰', priceNum: 3200000, category: 'home', shop: 'خانه و آشپزخانه مهر', image: '', rating: 4.6, inStock: true, discount: 5 },
  { id: 'p302', name: 'چای‌ساز دیجیتال', desc: 'کتری استیل، دمنوش‌ساز', price: '۱,۱۵۰,۰۰۰', priceNum: 1150000, category: 'home', shop: 'خانه و آشپزخانه مهر', image: '', rating: 4.5, inStock: true, discount: 0 },
];

const MKT_OFFERS = [
  { id: 'mo1', title: 'تخفیف خوش‌آمدگویی', desc: 'اولین خرید از هر فروشگاه', discount: 20, shop: 'همه فروشگاه‌ها', validUntil: 'تا پایان ماه', code: 'WELCOME20', color: '#10B981', icon: 'fa-solid fa-gift' },
  { id: 'mo2', title: 'جشنوارهٔ دیجیتال', desc: 'تا ۱۵٪ روی لوازم دیجیتال', discount: 15, shop: 'دیجی‌تک', validUntil: 'تا پایان هفته', code: 'TECH15', color: '#3B82F6', icon: 'fa-solid fa-bolt' },
];

const REVIEWS = [
  { id: 'rv-r1-1', restaurant: 'r1', user: 'محمد ر.', rating: 5, text: 'غذای عالی و ارسال سریع. کباب سلطانی فوق‌العاده بود.', date: '۳ روز پیش' },
  { id: 'rv-r1-2', restaurant: 'r1', user: 'سارا ک.', rating: 4, text: 'کیفیت خوبه ولی زمان ارسال کمی طولانی بود.', date: '۱ هفته پیش' },
  { id: 'rv-r1-3', restaurant: 'r1', user: 'علی م.', rating: 5, text: 'بهترین رستوران ایرانی. قرمه‌سبزی خانگی واقعی!', date: '۲ هفته پیش' },
  { id: 'rv-r1-4', restaurant: 'r1', user: 'نازنین ح.', rating: 4, text: 'پرسنل مودب و بسته‌بندی تمیز.', date: '۳ هفته پیش' },
  { id: 'rv-r2-1', restaurant: 'r2', user: 'رضا ب.', rating: 5, text: 'برگر دوبل واقعاً خوشمزه و پُر بود. حتماً دوباره سفارش می‌دم.', date: '۲ روز پیش' },
  { id: 'rv-r2-2', restaurant: 'r2', user: 'مینا ت.', rating: 4, text: 'سیب‌زمینی‌ها تازه و داغ بود. سسش عالی.', date: '۵ روز پیش' },
  { id: 'rv-r2-3', restaurant: 'r2', user: 'حسین ن.', rating: 4, text: 'ارسال سریع، قیمت منصفانه.', date: '۱ هفته پیش' },
  { id: 'rv-r3-1', restaurant: 'r3', user: 'پریسا الف.', rating: 5, text: 'سالادها تازه و سالم. دقیقاً چیزی که می‌خواستم.', date: '۴ روز پیش' },
  { id: 'rv-r3-2', restaurant: 'r3', user: 'کاوه م.', rating: 4, text: 'مواد اولیه باکیفیت، فقط کمی گران.', date: '۱ هفته پیش' },
  { id: 'rv-r4-1', restaurant: 'r4', user: 'شیما د.', rating: 5, text: 'پیتزا خمیر نازک عالی، پنیرش فوق‌العاده بود.', date: '۳ روز پیش' },
  { id: 'rv-r4-2', restaurant: 'r4', user: 'امیر ک.', rating: 4, text: 'طعم خوب ولی یه کم دیر رسید.', date: '۶ روز پیش' },
  { id: 'rv-r4-3', restaurant: 'r4', user: 'لیلا ص.', rating: 5, text: 'بهترین پیتزای محله! پیشنهاد می‌کنم.', date: '۲ هفته پیش' },
];

async function upsert(collection, items) {
  for (const it of items) {
    await query(
      "INSERT INTO documents (collection, id, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT (collection, id) DO NOTHING",
      [collection, String(it.id), JSON.stringify(it)]
    );
  }
}

export async function seedStorefront() {
  await upsert('sf_restaurants', RESTAURANTS);
  await upsert('sf_menu', MENU);
  await upsert('sf_offers', DINE_OFFERS.concat(MKT_OFFERS));
  await upsert('sf_shops', SHOPS);
  await upsert('sf_products', PRODUCTS);
  await upsert('sf_reviews', REVIEWS);
  console.log(`✓ storefront seeded (${RESTAURANTS.length} restaurants, ${MENU.length} menu, ${SHOPS.length} shops, ${PRODUCTS.length} products, ${REVIEWS.length} reviews)`);
}
