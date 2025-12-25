import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Cart } from '../schemas/cart.schema';
import { CartItem } from '../schemas/cart-item.schema';

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(CartItem.name) private readonly cartItemModel: Model<CartItem>,
  ) {}

  /**
   * پاک کردن خودکار سبدهای خرید منقضی شده
   * ❌ غیرفعال شده: Cart ها دیگر به صورت خودکار حذف نمی‌شوند
   * ✅ Cart ها فقط هنگام checkout (createOrder) بررسی می‌شوند و در صورت انقضا حذف می‌شوند
   */
  // @Cron(CronExpression.EVERY_MINUTE) // ❌ غیرفعال شده
  async handleExpiredCarts() {
    // ❌ این متد دیگر اجرا نمی‌شود
    // Cart ها دیگر به صورت خودکار حذف نمی‌شوند
    // Cart ها فقط هنگام checkout (createOrder) بررسی می‌شوند
    this.logger.debug(
      'Cart cleanup service غیرفعال شده - Cart ها فقط هنگام checkout بررسی می‌شوند',
    );
    return;
  }

  /**
   * به‌روزرسانی lastActivityAt و expiresAt سبد خرید
   * این متد فقط وقتی فعالیت واقعی انجام می‌شود فراخوانی می‌شود (افزودن/ویرایش/حذف محصول)
   * در این حالت timer باید reset شود (10 دقیقه جدید)
   *
   * ⚠️ توجه: این متد در getCartDetails فراخوانی نمی‌شود تا timer از همان زمان باقیمانده ادامه دهد
   */
  async updateCartActivity(cartId: string) {
    try {
      const cart = await this.cartModel.findById(cartId).exec();

      if (cart) {
        // وقتی فعالیت واقعی انجام می‌شود، timer را reset کن (10 دقیقه جدید)
        cart.lastActivityAt = new Date();
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 10);
        cart.expiresAt = expirationTime;
        await cart.save();
      }
    } catch (error) {
      this.logger.error(
        `خطا در به‌روزرسانی فعالیت سبد ${cartId}: ${error.message}`,
      );
    }
  }
}
