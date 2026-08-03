import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './app-context';
import { LetterAvatar } from './letter-avatar';
import { toFa } from './data';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { euCardStyle, AgentTabBar, StatusPill, SectionTitle, EmptyState, AgentChatTabUI, MiniChatPreview } from './eu-agent-shared';
import type { ChatListItem, AgentCardItem, AgentTopicItem } from './eu-agent-shared';

// =====================================================================
//  1.  DINE SCREEN (سفارش غذا)
// =====================================================================
const DINE_TABS = [
  { id: 'restaurants', icon: 'fa-solid fa-store', label: 'رستوران‌ها' },
  { id: 'orders', icon: 'fa-solid fa-shopping-bag', label: 'سفارشات من' },
  { id: 'chat', icon: 'fa-solid fa-comments', label: 'گفتگو' },
  { id: 'offers', icon: 'fa-solid fa-star', label: 'پیشنهادها' },
  { id: 'account', icon: 'fa-solid fa-user', label: 'حساب من' },
];

const MENU_CATEGORIES = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' },
  { id: 'iranian', label: 'ایرانی', icon: 'fa-solid fa-fire' },
  { id: 'fastfood', label: 'فست‌فود', icon: 'fa-solid fa-burger' },
  { id: 'salad', label: 'سالاد', icon: 'fa-solid fa-leaf' },
  { id: 'drink', label: 'نوشیدنی', icon: 'fa-solid fa-mug-hot' },
  { id: 'dessert', label: 'دسر', icon: 'fa-solid fa-ice-cream' },
];

const MENU_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  iranian: { label: 'غذای ایرانی', icon: 'fa-solid fa-fire' },
  fastfood: { label: 'فست‌فود', icon: 'fa-solid fa-burger' },
  salad: { label: 'سالاد و پیش‌غذا', icon: 'fa-solid fa-leaf' },
  drink: { label: 'نوشیدنی', icon: 'fa-solid fa-mug-hot' },
  dessert: { label: 'دسر', icon: 'fa-solid fa-ice-cream' },
};

interface MenuItem { id: number; name: string; desc: string; price: string; priceNum: number; category: string; image: string; rating: number; time: string; discount?: number; popular?: boolean }

const MENU_ITEMS: MenuItem[] = [
  { id: 1, name: 'چلوکباب سلطانی', desc: 'یک سیخ کوبیده + یک سیخ برگ با برنج زعفرانی', price: '۲۸۵,۰۰۰', priceNum: 285000, category: 'iranian', image: 'https://images.unsplash.com/photo-1634324092536-74480096b939?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzaWFuJTIwZm9vZCUyMGtlYmFiJTIwcmljZXxlbnwxfHx8fDE3NzE4NTg3MjV8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.8, time: '۳۰ دقیقه', popular: true },
  { id: 2, name: 'پیتزا مخلوط', desc: 'پیتزا با گوشت چرخ‌کرده و سبزیجات', price: '۱۸۵,۰۰۰', priceNum: 185000, category: 'fastfood', image: 'https://images.unsplash.com/photo-1609795829951-325b91a41471?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGRlbGl2ZXJ5JTIwZm9vZHxlbnwxfHx8fDE3NzE4NTE4ODJ8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.5, time: '۲۵ دقیقه', discount: 15 },
  { id: 3, name: 'جوجه کباب ویژه', desc: 'جوجه کباب با برنج زعفرانی و گوجه', price: '۲۲۰,۰۰۰', priceNum: 220000, category: 'iranian', image: 'https://images.unsplash.com/photo-1564636242997-77953084df48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMHBsYXRlJTIwbWVhbHxlbnwxfHx8fDE3NzE3ODUwNzB8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.7, time: '۳۵ دقیقه', popular: true },
  { id: 4, name: 'همبرگر مخصوص', desc: 'همبرگر دست‌ساز ۲۰۰ گرمی با پنیر و سس', price: '۱۴۵,۰۰۰', priceNum: 145000, category: 'fastfood', image: 'https://images.unsplash.com/photo-1614597546944-a54636047376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW1idXJnZXIlMjBmYXN0JTIwZm9vZHxlbnwxfHx8fDE3NzE4MjYxNTl8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.3, time: '۲۰ دقیقه', discount: 20 },
  { id: 5, name: 'سالاد سزار', desc: 'سالاد تازه با سینه مرغ و سس سزار', price: '۹۵,۰۰۰', priceNum: 95000, category: 'salad', image: 'https://images.unsplash.com/photo-1605034298551-baacf17591d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNhbGFkJTIwYm93bCUyMGhlYWx0aHl8ZW58MXx8fHwxNzcxODU4NzM1fDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.4, time: '۱۰ دقیقه' },
  { id: 6, name: 'زرشک‌پلو با مرغ', desc: 'برنج با زرشک و زعفران و ران مرغ', price: '۱۹۵,۰۰۰', priceNum: 195000, category: 'iranian', image: 'https://images.unsplash.com/photo-1654886966939-e7a8643469b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pJTIwcmljZSUyMHNhZmZyb24lMjBwbGF0ZXxlbnwxfHx8fDE3NzE4NTk5NzV8MA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.6, time: '۳۵ دقیقه' },
  { id: 7, name: 'قرمه‌سبزی', desc: 'خورشت قرمه‌سبزی با برنج ایرانی', price: '۱۷۰,۰۰۰', priceNum: 170000, category: 'iranian', image: 'https://images.unsplash.com/photo-1640542509430-f529fdfce835?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzaWFuJTIwc3RldyUyMGdob3JtZWglMjBmb29kfGVufDF8fHx8MTc3MTg1OTk3Nnww&ixlib=rb-4.1.0&q=80&w=400', rating: 4.9, time: '۴۰ دقیقه', popular: true },
  { id: 8, name: 'فلافل رپ', desc: 'فلافل تازه با سبزیجات در نان لواش', price: '۸۵,۰۰۰', priceNum: 85000, category: 'fastfood', image: 'https://images.unsplash.com/photo-1697126248475-a537cc5cce28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWxhZmVsJTIwd3JhcCUyMG1pZGRsZSUyMGVhc3Rlcm58ZW58MXx8fHwxNzcxODA5MzczfDA&ixlib=rb-4.1.0&q=80&w=400', rating: 4.2, time: '۱۵ دقیقه' },
  { id: 9, name: 'نوشابه', desc: 'نوشابه قوطی ۳۳۰ میلی‌لیتر', price: '۲۵,۰۰۰', priceNum: 25000, category: 'drink', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.3, time: '۵ دقیقه' },
  { id: 10, name: 'دوغ محلی', desc: 'دوغ سنتی با نعنا', price: '۳۰,۰۰۰', priceNum: 30000, category: 'drink', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.6, time: '۵ دقیقه' },
  { id: 11, name: 'سالاد فصل', desc: 'سبزیجات تازه فصل با سس مخصوص', price: '۷۵,۰۰۰', priceNum: 75000, category: 'salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.4, time: '۱۰ دقیقه' },
  { id: 12, name: 'بستنی سنتی', desc: 'بستنی زعفرانی با خلال پسته', price: '۶۵,۰۰۰', priceNum: 65000, category: 'dessert', image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.7, time: '۵ دقیقه', popular: true },
  { id: 13, name: 'شله‌زرد', desc: 'دسر سنتی برنج با زعفران و دارچین', price: '۵۵,۰۰۰', priceNum: 55000, category: 'dessert', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80', rating: 4.5, time: '۵ دقیقه' },
];

interface CartItem { menuItem: MenuItem; qty: number }

// Dine orders
interface DineOrder { id: number; num: string; items: string; status: 'preparing' | 'delivering' | 'delivered' | 'cancelled'; restaurant: string; date: string; total: string; eta?: string; progress?: number }

export const DINE_ORDERS: DineOrder[] = [
  { id: 1, num: '۱۰۲۶', items: 'چلوکباب سلطانی × ۲', status: 'preparing', restaurant: 'رستوران شاندیز', date: 'امروز ۱۲:۳۰', total: '۵۷۰,۰۰۰', eta: '۲۰ دقیقه', progress: 60 },
  { id: 2, num: '۱۰۲۵', items: 'پیتزا مخلوط + نوشابه', status: 'delivering', restaurant: 'فست‌فود نیکا', date: 'امروز ۱۱:۰۰', total: '۲۱۵,۰۰۰', eta: '۱۰ دقیقه', progress: 85 },
  { id: 3, num: '۱۰۲۴', items: 'همبرگر مخصوص × ۳', status: 'delivered', restaurant: 'فست‌فود نیکا', date: 'دیروز', total: '۴۳۵,۰۰۰' },
  { id: 4, num: '۱۰۲۳', items: 'چلوکباب سلطانی + قرمه‌سبزی', status: 'delivered', restaurant: 'رستوران شاندیز', date: '۲ روز پیش', total: '۴۵۵,۰۰۰' },
  { id: 5, num: '۱۰۲۲', items: 'سالاد سزار + آب‌میوه', status: 'cancelled', restaurant: 'سالاد بار سبز', date: '۳ روز پیش', total: '۱۳۵,۰۰۰' },
  { id: 6,  num: '۱۰۲۱', items: 'جوجه‌کباب + برنج زعفرانی', status: 'delivered', restaurant: 'رستوران شاندیز', date: '۴ روز پیش', total: '۳۸۵,۰۰۰' },
  { id: 7,  num: '۱۰۲۰', items: 'پیتزا پپرونی × ۲', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۵ روز پیش', total: '۴۹۰,۰۰۰' },
  { id: 8,  num: '۱۰۱۹', items: 'ساندویچ مرغ + سیب‌زمینی', status: 'delivered', restaurant: 'فست‌فود نیکا', date: '۶ روز پیش', total: '۱۸۵,۰۰۰' },
  { id: 9,  num: '۱۰۱۸', items: 'دیزی سنگی', status: 'delivered', restaurant: 'سفره خانه سنتی', date: '۷ روز پیش', total: '۲۲۰,۰۰۰' },
  { id: 10, num: '۱۰۱۷', items: 'سالاد یونانی + سوپ', status: 'cancelled', restaurant: 'سالاد بار سبز', date: '۸ روز پیش', total: '۱۶۵,۰۰۰' },
  { id: 11, num: '۱۰۱۶', items: 'برگر دوبل + نوشابه', status: 'delivered', restaurant: 'فست‌فود نیکا', date: '۹ روز پیش', total: '۲۹۵,۰۰۰' },
  { id: 12, num: '۱۰۱۵', items: 'قرمه سبزی + سالاد شیرازی', status: 'delivered', restaurant: 'رستوران دربار', date: '۱۰ روز پیش', total: '۲۸۵,۰۰۰' },
  { id: 13, num: '۱۰۱۴', items: 'پاستا آلفردو', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۱۲ روز پیش', total: '۳۲۰,۰۰۰' },
  { id: 14, num: '۱۰۱۳', items: 'کباب کوبیده × ۴', status: 'delivered', restaurant: 'رستوران شاندیز', date: '۱۴ روز پیش', total: '۶۸۰,۰۰۰' },
  { id: 15, num: '۱۰۱۲', items: 'مرغ بریان کامل', status: 'delivered', restaurant: 'بریانی شعبه مرکزی', date: '۱۶ روز پیش', total: '۴۲۰,۰۰۰' },
  { id: 16, num: '۱۰۱۱', items: 'سوشی مخصوص × ۲', status: 'delivered', restaurant: 'سوشی توکیو', date: '۱۸ روز پیش', total: '۸۹۰,۰۰۰' },
  { id: 17, num: '۱۰۱۰', items: 'فلافل رپ + نوشابه', status: 'cancelled', restaurant: 'فلافل خوشمزه', date: '۲۰ روز پیش', total: '۹۵,۰۰۰' },
  { id: 18, num: '۱۰۰۹', items: 'باقالی پلو با ماهیچه', status: 'delivered', restaurant: 'رستوران دربار', date: '۲۲ روز پیش', total: '۵۲۰,۰۰۰' },
  { id: 19, num: '۱۰۰۸', items: 'پیتزا قارچ و گوشت', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۲۵ روز پیش', total: '۳۸۰,۰۰۰' },
  { id: 20, num: '۱۰۰۷', items: 'استیک گوشت + سالاد', status: 'delivered', restaurant: 'استیک‌هاوس کلاسیک', date: '۲۸ روز پیش', total: '۹۸۰,۰۰۰' },
  { id: 21, num: '۱۰۰۶', items: 'چلوماهی قزل‌آلا', status: 'delivered', restaurant: 'رستوران دربار', date: '۳۲ روز پیش', total: '۴۸۰,۰۰۰' },
  { id: 22, num: '۱۰۰۵', items: 'برگر چیز × ۲', status: 'delivered', restaurant: 'فست‌فود نیکا', date: '۳۵ روز پیش', total: '۳۲۰,۰۰۰' },
  { id: 23, num: '۱۰۰۴', items: 'لازانیا گوشت', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۴۰ روز پیش', total: '۲۹۰,۰۰۰' },
  { id: 24, num: '۱۰۰۳', items: 'خوراک ماهی + سبزیجات', status: 'delivered', restaurant: 'رستوران دریایی', date: '۴۵ روز پیش', total: '۵۶۰,۰۰۰' },
  { id: 25, num: '۱۰۰۲', items: 'سالاد سزار با مرغ', status: 'cancelled', restaurant: 'سالاد بار سبز', date: '۵۰ روز پیش', total: '۱۴۵,۰۰۰' },
  { id: 26, num: '۱۰۰۱', items: 'بیریانی هندی', status: 'delivered', restaurant: 'هند فود', date: '۵۵ روز پیش', total: '۳۶۵,۰۰۰' },
  { id: 27, num: '۱۰۰۰', items: 'کباب لقمه + ماست', status: 'delivered', restaurant: 'رستوران شاندیز', date: '۶۰ روز پیش', total: '۲۷۵,۰۰۰' },
  { id: 28, num: '۹۹۹',  items: 'پاستا کاربونارا', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۷۰ روز پیش', total: '۳۱۰,۰۰۰' },
  { id: 29, num: '۹۹۸',  items: 'جوجه چینی + برنج', status: 'delivered', restaurant: 'رستوران چینی پکن', date: '۸۰ روز پیش', total: '۲۸۰,۰۰۰' },
  { id: 30, num: '۹۹۷',  items: 'تاکو مکزیکی × ۳', status: 'delivered', restaurant: 'مکزیکی فیستا', date: '۹۰ روز پیش', total: '۳۹۵,۰۰۰' },
  { id: 31, num: '۹۹۶',  items: 'استیک سالمون', status: 'delivered', restaurant: 'رستوران دریایی', date: '۱۰۰ روز پیش', total: '۷۲۰,۰۰۰' },
  { id: 32, num: '۹۹۵',  items: 'کباب ترش گیلانی', status: 'delivered', restaurant: 'رستوران دربار', date: '۱۲۰ روز پیش', total: '۴۹۰,۰۰۰' },
  { id: 33, num: '۹۹۴',  items: 'پیتزا چهار فصل', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۱۴۰ روز پیش', total: '۴۲۰,۰۰۰' },
  { id: 34, num: '۹۹۳',  items: 'فاهیتا با مرغ', status: 'delivered', restaurant: 'مکزیکی فیستا', date: '۱۶۰ روز پیش', total: '۳۸۵,۰۰۰' },
  { id: 35, num: '۹۹۲',  items: 'سوشی سالمون × ۳', status: 'delivered', restaurant: 'سوشی توکیو', date: '۱۸۰ روز پیش', total: '۹۲۰,۰۰۰' },
  { id: 36, num: '۹۹۱',  items: 'خوراک گوشت گوسفندی', status: 'delivered', restaurant: 'رستوران دربار', date: '۲۰۰ روز پیش', total: '۶۸۰,۰۰۰' },
  { id: 37, num: '۹۹۰',  items: 'برگر گیاهی', status: 'cancelled', restaurant: 'فست‌فود نیکا', date: '۲۲۰ روز پیش', total: '۱۹۵,۰۰۰' },
  { id: 38, num: '۹۸۹',  items: 'پیتزا مارگاریتا', status: 'delivered', restaurant: 'پیتزا ایتالیا', date: '۲۵۰ روز پیش', total: '۲۸۰,۰۰۰' },
  { id: 39, num: '۹۸۸',  items: 'سوپ جو + نان', status: 'delivered', restaurant: 'سفره خانه سنتی', date: '۲۸۰ روز پیش', total: '۱۱۰,۰۰۰' },
  { id: 40, num: '۹۸۷',  items: 'ابگوشت سنتی', status: 'delivered', restaurant: 'سفره خانه سنتی', date: '۳۲۰ روز پیش', total: '۱۹۰,۰۰۰' },
];

const dineOrderStatusMap: Record<string, { color: string; label: string; icon: string }> = {
  preparing: { color: '#F59E0B', label: 'در حال آماده‌سازی', icon: 'fa-solid fa-fire-burner' },
  delivering: { color: '#3B82F6', label: 'در حال ارسال', icon: 'fa-solid fa-motorcycle' },
  delivered: { color: '#10B981', label: 'تحویل شده', icon: 'fa-solid fa-circle-check' },
  cancelled: { color: '#EF4444', label: 'لغو شده', icon: 'fa-solid fa-ban' },
};

interface Restaurant { id: number; name: string; type: string; cuisine: string; rating: number; distance: string; deliveryTime: string; isOpen: boolean; minOrder: string; icon: string; color: string }

const CUISINE_CATEGORIES = [
  { id: 'all', label: 'همه', icon: 'fa-solid fa-utensils' },
  { id: 'iranian', label: 'ایرانی', icon: 'fa-solid fa-bowl-rice' },
  { id: 'fastfood', label: 'فست‌فود', icon: 'fa-solid fa-burger' },
  { id: 'italian', label: 'ایتالیایی', icon: 'fa-solid fa-pizza-slice' },
  { id: 'diet', label: 'سالاد و رژیمی', icon: 'fa-solid fa-leaf' },
  { id: 'kabab', label: 'کبابی', icon: 'fa-solid fa-fire-burner' },
  { id: 'seafood', label: 'دریایی', icon: 'fa-solid fa-fish' },
  { id: 'cafe', label: 'کافه و صبحانه', icon: 'fa-solid fa-mug-hot' },
];

const RESTAURANTS: Restaurant[] = [
  { id: 1, name: 'رستوران شاندیز', type: 'ایرانی سنتی', cuisine: 'iranian', rating: 4.8, distance: '۱.۲ km', deliveryTime: '۳۰-۴۵ دقیقه', isOpen: true, minOrder: '۱۵۰,۰۰۰', icon: 'fa-solid fa-utensils', color: '#F59E0B' },
  { id: 2, name: 'فست‌فود نیکا', type: 'فست‌فود', cuisine: 'fastfood', rating: 4.5, distance: '۰.۸ km', deliveryTime: '۲۰-۳۰ دقیقه', isOpen: true, minOrder: '۱۰۰,۰۰۰', icon: 'fa-solid fa-burger', color: '#EF4444' },
  { id: 3, name: 'رستوران سنتی دربار', type: 'سنتی لوکس', cuisine: 'iranian', rating: 4.9, distance: '۳.۵ km', deliveryTime: '۴۰-۶۰ دقیقه', isOpen: true, minOrder: '۲۰۰,۰۰۰', icon: 'fa-solid fa-crown', color: '#8B5CF6' },
  { id: 4, name: 'پیتزا هات', type: 'ایتالیایی', cuisine: 'italian', rating: 4.2, distance: '۲.۱ km', deliveryTime: '۲۵-۴۰ دقیقه', isOpen: false, minOrder: '۱۲۰,۰۰۰', icon: 'fa-solid fa-pizza-slice', color: '#3B82F6' },
  { id: 5, name: 'سالاد بار سبز', type: 'سلامت و رژیمی', cuisine: 'diet', rating: 4.6, distance: '۱.۵ km', deliveryTime: '۱۵-۲۵ دقیقه', isOpen: true, minOrder: '۸۰,۰۰۰', icon: 'fa-solid fa-seedling', color: '#10B981' },
  { id: 6, name: 'کبابی شعله', type: 'کباب و گریل', cuisine: 'kabab', rating: 4.7, distance: '۱.۹ km', deliveryTime: '۳۰-۵۰ دقیقه', isOpen: true, minOrder: '۱۳۰,۰۰۰', icon: 'fa-solid fa-fire-burner', color: '#DC2626' },
  { id: 7, name: 'برگر لند', type: 'فست‌فود', cuisine: 'fastfood', rating: 4.3, distance: '۱.۱ km', deliveryTime: '۲۰-۳۵ دقیقه', isOpen: true, minOrder: '۹۰,۰۰۰', icon: 'fa-solid fa-burger', color: '#F97316' },
  { id: 8, name: 'ماهی‌سرای خزر', type: 'غذای دریایی', cuisine: 'seafood', rating: 4.6, distance: '۴.۲ km', deliveryTime: '۴۰-۶۰ دقیقه', isOpen: true, minOrder: '۱۸۰,۰۰۰', icon: 'fa-solid fa-fish', color: '#0EA5E9' },
  { id: 9, name: 'پاستا میلانو', type: 'ایتالیایی', cuisine: 'italian', rating: 4.5, distance: '۲.۸ km', deliveryTime: '۳۰-۴۵ دقیقه', isOpen: true, minOrder: '۱۱۰,۰۰۰', icon: 'fa-solid fa-bowl-food', color: '#6366F1' },
  { id: 10, name: 'کافه صبحانه آفتاب', type: 'کافه و صبحانه', cuisine: 'cafe', rating: 4.8, distance: '۰.۶ km', deliveryTime: '۱۵-۲۵ دقیقه', isOpen: true, minOrder: '۷۰,۰۰۰', icon: 'fa-solid fa-mug-hot', color: '#D97706' },
  { id: 11, name: 'دیزی‌سرای سنتی', type: 'ایرانی سنتی', cuisine: 'iranian', rating: 4.4, distance: '۲.۳ km', deliveryTime: '۳۵-۵۰ دقیقه', isOpen: true, minOrder: '۱۰۰,۰۰۰', icon: 'fa-solid fa-bowl-rice', color: '#B45309' },
  { id: 12, name: 'جوجه‌کباب ناب', type: 'کباب و گریل', cuisine: 'kabab', rating: 4.5, distance: '۱.۷ km', deliveryTime: '۲۵-۴۰ دقیقه', isOpen: false, minOrder: '۱۲۰,۰۰۰', icon: 'fa-solid fa-drumstick-bite', color: '#EA580C' },
];

export interface Offer { id: number; title: string; desc: string; discount: number; restaurant: string; validUntil: string; code: string; color: string; icon: string }

export const OFFERS: Offer[] = [
  { id: 1, title: 'تخفیف اولین سفارش', desc: 'با ثبت اولین سفارش از هر رستوران', discount: 30, restaurant: 'همه رستوران‌ها', validUntil: 'تا پایان ماه', code: 'FIRST30', color: '#10B981', icon: 'fa-solid fa-gift' },
  { id: 2, title: 'پیشنهاد ویژه ناهار', desc: 'غذاهای منتخب ایرانی با تخفیف', discount: 20, restaurant: 'رستوران شاندیز', validUntil: 'روزهای کاری ۱۱-۱۴', code: 'LUNCH20', color: '#F97316', icon: 'fa-solid fa-sun' },
  { id: 3, title: 'جشنواره فست‌فود', desc: 'تخفیف روی همه فست‌فودها', discount: 15, restaurant: 'فست‌فود نیکا', validUntil: 'تا ۵ روز دیگر', code: 'FAST15', color: '#8B5CF6', icon: 'fa-solid fa-fire' },
  { id: 4, title: 'پیشنهاد AI برای شما', desc: 'قرمه‌سبزی — بر اساس سفارشات قبلی شما', discount: 10, restaurant: 'رستوران سنتی دربار', validUntil: 'فقط امروز', code: 'AI10', color: '#EC4899', icon: 'fa-solid fa-wand-magic-sparkles' },
];

const DINE_CHAT_MSGS = [
  { from: 'agent' as const, text: 'سلام! به ایجنت Dine خوش آمدید. چطور می‌تونم کمکتون کنم؟' },
  { from: 'user' as const, text: 'سلام، می‌خوام یه غذای ایرانی سفارش بدم.' },
  { from: 'agent' as const, text: 'عالیه! چلوکباب سلطانی و قرمه‌سبزی امروز پرطرفدارن. می‌خواین منو رو ببینین یا مستقیم سفارش بدین؟' },
  { from: 'user' as const, text: 'قرمه‌سبزی خوبه، یه پرس لطفاً.' },
  { from: 'agent' as const, text: 'یک پرس قرمه‌سبزی از رستوران شاندیز ثبت شد. زمان تقریبی: ۴۰ دقیقه. هزینه: ۱۷۰,۰۰۰ تومان. تأیید می‌کنین؟' },
];

function DineMenuTab() {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const { cartAdd, cartDec, cartQty } = useApp();
  const filtered = MENU_ITEMS.filter(m => (cat === 'all' || m.category === cat) && (!search || m.name.includes(search) || m.desc.includes(search)));

  const addToCart = useCallback((item: MenuItem) => cartAdd({ source: 'dine', key: 'd-' + item.id, name: item.name, priceNum: item.priceNum, restaurant: 'رستوران' }), [cartAdd]);
  const getQty = (id: number) => cartQty('d-' + id);
  const removeFromCart = useCallback((itemId: number) => cartDec('d-' + itemId), [cartDec]);

  const MENU_ORDER = ['iranian', 'fastfood', 'salad', 'drink', 'dessert'];
  const menuRows: Array<{ header: string } | { item: MenuItem }> = [];
  MENU_ORDER.forEach(c => {
    const items = filtered.filter(m => m.category === c);
    if (items.length) { menuRows.push({ header: c }); items.forEach(it => menuRows.push({ item: it })); }
  });
  filtered.filter(m => !MENU_ORDER.includes(m.category)).forEach(it => menuRows.push({ item: it }));

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
          <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
          <input className="flex-1 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
            placeholder="جستجوی غذا..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {MENU_CATEGORIES.map(c => (
          <button key={c.id}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] whitespace-nowrap cursor-pointer transition-all ${
              cat === c.id ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={cat === c.id ? { background: 'var(--aw-eu-primary)', fontWeight: 600 } : { fontWeight: 500 }}
            onClick={() => setCat(c.id)}>
            <i className={c.icon} />{c.label}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="px-4 grid gap-2.5">
        {menuRows.map((row, i) => {
          if ('header' in row) {
            const meta = MENU_CATEGORY_LABELS[row.header] || { label: row.header, icon: 'fa-solid fa-utensils' };
            return (
              <div key={'h-' + row.header} className="flex items-center gap-2 mt-2 mb-0.5 first:mt-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--aw-eu-primary)' }}>
                  <i className={`${meta.icon} text-[11px]`} />
                </div>
                <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{meta.label}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--aw-border)' }} />
              </div>
            );
          }
          const item = row.item;
          const qty = getQty(item.id);
          return (
            <motion.div key={item.id} className="flex gap-3 p-2.5" style={euCardStyle}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="w-[76px] h-[76px] rounded-xl overflow-hidden flex-shrink-0 relative">
                <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                {item.discount && (
                  <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded-md text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
                    {toFa(item.discount)}%
                  </span>
                )}
                {item.popular && !item.discount && (
                  <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded-md text-white" style={{ background: '#F59E0B', fontWeight: 700 }}>
                    <i className="fa-solid fa-fire text-[6px]" /> محبوب
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.name}</div>
                  <div className="text-[10px] text-[var(--aw-text-secondary)] truncate mt-0.5">{item.desc}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[13px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>{item.price}</span>
                    <span className="text-[8px] text-[var(--aw-text-muted)] mr-0.5">تومان</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-star text-[#F59E0B] text-[7px]" /> {item.rating}</span>
                    <span className="text-[9px] text-[var(--aw-text-muted)] mr-1"><i className="fa-regular fa-clock text-[7px]" /> {item.time}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-1">
                  {qty === 0 ? (
                    <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1"
                      style={{ background: 'var(--aw-eu-primary)', fontWeight: 600 }}
                      onClick={() => addToCart(item)}>
                      <i className="fa-solid fa-plus text-[8px]" /> افزودن
                    </button>
                  ) : (
                    <div className="flex items-center gap-0">
                      <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                        style={{ background: 'var(--aw-danger)' }} onClick={() => removeFromCart(item.id)}>
                        <i className={`fa-solid ${qty === 1 ? 'fa-trash' : 'fa-minus'} text-[9px]`} />
                      </button>
                      <span className="w-7 text-center text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(qty)}</span>
                      <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                        style={{ background: 'var(--aw-eu-primary)' }} onClick={() => addToCart(item)}>
                        <i className="fa-solid fa-plus text-[9px]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon="fa-solid fa-utensils" text="غذایی یافت نشد" />}
      </div>
    </div>
  );
}

function DineOrdersTab() {
  const { showToast, euPlacedOrders } = useApp();
  const [filter, setFilter] = useState('all');
  const placedDine = (euPlacedOrders || []).filter((o: any) => o.source === 'dine').map((o: any) => ({ ...o, restaurant: o.vendor }));
  const allDineOrders = [...placedDine, ...DINE_ORDERS];
  const filtered = filter === 'all' ? allDineOrders : allDineOrders.filter((o: any) => o.status === filter);

  const STATUS_FILTERS = [
    { id: 'all', label: 'همه', icon: 'fa-solid fa-border-all', color: 'var(--aw-eu-primary)' },
    { id: 'preparing', label: 'آماده‌سازی', icon: 'fa-solid fa-fire-burner', color: '#F59E0B' },
    { id: 'delivering', label: 'ارسال', icon: 'fa-solid fa-motorcycle', color: '#3B82F6' },
    { id: 'delivered', label: 'تحویل شده', icon: 'fa-solid fa-circle-check', color: '#10B981' },
    { id: 'cancelled', label: 'لغو شده', icon: 'fa-solid fa-ban', color: '#EF4444' },
  ];

  return (
    <div className="flex-1 overflow-y-auto aw-scroll min-h-0">
      {/* Status filters */}
      <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto">
        {STATUS_FILTERS.map(f => {
          const count = f.id === 'all' ? DINE_ORDERS.length : DINE_ORDERS.filter(o => o.status === f.id).length;
          return (
            <button key={f.id}
              className={`flex items-center gap-1 py-1.5 px-3 rounded-full border text-[10px] cursor-pointer transition-all whitespace-nowrap ${
                filter === f.id ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
              }`}
              style={filter === f.id ? { background: f.color, fontWeight: 600 } : { fontWeight: 500 }}
              onClick={() => setFilter(f.id)}>
              <i className={`${f.icon} text-[8px]`} />
              {f.label}
              {count > 0 && <span className="text-[8px] opacity-70">({toFa(count)})</span>}
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-1.5 px-4 pb-2">
        {[
          { label: 'آماده‌سازی', count: DINE_ORDERS.filter(o => o.status === 'preparing').length, color: '#F59E0B', icon: 'fa-solid fa-fire-burner' },
          { label: 'ارسال', count: DINE_ORDERS.filter(o => o.status === 'delivering').length, color: '#3B82F6', icon: 'fa-solid fa-motorcycle' },
          { label: 'تحویل', count: DINE_ORDERS.filter(o => o.status === 'delivered').length, color: '#10B981', icon: 'fa-solid fa-circle-check' },
          { label: 'لغو', count: DINE_ORDERS.filter(o => o.status === 'cancelled').length, color: '#EF4444', icon: 'fa-solid fa-ban' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={euCardStyle}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.color + '18' }}>
              <i className={`${s.icon} text-[11px]`} style={{ color: s.color }} />
            </div>
            <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{toFa(s.count)}</span>
            <span className="text-[8px] text-[var(--aw-text-muted)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Orders list */}
      <div className="pb-4 px-4">
        {filtered.map((ord, i) => {
          const st = dineOrderStatusMap[ord.status];
          return (
            <motion.div key={ord.id} className="p-3 mb-2" style={euCardStyle}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>#{ord.num}</span>
                    <StatusPill label={st.label} color={st.color} />
                  </div>
                  <div className="text-[13px] text-[var(--aw-text-primary)] mt-1" style={{ fontWeight: 600 }}>{ord.items}</div>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}15` }}>
                  <i className={`${st.icon} text-[14px]`} style={{ color: st.color }} />
                </div>
              </div>
              {ord.progress != null && (
                <div className="w-full h-1.5 rounded-full mb-2" style={{ background: 'rgba(126,95,170,0.1)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: st.color }}
                    initial={{ width: 0 }} animate={{ width: `${ord.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
                <span><i className="fa-solid fa-store text-[8px] ml-1" />{ord.restaurant}</span>
                <span><i className="fa-regular fa-clock text-[8px] ml-1" />{ord.date}</span>
                {ord.eta && <span className="text-[var(--aw-eu-primary)]" style={{ fontWeight: 600 }}><i className="fa-solid fa-truck text-[8px] ml-1" />{ord.eta}</span>}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(126,95,170,0.1)]">
                <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{ord.total} <span className="text-[9px] text-[var(--aw-text-muted)]">تومان</span></span>
                {(ord.status === 'preparing' || ord.status === 'delivering') && (
                  <button onClick={() => showToast('پیگیری سفارش: ' + (ord.status === 'preparing' ? 'در حال آماده‌سازی' : 'در حال ارسال'))} className="text-[10px] px-3 py-1.5 rounded-lg border border-[var(--aw-eu-primary)] bg-transparent text-[var(--aw-eu-primary)] cursor-pointer" style={{ fontWeight: 600 }}>
                    <i className="fa-solid fa-eye text-[8px] ml-1" />پیگیری
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <EmptyState icon="fa-solid fa-shopping-bag" text="سفارشی یافت نشد" />}
      </div>
    </div>
  );
}

// Restaurant menu items per restaurant
const SIDE_ITEMS = MENU_ITEMS.filter(m => m.category === 'salad' || m.category === 'drink' || m.category === 'dessert');
const RESTAURANT_MENUS: Record<number, MenuItem[]> = {
  1: [...MENU_ITEMS.filter(m => m.category === 'iranian'), ...SIDE_ITEMS],
  2: [...MENU_ITEMS.filter(m => m.category === 'fastfood'), ...SIDE_ITEMS],
  3: [...MENU_ITEMS.filter(m => m.category === 'iranian'), ...SIDE_ITEMS],
  4: [...MENU_ITEMS.filter(m => m.category === 'fastfood'), ...SIDE_ITEMS],
  5: [...MENU_ITEMS.filter(m => m.category === 'salad'), ...MENU_ITEMS.filter(m => m.category === 'drink' || m.category === 'dessert')],
};

// Restaurant reviews
const RESTAURANT_REVIEWS: { user: string; rating: number; text: string; date: string }[] = [
  { user: 'محمد ر.', rating: 5, text: 'غذای عالی و ارسال سریع. کباب سلطانی فوق‌العاده بود.', date: '۳ روز پیش' },
  { user: 'سارا ک.', rating: 4, text: 'کیفیت خوبه ولی زمان ارسال کمی طولانی بود.', date: '۱ هفته پیش' },
  { user: 'علی م.', rating: 5, text: 'بهترین رستوران ایرانی. قرمه‌سبزی خانگی واقعی!', date: '۲ هفته پیش' },
  { user: 'نازنین ح.', rating: 4, text: 'پرسنل مودب و بسته‌بندی تمیز.', date: '۳ هفته پیش' },
];

function RestaurantDetailView({ restaurant, onBack }: { restaurant: Restaurant; onBack: () => void }) {
  const { openChat, showToast, cartAdd, cartDec, cartQty } = useApp();
  const [detailTab, setDetailTab] = useState<'menu' | 'info' | 'rating' | 'chat'>('menu');
  const [menuCat, setMenuCat] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const menuItems = RESTAURANT_MENUS[restaurant.id] || MENU_ITEMS.slice(0, 3);

  const addToCart = useCallback((item: MenuItem) => cartAdd({ source: 'dine', key: 'd-' + item.id, name: item.name, priceNum: item.priceNum, restaurant: restaurant.name }), [cartAdd, restaurant.name]);
  const removeFromCart = useCallback((itemId: number) => cartDec('d-' + itemId), [cartDec]);
  const getQty = (id: number) => cartQty('d-' + id);

  const MENU_ORDER = ['iranian', 'fastfood', 'salad', 'drink', 'dessert'];
  const presentCats = MENU_ORDER.filter(cat => menuItems.some(m => m.category === cat));
  const visibleItems = menuCat === 'all' ? menuItems : menuItems.filter(m => m.category === menuCat);
  const menuRows: Array<{ header: string } | { item: MenuItem }> = [];
  MENU_ORDER.forEach(cat => {
    const items = visibleItems.filter(m => m.category === cat);
    if (items.length) { menuRows.push({ header: cat }); items.forEach(it => menuRows.push({ item: it })); }
  });
  visibleItems.filter(m => !MENU_ORDER.includes(m.category)).forEach(it => menuRows.push({ item: it }));

  const DETAIL_TABS = [
    { id: 'menu', icon: 'fa-solid fa-utensils', label: 'منو' },
    { id: 'info', icon: 'fa-solid fa-circle-info', label: 'اطلاعات' },
    { id: 'rating', icon: 'fa-solid fa-star', label: 'امتیاز' },
    { id: 'chat', icon: 'fa-solid fa-comments', label: 'گفتگو' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Restaurant header banner */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button className="w-8 h-8 rounded-lg border border-[var(--aw-border)] bg-transparent text-[var(--aw-text-secondary)] cursor-pointer flex items-center justify-center hover:text-[var(--aw-eu-primary)] transition-all"
            onClick={onBack}>
            <i className="fa-solid fa-arrow-right text-[12px]" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: restaurant.color }}>
            <i className={`${restaurant.icon} text-[16px]`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{restaurant.name}</span>
              {restaurant.isOpen ? <StatusPill label="باز" color="#10B981" /> : <StatusPill label="بسته" color="#EF4444" />}
            </div>
            <div className="text-[10px] text-[var(--aw-text-muted)]">{restaurant.type}</div>
          </div>
          <div className="flex items-center gap-0.5 text-[14px] text-[#F59E0B]" style={{ fontWeight: 800 }}>
            <i className="fa-solid fa-star text-[10px]" /> {restaurant.rating}
          </div>
        </div>

        {/* Detail tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--aw-bg-hover)' }}>
          {DETAIL_TABS.map(t => (
            <button key={t.id}
              className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[11px] flex items-center justify-center gap-1 transition-all"
              style={{
                background: detailTab === t.id ? 'var(--aw-eu-primary)' : 'transparent',
                color: detailTab === t.id ? '#fff' : 'var(--aw-text-secondary)',
                fontWeight: detailTab === t.id ? 700 : 500,
              }}
              onClick={() => setDetailTab(t.id as any)}>
              <i className={`${t.icon} text-[10px]`} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {detailTab === 'menu' && (
          <motion.div key="r-menu" className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-1"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {presentCats.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto aw-noscroll pb-2 -mx-1 px-1 sticky top-0 z-10" style={{ background: 'var(--aw-eu-bg)' }}>
                {[{ id: 'all', label: 'همه', icon: 'fa-solid fa-bars-staggered' }, ...presentCats.map(c => ({ id: c, label: MENU_CATEGORY_LABELS[c]?.label || c, icon: MENU_CATEGORY_LABELS[c]?.icon || 'fa-solid fa-utensils' }))].map(c => (
                  <button key={c.id}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full border-none cursor-pointer text-[11px] flex items-center gap-1.5 transition-all"
                    style={{
                      background: menuCat === c.id ? 'var(--aw-eu-primary)' : 'var(--aw-bg-hover)',
                      color: menuCat === c.id ? '#fff' : 'var(--aw-text-secondary)',
                      fontWeight: menuCat === c.id ? 700 : 500,
                    }}
                    onClick={() => setMenuCat(c.id)}>
                    <i className={`${c.icon} text-[9px]`} /> {c.label}
                  </button>
                ))}
              </div>
            )}
            {menuRows.map((row, i) => {
              if ('header' in row) {
                const meta = MENU_CATEGORY_LABELS[row.header] || { label: row.header, icon: 'fa-solid fa-utensils' };
                return (
                  <div key={'h-' + row.header} className="flex items-center gap-2 mt-3 mb-2 first:mt-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--aw-eu-primary)' }}>
                      <i className={`${meta.icon} text-[11px]`} />
                    </div>
                    <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{meta.label}</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--aw-border)' }} />
                  </div>
                );
              }
              const item = row.item;
              const qty = getQty(item.id);
              return (
                <motion.div key={item.id} className="flex gap-3 p-2.5 mb-1.5" style={euCardStyle}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div onClick={() => setDetailItem(item)} className="w-[76px] h-[76px] rounded-xl overflow-hidden flex-shrink-0 relative cursor-pointer">
                    <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {item.discount && (
                      <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded-md text-white" style={{ background: '#EF4444', fontWeight: 700 }}>
                        {toFa(item.discount)}%
                      </span>
                    )}
                    {item.popular && !item.discount && (
                      <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded-md text-white" style={{ background: '#F59E0B', fontWeight: 700 }}>
                        <i className="fa-solid fa-fire text-[6px]" /> محبوب
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div onClick={() => setDetailItem(item)} className="cursor-pointer">
                      <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.name}</div>
                      <div className="text-[10px] text-[var(--aw-text-secondary)] truncate mt-0.5">{item.desc}</div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <span className="text-[13px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>{item.price}</span>
                        <span className="text-[8px] text-[var(--aw-text-muted)] mr-0.5">تومان</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-star text-[#F59E0B] text-[7px]" /> {item.rating}</span>
                        <span className="text-[9px] text-[var(--aw-text-muted)] mr-1"><i className="fa-regular fa-clock text-[7px]" /> {item.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-1">
                      {qty === 0 ? (
                        <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1"
                          style={{ background: 'var(--aw-eu-primary)', fontWeight: 600 }}
                          onClick={() => addToCart(item)}>
                          <i className="fa-solid fa-plus text-[8px]" /> افزودن
                        </button>
                      ) : (
                        <div className="flex items-center gap-0">
                          <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                            style={{ background: 'var(--aw-danger)' }} onClick={() => removeFromCart(item.id)}>
                            <i className={`fa-solid ${qty === 1 ? 'fa-trash' : 'fa-minus'} text-[9px]`} />
                          </button>
                          <span className="w-7 text-center text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{toFa(qty)}</span>
                          <button className="w-7 h-7 rounded-lg border-none text-white cursor-pointer flex items-center justify-center text-[11px]"
                            style={{ background: 'var(--aw-eu-primary)' }} onClick={() => addToCart(item)}>
                            <i className="fa-solid fa-plus text-[9px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {menuItems.length === 0 && <EmptyState icon="fa-solid fa-utensils" text="منویی موجود نیست" />}
          </motion.div>
        )}

        {detailTab === 'info' && (
          <motion.div key="r-info" className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-2"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <div className="p-4 rounded-2xl mb-3" style={euCardStyle}>
              <SectionTitle icon="fa-solid fa-circle-info" title="درباره رستوران" />
              <p className="text-[12px] text-[var(--aw-text-secondary)] mt-2" style={{ lineHeight: '2' }}>
                {restaurant.name} یکی از معتبرترین رستوران‌های {restaurant.type} در منطقه است که با تجربه‌ای طولانی در ارائه غذاهای اصیل و باکیفیت، مشتریان زیادی را به خود جلب کرده است.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { icon: 'fa-solid fa-location-arrow', label: 'فاصله', value: restaurant.distance, color: '#3B82F6' },
                { icon: 'fa-solid fa-clock', label: 'زمان ارسال', value: restaurant.deliveryTime, color: '#F59E0B' },
                { icon: 'fa-solid fa-coins', label: 'حداقل سفارش', value: restaurant.minOrder + ' ت', color: '#10B981' },
                { icon: 'fa-solid fa-star', label: 'امتیاز', value: String(restaurant.rating), color: '#8B5CF6' },
              ].map(info => (
                <div key={info.label} className="p-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: info.color + '18' }}>
                    <i className={`${info.icon} text-[13px]`} style={{ color: info.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--aw-text-muted)]">{info.label}</div>
                    <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{info.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl" style={euCardStyle}>
              <SectionTitle icon="fa-solid fa-clock" title="ساعات کاری" />
              <div className="space-y-1.5 mt-2">
                {['شنبه تا چهارشنبه: ۱۱:۰۰ - ۲۳:۰۰', 'پنج‌شنبه: ۱۱:۰۰ - ۲۴:۰۰', 'جمعه: ۱۲:۰۰ - ۲۴:۰۰'].map(h => (
                  <div key={h} className="text-[11px] text-[var(--aw-text-secondary)] flex items-center gap-1.5">
                    <i className="fa-regular fa-clock text-[9px] text-[var(--aw-text-muted)]" /> {h}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {detailTab === 'rating' && (
          <motion.div key="r-rating" className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-2"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {/* Rating summary */}
            <div className="p-4 rounded-2xl mb-3 flex items-center gap-4" style={euCardStyle}>
              <div className="text-center">
                <div className="text-[32px] text-[#F59E0B]" style={{ fontWeight: 900 }}>{restaurant.rating}</div>
                <div className="flex items-center gap-0.5 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <i key={s} className={`fa-solid fa-star text-[11px] ${s <= Math.round(restaurant.rating) ? 'text-[#F59E0B]' : 'text-[var(--aw-text-muted)] opacity-30'}`} />
                  ))}
                </div>
                <div className="text-[10px] text-[var(--aw-text-muted)] mt-1">از ۱۲۸ نظر</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === 5 ? 65 : star === 4 ? 25 : star === 3 ? 7 : star === 2 ? 2 : 1;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--aw-text-muted)] w-3">{toFa(star)}</span>
                      <i className="fa-solid fa-star text-[8px] text-[#F59E0B]" />
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--aw-bg-hover)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#F59E0B' }} />
                      </div>
                      <span className="text-[9px] text-[var(--aw-text-muted)] w-6 text-left">{toFa(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            <SectionTitle icon="fa-solid fa-comment-dots" title="نظرات کاربران" />
            {RESTAURANT_REVIEWS.map((rv, i) => (
              <motion.div key={i} className="p-3 mb-2" style={euCardStyle}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <LetterAvatar name={rv.user} size={32} radius={9} />
                    <div>
                      <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{rv.user}</div>
                      <div className="text-[9px] text-[var(--aw-text-muted)]">{rv.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <i key={s} className={`fa-solid fa-star text-[9px] ${s <= rv.rating ? 'text-[#F59E0B]' : 'text-[var(--aw-text-muted)] opacity-30'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--aw-text-secondary)] m-0" style={{ lineHeight: '1.8' }}>{rv.text}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {detailTab === 'chat' && (
          <motion.div key="r-chat" className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <MiniChatPreview
              messages={[
                { from: 'agent', text: `سلام! به ${restaurant.name} خوش آمدید. چطور می‌تونم کمکتون کنم؟` },
                { from: 'user', text: 'سلام، می‌خوام سفارش بدم.' },
                { from: 'agent', text: 'البته! منوی ما آماده است. می‌تونید از تب منو غذای مورد نظرتون رو انتخاب کنید یا به من بگید چه نوع غذایی میل دارید.' },
              ]}
              agentName={restaurant.name}
              agentIcon={restaurant.icon}
              agentColor={restaurant.color}
              onOpenFull={() => openChat('restaurant', 'eu')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food detail popup */}
      <AnimatePresence>
        {detailItem && (
          <motion.div className="absolute inset-0 z-40 flex items-end md:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailItem(null)}>
            <motion.div className="w-full md:max-w-[420px] rounded-t-[24px] md:rounded-[24px] overflow-hidden flex flex-col"
              style={{ background: 'var(--aw-bg-modal, #fff)', backdropFilter: 'blur(28px) saturate(1.4)', WebkitBackdropFilter: 'blur(28px) saturate(1.4)', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)', maxHeight: '85%' }}
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              onClick={e => e.stopPropagation()}>
              <div className="relative w-full h-[200px] flex-shrink-0">
                <ImageWithFallback src={detailItem.image} alt={detailItem.name} className="w-full h-full object-cover" />
                <button onClick={() => setDetailItem(null)} className="absolute top-3 left-3 w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                  <i className="fa-solid fa-xmark text-[15px]" />
                </button>
                {detailItem.discount && (
                  <span className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded-lg text-white" style={{ background: '#EF4444', fontWeight: 700 }}>{toFa(detailItem.discount)}% تخفیف</span>
                )}
              </div>
              <div className="p-4 overflow-y-auto aw-scroll flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[17px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>{detailItem.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 text-[11px] text-[var(--aw-text-secondary)]">
                    <span><i className="fa-solid fa-star text-[#F59E0B] text-[10px]" /> {detailItem.rating}</span>
                    <span><i className="fa-regular fa-clock text-[10px]" /> {detailItem.time}</span>
                  </div>
                </div>
                <p className="text-[13px] text-[var(--aw-text-primary)]" style={{ lineHeight: '2', opacity: 0.85 }}>{detailItem.desc}</p>
                <div className="flex items-center gap-2 text-[11px] text-[var(--aw-text-primary)]">
                  <span className="px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-eu-primary)', fontWeight: 600 }}><i className="fa-solid fa-store text-[9px]" />{restaurant.name}</span>
                  <span className="px-2.5 py-1 rounded-lg" style={{ background: 'var(--aw-primary-bg)', color: 'var(--aw-eu-primary)', fontWeight: 600 }}>{MENU_CATEGORY_LABELS[detailItem.category]?.label || detailItem.category}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--aw-border)]">
                  <span><span className="text-[18px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 800 }}>{detailItem.price}</span> <span className="text-[10px] text-[var(--aw-text-secondary)]">تومان</span></span>
                  {getQty(detailItem.id) > 0 && <span className="text-[11px] text-[var(--aw-text-secondary)]">{toFa(getQty(detailItem.id))} عدد در سبد</span>}
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => { addToCart(detailItem); }} className="flex-1 py-3 rounded-xl border-none text-white text-[14px] cursor-pointer flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary), #14b8a6)', fontWeight: 700 }}>
                    <i className="fa-solid fa-plus text-[12px]" /> افزودن به سبد
                  </button>
                  <button onClick={() => setDetailItem(null)} className="py-3 px-5 rounded-xl border border-[var(--aw-border)] text-[13px] cursor-pointer" style={{ fontWeight: 600, background: 'var(--aw-bg-card)', color: 'var(--aw-text-primary)' }}>
                    بستن
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DineRestaurantsTab({ onSelectRestaurant, onBack }: { onSelectRestaurant: (r: Restaurant) => void; onBack?: () => void }) {
  const [filter, setFilter] = useState<'all' | 'nearest' | 'popular' | 'discount'>('all');
  const [cuisine, setCuisine] = useState('all');
  const [search, setSearch] = useState('');

  let filtered = RESTAURANTS.filter(r => (cuisine === 'all' || r.cuisine === cuisine) && (!search || r.name.includes(search) || r.type.includes(search)));
  if (filter === 'nearest') filtered = [...filtered].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  if (filter === 'popular') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (filter === 'discount') filtered = filtered.filter(r => r.isOpen);

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} title="بازگشت"
              className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(127,127,127,0.12)', border: '1px solid var(--aw-eu-primary)', color: 'var(--aw-eu-primary)' }}>
              <i className="fa-solid fa-arrow-right text-[14px]" />
            </button>
          )}
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 border border-[var(--aw-border)]" style={{ background: 'var(--aw-bg-input)' }}>
            <i className="fa-solid fa-search text-sm text-[var(--aw-text-muted)]" />
            <input className="flex-1 min-w-0 bg-transparent border-none py-2.5 text-[13px] text-[var(--aw-text-primary)] outline-none placeholder:text-[var(--aw-text-muted)]"
              placeholder="جستجوی رستوران..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="bg-transparent border-none text-[var(--aw-text-muted)] cursor-pointer" onClick={() => setSearch('')}><i className="fa-solid fa-times text-sm" /></button>}
          </div>
        </div>
      </div>

      {/* Cuisine categories */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto aw-scroll-x" style={{ scrollbarWidth: 'none' }}>
        {CUISINE_CATEGORIES.map(c => {
          const on = cuisine === c.id;
          return (
            <button key={c.id} onClick={() => setCuisine(c.id)}
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer bg-transparent border-none" style={{ width: 60 }}>
              <span className="flex items-center justify-center rounded-[16px] transition-all"
                style={{ width: 52, height: 52, background: on ? 'var(--aw-eu-primary)' : 'var(--aw-bg-card)', border: '1px solid ' + (on ? 'var(--aw-eu-primary)' : 'var(--aw-border)'), color: on ? '#fff' : 'var(--aw-eu-primary)' }}>
                <i className={c.icon + ' text-[18px]'} />
              </span>
              <span className="text-[10px] text-center leading-tight" style={{ fontWeight: on ? 700 : 500, color: on ? 'var(--aw-eu-primary)' : 'var(--aw-text-secondary)' }}>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' },
          { id: 'nearest', label: 'نزدیک‌ترین', icon: 'fa-solid fa-location-arrow' },
          { id: 'popular', label: 'محبوب‌ترین', icon: 'fa-solid fa-fire' },
          { id: 'discount', label: 'فعال', icon: 'fa-solid fa-check-circle' },
        ].map(f => (
          <button key={f.id}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[11px] whitespace-nowrap cursor-pointer transition-all ${
              filter === f.id ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={filter === f.id ? { background: 'var(--aw-eu-primary)', fontWeight: 600 } : { fontWeight: 500 }}
            onClick={() => setFilter(f.id as any)}>
            <i className={`${f.icon} text-[9px]`} /> {f.label}
          </button>
        ))}
      </div>

      {/* Restaurant list */}
      <div className="px-4">
        {filtered.map((r, i) => (
          <motion.div key={r.id} className="p-3 mb-2 cursor-pointer active:scale-[0.98] transition-transform" style={{ ...euCardStyle, opacity: r.isOpen ? 1 : 0.55 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: r.isOpen ? 1 : 0.55, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => onSelectRestaurant(r)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[18px]" style={{ background: r.color }}>
                <i className={r.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{r.name}</span>
                  {r.isOpen ? <StatusPill label="باز" color="#10B981" /> : <StatusPill label="بسته" color="#EF4444" />}
                </div>
                <div className="text-[10px] text-[var(--aw-text-secondary)] mt-0.5">{r.type}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-0.5 text-[13px] text-[#F59E0B]" style={{ fontWeight: 700 }}>
                  <i className="fa-solid fa-star text-[9px]" /> {r.rating}
                </div>
                <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-[var(--aw-text-muted)] mt-2 pr-14">
              <span><i className="fa-solid fa-location-arrow text-[8px] ml-1" />{r.distance}</span>
              <span><i className="fa-solid fa-clock text-[8px] ml-1" />{r.deliveryTime}</span>
              <span><i className="fa-solid fa-coins text-[8px] ml-1" />حداقل: {r.minOrder}</span>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <EmptyState icon="fa-solid fa-store" text="رستورانی یافت نشد" />}
      </div>
    </div>
  );
}

function DineChatTab() {
  const CHAT_LIST: ChatListItem[] = [
    { id: 'shandiz', name: 'رستوران شاندیز', icon: 'fa-solid fa-utensils', color: '#F59E0B', lastMsg: 'سفارش شما در حال آماده‌سازی است.', time: '۱۰ دقیقه پیش', unread: 1, online: true },
    { id: 'nika', name: 'فست‌فود نیکا', icon: 'fa-solid fa-burger', color: '#EF4444', lastMsg: 'سفارش شما تحویل داده شد. نظرتون رو ثبت کنید.', time: '۱ ساعت پیش', unread: 0, online: true },
    { id: 'support', name: 'پشتیبانی سفارش غذا', icon: 'fa-solid fa-headset', color: '#3B82F6', lastMsg: 'سفارش ۱۰۲۶ حدود ۲۰ دقیقه دیگه می‌رسه.', time: '۳۰ دقیقه پیش', unread: 2, online: true },
    { id: 'darbar', name: 'رستوران سنتی دربار', icon: 'fa-solid fa-crown', color: '#8B5CF6', lastMsg: 'ممنون از سفارش شما! منتظرتون هستیم.', time: 'دیروز', unread: 0, online: false },
  ];

  const INTERACTION_MESSAGES: Record<string, { from: 'user' | 'agent'; text: string }[]> = {
    shandiz: [
      { from: 'agent', text: 'سلام! سفارش شماره ۱۰۲۶ ثبت شد.' },
      { from: 'user', text: 'ممنون، چقدر طول می‌کشه؟' },
      { from: 'agent', text: 'سفارش شما در حال آماده‌سازی است. حدوداً ۲۰ دقیقه دیگه ارسال می‌شه.' },
    ],
    nika: [
      { from: 'agent', text: 'سفارش شما آماده ارسال است.' },
      { from: 'user', text: 'عالی، ممنون!' },
      { from: 'agent', text: 'سفارش شما تحویل داده شد. نظرتون رو ثبت کنید.' },
    ],
    support: [
      { from: 'agent', text: 'سلام! پشتیبانی سفارش غذا در خدمت شماست.' },
      { from: 'user', text: 'سفارشم دیر شده، می‌خوام پیگیری کنم.' },
      { from: 'agent', text: 'لطفاً شماره سفارشتون رو بفرمایید.' },
      { from: 'user', text: 'شماره ۱۰۲۶ هست.' },
      { from: 'agent', text: 'سفارش ۱۰۲۶ در حال آماده‌سازی در رستوران شاندیز هست و حدود ۲۰ دقیقه دیگه به دستتون می‌رسه.' },
    ],
    darbar: [
      { from: 'agent', text: 'سلام! به رستوران سنتی دربار خوش آمدید.' },
      { from: 'user', text: 'سلام، قرمه‌سبزی دارین؟' },
      { from: 'agent', text: 'بله! قرمه‌سبزی خانگی با برنج ایرانی. ممنون از سفارش شما! منتظرتون هستیم.' },
    ],
  };

  const AGENT_CARDS: AgentCardItem[] = [
    { id: 'diet-ai', name: 'مشاور تغذیه', desc: 'برنامه غذایی و کالری‌شماری', icon: 'fa-solid fa-heartbeat', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
  ];

  const AGENT_TOPICS: Record<string, AgentTopicItem[]> = {
    'food-ai': [
      { id: 'food-t1', title: 'پیشنهاد ناهار امروز', date: '۱ ساعت پیش', msgs: 4, active: true },
      { id: 'food-t2', title: 'انتخاب غذا برای مهمانی', date: 'دیروز', msgs: 8 },
      { id: 'food-t3', title: 'بهترین غذای ایرانی', date: '۳ روز پیش', msgs: 5 },
    ],
    'diet-ai': [
      { id: 'diet-t1', title: 'برنامه رژیم هفتگی', date: '۲ ساعت پیش', msgs: 6, active: true, category: 'رژیم و کالری' },
      { id: 'diet-t2', title: 'غذای کم‌کالری', date: 'دیروز', msgs: 3, category: 'رژیم و کالری' },
      { id: 'diet-t3', title: 'پیشنهاد ناهار سالم', date: '۳ ساعت پیش', msgs: 4, category: 'پیشنهاد غذا' },
      { id: 'diet-t4', title: 'جایگزین سالم فست‌فود', date: '۲ روز پیش', msgs: 5, category: 'پیشنهاد غذا' },
      { id: 'diet-t5', title: 'مقدار پروتئین روزانه', date: '۴ روز پیش', msgs: 3, category: 'سلامت و تغذیه' },
      { id: 'diet-t6', title: 'آب و مایعات روزانه', date: '۵ روز پیش', msgs: 2, category: 'سلامت و تغذیه' },
    ],
    'order-ai': [
      { id: 'order-t1', title: 'پیگیری سفارش ۱۰۲۶', date: '۱۰ دقیقه پیش', msgs: 2, active: true },
      { id: 'order-t2', title: 'پیگیری سفارش ۱۰۲۵', date: '۱ ساعت پیش', msgs: 3 },
    ],
    'review-ai': [
      { id: 'review-t1', title: 'بهترین رستوران ایرانی', date: '۳۰ دقیقه پیش', msgs: 4, active: true },
      { id: 'review-t2', title: 'مقایسه فست‌فودها', date: '۲ روز پیش', msgs: 6 },
    ],
  };

  const TOPIC_MESSAGES: Record<string, { from: 'user' | 'agent'; text: string }[]> = {
    'food-t1': [
      { from: 'user', text: 'چی پیشنهاد میدی برای ناهار؟' },
      { from: 'agent', text: 'با توجه به سفارشات قبلی‌تون:\n\n🥇 قرمه‌سبزی رستوران شاندیز\n🥈 زرشک‌پلو با مرغ رستوران دربار\n🥉 جوجه کباب ویژه شاندیز\n\nکدوم رو سفارش بدم؟' },
    ],
    'food-t2': [
      { from: 'user', text: 'برای ۶ نفر مهمان غذا لازم دارم.' },
      { from: 'agent', text: 'پیشنهاد من: ۳ پرس چلوکباب سلطانی + ۲ پرس زرشک‌پلو + ۱ سالاد فصل.\nجمع: ۱,۳۰۰,۰۰۰ تومان از شاندیز.' },
    ],
    'food-t3': [
      { from: 'user', text: 'بهترین غذای ایرانی چیه؟' },
      { from: 'agent', text: 'قرمه‌سبزی رستوران شاندیز با امتیاز ۴.۹ بالاترین امتیاز رو داره!' },
    ],
    'diet-t1': [
      { from: 'user', text: 'برنامه غذایی رژیمی این هفته رو بده.' },
      { from: 'agent', text: 'برنامه پیشنهادی:\nشنبه: سالاد سزار (۳۲۰ کالری)\nیکشنبه: فلافل رپ (۴۱۰ کالری)\nدوشنبه: سالاد بار سبز (۲۸۰ کالری)' },
    ],
    'diet-t2': [
      { from: 'user', text: 'غذای کم‌کالری می‌خوام.' },
      { from: 'agent', text: 'سالاد سزار از سالاد بار سبز — ۳۲۰ کالری، ۹۵,۰۰۰ تومان.' },
    ],
    'diet-t3': [
      { from: 'user', text: 'برای ناهار چی سالمه؟' },
      { from: 'agent', text: 'پیشنهاد سالم امروز:\n🥗 سالاد مرغ گریل (۳۸۰ کالری)\n🥙 رپ سبزیجات (۴۲۰ کالری)\nهر دو از سالاد بار سبز.' },
    ],
    'diet-t4': [
      { from: 'user', text: 'جای پیتزا چی بخورم سالم‌تره؟' },
      { from: 'agent', text: 'به‌جای پیتزا پپرونی (۸۵۰ کالری)، نان تست سبزیجات با پنیر کم‌چرب (۴۳۰ کالری) پیشنهاد می‌کنم.' },
    ],
    'diet-t5': [
      { from: 'user', text: 'روزی چقدر پروتئین لازم دارم؟' },
      { from: 'agent', text: 'با وزن شما حدود ۹۰ تا ۱۱۰ گرم پروتئین در روز کافیه — معادل ۲ پرس مرغ گریل یا عدسی.' },
    ],
    'diet-t6': [
      { from: 'user', text: 'چقدر آب بخورم؟' },
      { from: 'agent', text: 'روزانه حدود ۲ تا ۲.۵ لیتر آب — یعنی ۸ تا ۱۰ لیوان. قبل هر وعده یک لیوان آب کمک می‌کنه.' },
    ],
    'diet-t3': [
      { from: 'user', text: 'برای ناهار چی سالمه؟' },
      { from: 'agent', text: 'پیشنهاد سالم امروز:\n🥗 سالاد مرغ گریل (۳۸۰ کالری)\n🥙 رپ سبزیجات (۴۲۰ کالری)\nهر دو از سالاد بار سبز.' },
    ],
    'diet-t4': [
      { from: 'user', text: 'جای پیتزا چی بخورم سالم‌تره؟' },
      { from: 'agent', text: 'به‌جای پیتزا پپرونی (۸۵۰ کالری)، نان تست سبزیجات با پنیر کم‌چرب (۴۳۰ کالری) پیشنهاد می‌کنم.' },
    ],
    'diet-t5': [
      { from: 'user', text: 'روزی چقدر پروتئین لازم دارم؟' },
      { from: 'agent', text: 'با وزن شما حدود ۹۰ تا ۱۱۰ گرم پروتئین در روز کافیه — معادل ۲ پرس مرغ گریل یا عدسی.' },
    ],
    'diet-t6': [
      { from: 'user', text: 'چقدر آب بخورم؟' },
      { from: 'agent', text: 'روزانه حدود ۲ تا ۲.۵ لیتر آب — یعنی ۸ تا ۱۰ لیوان. قبل هر وعده یک لیوان آب کمک می‌کنه.' },
    ],
    'order-t1': [
      { from: 'agent', text: '📦 سفارش ۱۰۲۶ — در حال آماده‌سازی (۲۰ دقیقه مانده)' },
    ],
    'order-t2': [
      { from: 'agent', text: '🏍️ سفارش ۱۰۲۵ — تحویل داده شد.' },
      { from: 'user', text: 'ممنون!' },
    ],
    'review-t1': [
      { from: 'user', text: 'بهترین رستوران ایرانی کجاست؟' },
      { from: 'agent', text: '🏆 ۱. رستوران سنتی دربار — ⭐ ۴.۹\n۲. رستوران شاندیز — ⭐ ۴.۸' },
    ],
    'review-t2': [
      { from: 'user', text: 'فست‌فود نیکا یا پیتزا هات؟' },
      { from: 'agent', text: 'نیکا: ⭐ ۴.۵ — نزدیک‌تر و سریع‌تر\nپیتزا هات: ⭐ ۴.۲ — تنوع بیشتر ولی فعلاً بسته‌ست.' },
    ],
  };

  const SUGGESTIONS = {
    'food-ai': ['چی پیشنهاد میدی؟', 'غذای محبوب چیه؟', 'تخفیف دارین؟'],
    'diet-ai': ['رژیم کم‌کالری', 'غذای سالم', 'برنامه هفتگی'],
    'order-ai': ['وضعیت سفارشم', 'کی می‌رسه؟', 'لغو سفارش'],
    'review-ai': ['بهترین رستوران', 'مقایسه قیمت‌ها', 'نظرات کاربران'],
  };
  return <AgentChatTabUI chatList={CHAT_LIST} interactionMessages={INTERACTION_MESSAGES} agentCards={AGENT_CARDS} agentTopics={AGENT_TOPICS} topicMessages={TOPIC_MESSAGES} suggestionsByAgent={SUGGESTIONS} uniqueKey="dine" />;
}

function DineOffersTab() {
  const { showToast } = useApp();
  const [offerFilter, setOfferFilter] = useState<'all' | 'personal' | 'discount' | 'popular'>('all');

  const POPULAR_ITEMS = MENU_ITEMS.filter(m => m.popular).map(m => ({
    ...m,
    orderCount: m.id === 1 ? '۱,۲۰۰' : m.id === 3 ? '۸۵۰' : '۶۲۰',
  }));

  const PERSONAL_OFFERS: Offer[] = OFFERS.filter(o => o.icon.includes('wand') || o.icon.includes('gift'));
  const DISCOUNT_OFFERS: Offer[] = OFFERS.filter(o => !o.icon.includes('wand'));

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll">
      {/* Filter tabs */}
      <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'همه', icon: 'fa-solid fa-border-all' },
          { id: 'personal', label: 'شخصی‌سازی شده', icon: 'fa-solid fa-wand-magic-sparkles' },
          { id: 'discount', label: 'تخفیف‌ها', icon: 'fa-solid fa-percent' },
          { id: 'popular', label: 'پرطرفدار', icon: 'fa-solid fa-fire' },
        ].map(f => (
          <button key={f.id}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[11px] whitespace-nowrap cursor-pointer transition-all ${
              offerFilter === f.id ? 'text-white border-transparent' : 'bg-transparent text-[var(--aw-text-secondary)] border-[var(--aw-border)]'
            }`}
            style={offerFilter === f.id ? { background: 'var(--aw-eu-primary)', fontWeight: 600 } : { fontWeight: 500 }}
            onClick={() => setOfferFilter(f.id as any)}>
            <i className={`${f.icon} text-[9px]`} /> {f.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {/* Personalized section */}
        {(offerFilter === 'all' || offerFilter === 'personal') && (
          <div className="mb-3">
            <SectionTitle icon="fa-solid fa-wand-magic-sparkles" title="پیشنهاد ویژه برای شما" extra={<StatusPill label="AI" color="#EC4899" />} />
            {PERSONAL_OFFERS.map((o, i) => (
              <motion.div key={o.id} className="p-3 mb-2 overflow-hidden relative" style={euCardStyle}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: o.color, filter: 'blur(24px)' }} />
                <div className="flex items-start gap-3 mb-2 relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[16px]" style={{ background: o.color }}>
                    <i className={o.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.title}</div>
                    <div className="text-[11px] text-[var(--aw-text-secondary)] mt-0.5">{o.desc}</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[15px]" style={{ background: `${o.color}cc`, fontWeight: 800 }}>
                    {toFa(o.discount)}%
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
                  <span><i className="fa-solid fa-store text-[8px] ml-1" />{o.restaurant}</span>
                  <span><i className="fa-solid fa-calendar text-[8px] ml-1" />{o.validUntil}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(126,95,170,0.1)]">
                  <span className="text-[11px] text-[var(--aw-text-muted)] flex items-center gap-1">
                    <i className="fa-solid fa-tag text-[8px]" />کد: <span className="text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>{o.code}</span>
                  </span>
                  <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1" style={{ background: o.color, fontWeight: 600 }}
                    onClick={() => showToast(`کد تخفیف ${o.code} کپی شد`)}>
                    <i className="fa-solid fa-copy text-[8px]" /> کپی کد
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Discounts section */}
        {(offerFilter === 'all' || offerFilter === 'discount') && (
          <div className="mb-3">
            <SectionTitle icon="fa-solid fa-percent" title="تخفیف‌ها و کدهای تخفیف" />
            {DISCOUNT_OFFERS.map((o, i) => (
              <motion.div key={o.id} className="p-3 mb-2 overflow-hidden relative" style={euCardStyle}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: o.color, filter: 'blur(24px)' }} />
                <div className="flex items-start gap-3 mb-2 relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[16px]" style={{ background: o.color }}>
                    <i className={o.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{o.title}</div>
                    <div className="text-[11px] text-[var(--aw-text-secondary)] mt-0.5">{o.desc}</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[15px]" style={{ background: `${o.color}cc`, fontWeight: 800 }}>
                    {toFa(o.discount)}%
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
                    <span><i className="fa-solid fa-store text-[8px] ml-1" />{o.restaurant}</span>
                    <span><i className="fa-solid fa-calendar text-[8px] ml-1" />{o.validUntil}</span>
                  </div>
                  <button className="text-[10px] px-3 py-1.5 rounded-lg border-none text-white cursor-pointer flex items-center gap-1" style={{ background: o.color, fontWeight: 600 }}
                    onClick={() => showToast(`کد تخفیف ${o.code} کپی شد`)}>
                    <i className="fa-solid fa-copy text-[8px]" /> {o.code}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Popular foods section */}
        {(offerFilter === 'all' || offerFilter === 'popular') && (
          <div className="mb-3">
            <SectionTitle icon="fa-solid fa-fire" title="غذاهای پرطرفدار" />
            {POPULAR_ITEMS.map((item, i) => (
              <motion.div key={item.id} className="flex gap-3 p-2.5 mb-1.5" style={euCardStyle}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute top-1 right-1 text-[7px] px-1 py-0.5 rounded-md text-white" style={{ background: '#F59E0B', fontWeight: 700 }}>
                    <i className="fa-solid fa-fire text-[6px]" /> محبوب
                  </span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{item.name}</div>
                    <div className="text-[10px] text-[var(--aw-text-secondary)] truncate mt-0.5">{item.desc}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[12px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>{item.price} <span className="text-[8px] text-[var(--aw-text-muted)]">تومان</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-star text-[#F59E0B] text-[7px]" /> {item.rating}</span>
                      <span className="text-[9px] text-[var(--aw-text-muted)]"><i className="fa-solid fa-bag-shopping text-[7px]" /> {item.orderCount} سفارش</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DineAccountTab() {
  const { showToast, euProfile } = useApp();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedSection(prev => prev === id ? null : id);

  const ADDRESSES = [
    { id: 1, title: 'خانه', address: 'تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳', icon: 'fa-solid fa-house', isDefault: true },
    { id: 2, title: 'محل کار', address: 'تهران، سعادت‌آباد، بلوار دریا، ساختمان آلفا', icon: 'fa-solid fa-building', isDefault: false },
  ];

  const PAYMENTS = [
    { id: 1, title: 'کیف پول Neura', balance: '۲,۴۵۰,۰۰۰ تومان', icon: 'fa-solid fa-wallet', color: '#8B5CF6', isDefault: true },
    { id: 2, title: 'کارت بانکی ملت', last4: '****۴۵۶۷', icon: 'fa-solid fa-credit-card', color: '#EF4444', isDefault: false },
    { id: 3, title: 'کارت بانکی ملی', last4: '****۸۹۰۱', icon: 'fa-solid fa-credit-card', color: '#3B82F6', isDefault: false },
  ];

  const HISTORY = [
    { id: 1, items: 'چلوکباب سلطانی × ۲', restaurant: 'شاندیز', date: '۴ اسفند ۱۴۰۴', total: '۵۷۰,۰۰۰', status: 'delivered' as const },
    { id: 2, items: 'پیتزا مخلوط + نوشابه', restaurant: 'فست‌فود نیکا', date: '۳ اسفند ۱۴۰۴', total: '۲۱۵,۰۰۰', status: 'delivered' as const },
    { id: 3, items: 'همبرگر مخصوص × ۳', restaurant: 'فست‌فود نیکا', date: '۲ اسفند ۱۴۰۴', total: '۴۳۵,۰۰۰', status: 'delivered' as const },
    { id: 4, items: 'سالاد سزار + آب‌میوه', restaurant: 'سالاد بار سبز', date: '۱ اسفند ۱۴۰۴', total: '۱۳۵,۰۰۰', status: 'cancelled' as const },
    { id: 5, items: 'قرمه‌سبزی', restaurant: 'رستوران دربار', date: '۲۸ بهمن ۱۴۰۴', total: '۱۷۰,۰۰۰', status: 'delivered' as const },
  ];

  const SECTIONS = [
    { id: 'addresses', icon: 'fa-solid fa-map-marker-alt', label: 'آدرس‌های من', color: '#3B82F6', count: ADDRESSES.length },
    { id: 'payments', icon: 'fa-solid fa-credit-card', label: 'روش‌های پرداخت', color: '#10B981', count: PAYMENTS.length },
    { id: 'history', icon: 'fa-solid fa-clock-rotate-left', label: 'تاریخچه خرید', color: '#F59E0B', count: HISTORY.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-4 aw-scroll px-4 pt-3">
      {/* Profile card */}
      <div className="p-4 rounded-2xl mb-3" style={{ ...euCardStyle, background: 'linear-gradient(135deg, var(--aw-eu-primary), #14b8a6)' }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] border-2 border-white/30"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 800 }}>
            {euProfile.avatar || 'P'}
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white" style={{ fontWeight: 800 }}>{euProfile.name}</div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{euProfile.phone || '۰۹۱۲۳۴۵۶۷۸۹'}</div>
          </div>
          <button className="w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white cursor-pointer flex items-center justify-center"
            onClick={() => showToast('ویرایش پروفایل')}>
            <i className="fa-solid fa-pen text-[12px]" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/15">
          <div className="flex-1 text-center">
            <div className="text-[16px] text-white" style={{ fontWeight: 800 }}>۲۳</div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>سفارش</div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex-1 text-center">
            <div className="text-[16px] text-white" style={{ fontWeight: 800 }}>۴.۸</div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>امتیاز</div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-0.5">
              <StatusPill label="طلایی" color="#F59E0B" />
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>سطح</div>
          </div>
        </div>
      </div>

      {/* Expandable sections */}
      {SECTIONS.map((section, si) => (
        <div key={section.id} className="mb-2">
          <motion.div className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.06 }}
            onClick={() => toggle(section.id)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: section.color + '18' }}>
              <i className={`${section.icon} text-[14px]`} style={{ color: section.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{section.label}</div>
              <div className="text-[10px] text-[var(--aw-text-muted)]">{toFa(section.count)} مورد</div>
            </div>
            <i className={`fa-solid fa-chevron-${expandedSection === section.id ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)] transition-transform`} />
          </motion.div>

          <AnimatePresence>
            {expandedSection === section.id && (
              <motion.div className="mt-1 space-y-1"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                {section.id === 'addresses' && ADDRESSES.map(addr => (
                  <div key={addr.id} className="p-3 mr-3 rounded-xl flex items-start gap-2.5" style={euCardStyle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#3B82F618' }}>
                      <i className={`${addr.icon} text-[12px] text-[#3B82F6]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{addr.title}</span>
                        {addr.isDefault && <StatusPill label="پیش‌فرض" color="#10B981" />}
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)] mt-0.5" style={{ lineHeight: '1.7' }}>{addr.address}</div>
                    </div>
                  </div>
                ))}

                {section.id === 'payments' && PAYMENTS.map(pay => (
                  <div key={pay.id} className="p-3 mr-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: pay.color + '18' }}>
                      <i className={`${pay.icon} text-[12px]`} style={{ color: pay.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{pay.title}</span>
                        {pay.isDefault && <StatusPill label="پیش‌فرض" color="#10B981" />}
                      </div>
                      <div className="text-[10px] text-[var(--aw-text-muted)]">{pay.balance || pay.last4}</div>
                    </div>
                  </div>
                ))}

                {section.id === 'history' && HISTORY.map(h => (
                  <div key={h.id} className="p-3 mr-3 rounded-xl" style={euCardStyle}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{h.items}</span>
                      <StatusPill label={h.status === 'delivered' ? 'تحویل شده' : 'لغو شده'} color={h.status === 'delivered' ? '#10B981' : '#EF4444'} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--aw-text-muted)]">
                      <span><i className="fa-solid fa-store text-[8px] ml-1" />{h.restaurant}</span>
                      <span><i className="fa-regular fa-clock text-[8px] ml-1" />{h.date}</span>
                      <span className="text-[var(--aw-eu-primary)] mr-auto" style={{ fontWeight: 700 }}>{h.total} ت</span>
                    </div>
                  </div>
                ))}

                {/* Add button */}
                <button className="w-full p-2.5 mr-3 rounded-xl border border-dashed border-[var(--aw-border)] bg-transparent text-[11px] text-[var(--aw-text-muted)] cursor-pointer flex items-center justify-center gap-1.5 hover:border-[var(--aw-eu-primary)] hover:text-[var(--aw-eu-primary)] transition-all"
                  onClick={() => showToast(`افزودن ${section.label}`)}>
                  <i className="fa-solid fa-plus text-[9px]" />
                  {section.id === 'addresses' ? 'افزودن آدرس جدید' : section.id === 'payments' ? 'افزودن روش پرداخت' : 'مشاهده بیشتر'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Extra expandable sections */}
      <div className="mt-2 space-y-1.5">
        {[
          {
            id: 'favorites', icon: 'fa-solid fa-heart', label: 'غذاهای مورد علاقه', color: '#EF4444', desc: '۵ مورد',
            items: [
              { t: 'چلوکباب سلطانی', s: 'رستوران شاندیز', p: '۲۸۵,۰۰۰', icon: 'fa-solid fa-drumstick-bite' },
              { t: 'پیتزا پپرونی', s: 'فست‌فود نیکا', p: '۱۹۵,۰۰۰', icon: 'fa-solid fa-pizza-slice' },
              { t: 'قرمه‌سبزی', s: 'رستوران دربار', p: '۱۷۰,۰۰۰', icon: 'fa-solid fa-bowl-food' },
              { t: 'سالاد سزار', s: 'سالاد بار سبز', p: '۹۵,۰۰۰', icon: 'fa-solid fa-leaf' },
              { t: 'برگر مخصوص', s: 'فست‌فود نیکا', p: '۱۴۵,۰۰۰', icon: 'fa-solid fa-burger' },
            ],
          },
          {
            id: 'notifications', icon: 'fa-solid fa-bell', label: 'تنظیمات اعلان', color: '#F59E0B', desc: 'فعال',
            toggles: [
              { t: 'وضعیت سفارش', s: 'آماده‌سازی، ارسال و تحویل', on: true },
              { t: 'تخفیف‌ها و کدها', s: 'اطلاع از کدهای ویژه', on: true },
              { t: 'پیشنهاد دستیار غذا', s: 'پیشنهادهای روزانه AI', on: true },
              { t: 'نظرسنجی پس از سفارش', s: 'یادآور ثبت نظر', on: false },
              { t: 'اعلان صوتی', s: 'پخش صدای اعلان', on: false },
            ],
          },
          {
            id: 'support', icon: 'fa-solid fa-circle-question', label: 'پشتیبانی و راهنما', color: '#6B7280', desc: '',
            links: [
              { t: 'سوالات متداول', s: '۱۲ مقاله', icon: 'fa-solid fa-list' },
              { t: 'تماس با پشتیبانی', s: '۲۴ ساعته', icon: 'fa-solid fa-headset' },
              { t: 'گزارش مشکل سفارش', s: 'برای سفارش‌های اخیر', icon: 'fa-solid fa-triangle-exclamation' },
              { t: 'راهنمای استفاده', s: 'آموزش گام به گام', icon: 'fa-solid fa-book-open' },
            ],
          },
        ].map(item => (
          <div key={item.id}>
            <div className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
              onClick={() => toggle(item.id)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '18' }}>
                <i className={`${item.icon} text-[13px]`} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 600 }}>{item.label}</div>
                {item.desc && <div className="text-[10px] text-[var(--aw-text-muted)]">{item.desc}</div>}
              </div>
              <i className={`fa-solid fa-chevron-${expandedSection === item.id ? 'up' : 'down'} text-[10px] text-[var(--aw-text-muted)]`} />
            </div>
            <AnimatePresence>
              {expandedSection === item.id && (
                <motion.div className="mt-1 space-y-1"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  {item.items && item.items.map((f, i) => (
                    <div key={i} className="p-3 mr-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '18' }}>
                        <i className={`${f.icon} text-[12px]`} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{f.t}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{f.s}</div>
                      </div>
                      <span className="text-[11px] text-[var(--aw-eu-primary)]" style={{ fontWeight: 700 }}>{f.p} ت</span>
                    </div>
                  ))}
                  {item.toggles && item.toggles.map((tg, i) => (
                    <div key={i} className="p-3 mr-3 rounded-xl flex items-center gap-2.5" style={euCardStyle}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{tg.t}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{tg.s}</div>
                      </div>
                      <div className={`w-9 h-5 rounded-full relative transition-colors`} style={{ background: tg.on ? 'var(--aw-eu-primary)' : 'var(--aw-border)' }}>
                        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ [tg.on ? 'left' : 'right']: '2px' } as any} />
                      </div>
                    </div>
                  ))}
                  {item.links && item.links.map((lk, i) => (
                    <div key={i} className="p-3 mr-3 rounded-xl flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform" style={euCardStyle}
                      onClick={() => showToast(lk.t)}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '18' }}>
                        <i className={`${lk.icon} text-[12px]`} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--aw-text-primary)]" style={{ fontWeight: 700 }}>{lk.t}</div>
                        <div className="text-[10px] text-[var(--aw-text-muted)]">{lk.s}</div>
                      </div>
                      <i className="fa-solid fa-chevron-left text-[10px] text-[var(--aw-text-muted)]" />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EuDineScreen() {
  const { setEuScreen, cartCount } = useApp();
  const [tab, setTab] = useState('restaurants');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const activeOrders = DINE_ORDERS.filter(o => o.status === 'preparing' || o.status === 'delivering').length;
  const dineTabs = DINE_TABS.map(t => {
    if (t.id === 'orders') return { ...t, badge: activeOrders > 0 ? activeOrders : undefined };
    return t;
  });

  // If a restaurant is selected & we're on the restaurants tab, show its detail
  if (selectedRestaurant && tab === 'restaurants') {
    return (
      <div className="flex flex-col h-full relative">
        <RestaurantDetailView restaurant={selectedRestaurant} onBack={() => setSelectedRestaurant(null)} />

        {/* Floating cart bar inside restaurant */}
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.div className="absolute bottom-14 left-4 right-4 z-20"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-none text-white cursor-pointer"
                style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary), #14b8a6)', boxShadow: '0 4px 20px rgba(126,95,170,0.4)' }}
                onClick={() => { setSelectedRestaurant(null); setEuScreen('euCartScreen'); }}>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-shopping-cart" />
                  <span className="text-[12px]" style={{ fontWeight: 600 }}>مشاهده سبد خرید</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 700 }}>{toFa(cartCount)} آیتم</span>
                </div>
                <span className="text-[13px]" style={{ fontWeight: 700 }}><i className="fa-solid fa-arrow-left text-[11px]" /></span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {tab !== 'restaurants' && (
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 flex-shrink-0" style={{ order: 0, background: 'var(--aw-bg-header)' }}>
          <button onClick={() => setEuScreen('euHomeScreen')} title="بازگشت"
            className="w-9 h-9 rounded-[12px] cursor-pointer flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(127,127,127,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--aw-eu-primary)', color: 'var(--aw-eu-primary)' }}>
            <i className="fa-solid fa-arrow-right text-[14px]" />
          </button>
          <span className="text-[15px] text-[var(--aw-text-primary)]" style={{ fontWeight: 800 }}>سفارش غذا</span>
        </div>
      )}
      <AgentTabBar tabs={dineTabs} active={tab} onChange={setTab} asFooter />
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col min-h-0"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
          {tab === 'restaurants' && <DineRestaurantsTab onSelectRestaurant={setSelectedRestaurant} onBack={() => setEuScreen('euHomeScreen')} />}
          {tab === 'orders' && <DineOrdersTab />}
          {tab === 'chat' && <DineChatTab />}
          {tab === 'offers' && <DineOffersTab />}
          {tab === 'account' && <DineAccountTab />}
        </motion.div>
      </AnimatePresence>

      {/* Floating cart bar */}
      <AnimatePresence>
        {cartCount > 0 && tab === 'restaurants' && (
          <motion.div className="absolute bottom-14 left-4 right-4 z-20"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-none text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--aw-eu-primary), #14b8a6)', boxShadow: '0 4px 20px rgba(126,95,170,0.4)' }}
              onClick={() => setEuScreen('euCartScreen')}>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shopping-cart" />
                <span className="text-[12px]" style={{ fontWeight: 600 }}>مشاهده سبد خرید</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 700 }}>{toFa(cartCount)} آیتم</span>
              </div>
              <span className="text-[13px]" style={{ fontWeight: 700 }}><i className="fa-solid fa-arrow-left text-[11px]" /></span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
