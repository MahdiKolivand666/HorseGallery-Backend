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
   * هر 1 دقیقه یکبار اجرا می‌شود
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredCarts() {
    this.logger.debug('بررسی سبدهای خرید منقضی شده...');

    try {
      const now = new Date();
      
      // پیدا کردن سبدهای منقضی شده
      const expiredCarts = await this.cartModel
        .find({
          expiresAt: { $lt: now },
        })
        .exec();

      if (expiredCarts.length === 0) {
        this.logger.debug('هیچ سبد خرید منقضی شده‌ای یافت نشد');
        return;
      }

      this.logger.log(
        `پیدا شد ${expiredCarts.length} سبد خرید منقضی شده برای پاک کردن`,
      );

      // پاک کردن آیتم‌های سبد و خود سبد
      for (const cart of expiredCarts) {
        try {
          // حذف آیتم‌های سبد
          await this.cartItemModel.deleteMany({ cart: cart._id }).exec();
          
          // حذف سبد
          await cart.deleteOne();
          
          this.logger.debug(`سبد خرید ${cart._id} پاک شد`);
        } catch (error) {
          this.logger.error(
            `خطا در پاک کردن سبد ${cart._id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `✅ ${expiredCarts.length} سبد خرید منقضی شده پاک شد`,
      );
    } catch (error) {
      this.logger.error(`خطا در پاک کردن سبدهای منقضی شده: ${error.message}`);
    }
  }

  /**
   * به‌روزرسانی lastActivityAt و expiresAt سبد خرید
   */
  async updateCartActivity(cartId: string) {
    try {
      const cart = await this.cartModel.findById(cartId).exec();
      
      if (cart) {
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

