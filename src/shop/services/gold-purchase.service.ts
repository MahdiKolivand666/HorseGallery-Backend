import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoldPurchase } from '../schemas/gold-purchase.schema';
import { GoldInvestmentService } from './gold-investment.service';
import { AddGoldToCartDto } from '../dtos/add-gold-to-cart.dto';
import { CART_EXPIRATION_MINUTES, CART_EXPIRATION_MS } from '../constants/cart.constants';

@Injectable()
export class GoldPurchaseService {
  private readonly logger = new Logger(GoldPurchaseService.name);

  constructor(
    @InjectModel(GoldPurchase.name)
    private readonly goldPurchaseModel: Model<GoldPurchase>,
    private readonly goldInvestmentService: GoldInvestmentService,
  ) {}

  /**
   * افزودن طلای آب شده به purchase/basket
   */
  async addToPurchase(
    body: AddGoldToCartDto,
    userId?: string,
    sessionId?: string,
  ) {
    // 1. محاسبه پیش‌نمایش (همان منطق preview)
    const preview = await this.goldInvestmentService.preview(body);

    // 2. بررسی وجود purchase موجود
    const existingPurchase = await this.findPurchase(userId, sessionId);

    if (existingPurchase) {
      // اگر purchase موجود باشد، به آن اضافه کن (جمع کردن)
      existingPurchase.originalAmount += preview.originalAmount;
      existingPurchase.commissionAmount += preview.commissionAmount;
      existingPurchase.calculatedAmount += preview.calculatedAmount;
      existingPurchase.grams += preview.grams;
      existingPurchase.milligrams += preview.milligrams;
      existingPurchase.lastActivityAt = new Date();

      // به‌روزرسانی expiresAt
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + CART_EXPIRATION_MINUTES);
      existingPurchase.expiresAt = expirationTime;

      await existingPurchase.save();

      const purchaseId = existingPurchase._id.toString();
      this.logger.log(`طلای آب شده به purchase موجود اضافه شد: ${purchaseId}`);

      return this.formatPurchaseResponse(existingPurchase);
    } else {
      // اگر purchase موجود نباشد، یک purchase جدید ایجاد کن
      const newPurchase = new this.goldPurchaseModel({
        user: userId,
        sessionId: sessionId,
        originalAmount: preview.originalAmount,
        commissionAmount: preview.commissionAmount,
        calculatedAmount: preview.calculatedAmount,
        goldPricePerGram: preview.goldPricePerGram,
        grams: preview.grams,
        milligrams: preview.milligrams,
        commissionType: preview.commissionType,
        commissionValue: preview.commissionValue,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + CART_EXPIRATION_MS), // CART_EXPIRATION_MINUTES دقیقه
      });

      await newPurchase.save();

      const newPurchaseId = newPurchase._id.toString();
      this.logger.log(`طلای آب شده purchase جدید ایجاد شد: ${newPurchaseId}`);

      return this.formatPurchaseResponse(newPurchase);
    }
  }

  /**
   * دریافت purchase فعلی
   */
  async getPurchase(userId?: string, sessionId?: string) {
    const purchase = await this.findPurchase(userId, sessionId);

    if (!purchase) {
      return {
        success: true,
        data: null,
        message: 'هیچ طلای آب شده‌ای در purchase وجود ندارد',
      };
    }

    // بررسی انقضا
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      await this.removePurchase(purchase._id.toString(), userId, sessionId);
      return {
        success: true,
        data: null,
        message: 'Purchase منقضی شده است',
      };
    }

    return {
      success: true,
      data: this.formatPurchaseResponse(purchase),
    };
  }

  /**
   * حذف purchase
   */
  async removePurchase(
    purchaseId: string,
    userId?: string,
    sessionId?: string,
  ) {
    const purchase = await this.goldPurchaseModel.findById(purchaseId);

    if (!purchase) {
      throw new NotFoundException('Purchase یافت نشد');
    }

    // بررسی authorization
    if (userId && purchase.user?.toString() !== userId) {
      throw new BadRequestException(
        'شما اجازه دسترسی به این purchase را ندارید',
      );
    }

    if (sessionId && purchase.sessionId !== sessionId) {
      throw new BadRequestException(
        'شما اجازه دسترسی به این purchase را ندارید',
      );
    }

    await this.goldPurchaseModel.deleteOne({ _id: purchaseId });

    this.logger.log(`Purchase حذف شد: ${purchaseId}`);
  }

  /**
   * پیدا کردن purchase
   */
  private async findPurchase(
    userId?: string,
    sessionId?: string,
  ): Promise<GoldPurchase | null> {
    if (userId) {
      return await this.goldPurchaseModel
        .findOne({ user: userId })
        .sort({ createdAt: -1 })
        .exec();
    }

    if (sessionId) {
      return await this.goldPurchaseModel
        .findOne({ sessionId: sessionId })
        .sort({ createdAt: -1 })
        .exec();
    }

    return null;
  }

  /**
   * فرمت کردن response
   */
  private formatPurchaseResponse(purchase: GoldPurchase) {
    const now = Date.now();
    const expiresAt = purchase.expiresAt?.getTime() || 0;
    const remainingSeconds =
      expiresAt > now ? Math.floor((expiresAt - now) / 1000) : 0;

    return {
      purchase: {
        _id: purchase._id,
        karat: 18, // طلای آب شده فقط 18 عیار است
        originalAmount: purchase.originalAmount,
        commissionAmount: purchase.commissionAmount,
        calculatedAmount: purchase.calculatedAmount,
        goldPricePerGram: purchase.goldPricePerGram,
        grams: purchase.grams,
        milligrams: purchase.milligrams,
        commissionType: purchase.commissionType,
        commissionValue: purchase.commissionValue,
        lastActivityAt: purchase.lastActivityAt,
        expiresAt: purchase.expiresAt,
        createdAt: (purchase as any).createdAt,
        updatedAt: (purchase as any).updatedAt,
      },
      totalGrams: purchase.grams,
      totalMilligrams: purchase.milligrams,
      totalAmount: purchase.calculatedAmount,
      expiresAt: purchase.expiresAt,
      remainingSeconds: remainingSeconds,
    };
  }
}
