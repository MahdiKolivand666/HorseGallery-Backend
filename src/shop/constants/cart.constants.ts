/**
 * Cart Constants
 *
 * این فایل شامل تمام constants مربوط به cart است.
 * برای تغییر زمان counter، فقط این فایل را ویرایش کنید.
 */

/**
 * زمان انقضای سبد خرید (به دقیقه)
 *
 * ⚠️ توجه: این زمان از lastActivityAt محاسبه می‌شود
 * یعنی هر بار که کاربر فعالیتی انجام می‌دهد (افزودن/ویرایش/حذف محصول)،
 * timer از ابتدا reset می‌شود.
 *
 * مثال:
 * - اگر CART_EXPIRATION_MINUTES = 10 باشد، سبد خرید 10 دقیقه بعد از آخرین فعالیت منقضی می‌شود
 * - اگر CART_EXPIRATION_MINUTES = 15 باشد، سبد خرید 15 دقیقه بعد از آخرین فعالیت منقضی می‌شود
 *
 * ✅ برای تغییر زمان counter، فقط این مقدار را تغییر دهید
 */
export const CART_EXPIRATION_MINUTES = 1;

/**
 * زمان انقضای سبد خرید (به میلی‌ثانیه)
 * برای استفاده در محاسبات
 */
export const CART_EXPIRATION_MS = CART_EXPIRATION_MINUTES * 60 * 1000;

/**
 * زمان انقضای سبد خرید (به ثانیه)
 * برای استفاده در frontend counter
 */
export const CART_EXPIRATION_SECONDS = CART_EXPIRATION_MINUTES * 60;
