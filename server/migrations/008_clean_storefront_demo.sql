-- حذفِ دیتای دموی «ویترین» (رستوران/منو/فروشگاه/محصول/آفر/نظرِ نمونه).
-- این‌ها seedِ فیک بودند (رستوران شاندیز/برگر لند/سیرنگ با امتیاز و فاصلهٔ ساختگی و …) و در
-- «سفارش غذا» و مارکت به کاربر نشان داده می‌شدند. دادهٔ واقعی از رستوران‌های واقعی (dine venues)
-- و فروشنده‌های واقعی (marketShops/marketAllProducts) می‌آید، نه این کاتالوگِ دمو.
DELETE FROM documents WHERE collection IN (
  'sf_restaurants', 'sf_menu', 'sf_offers', 'sf_shops', 'sf_products', 'sf_reviews'
);
