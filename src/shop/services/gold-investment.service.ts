import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GoldPriceFetcherService } from 'src/gold-price/services/gold-price-fetcher.service';
import { AddGoldToCartDto } from '../dtos/add-gold-to-cart.dto';
import { GoldInvestmentSettingsService } from './gold-investment-settings.service';

@Injectable()
export class GoldInvestmentService {
  private readonly logger = new Logger(GoldInvestmentService.name);

  constructor(
    private readonly goldPriceFetcherService: GoldPriceFetcherService,
    private readonly goldInvestmentSettingsService: GoldInvestmentSettingsService,
  ) {}

  /**
   * دریافت اطلاعات خرید طلا
   */
  async getInfo() {
    const settings = await this.goldInvestmentSettingsService.getSettings();

    return {
      minAmount: settings.minAmount,
      maxAmount: settings.maxAmount,
      commission: settings.commission,
      commissionAmount: settings.commissionAmount,
      restrictionsLink: settings.restrictionsLink,
    };
  }

  /**
   * محاسبه پیش‌نمایش خرید طلا (بدون افزودن به سبد خرید)
   */
  async preview(body: AddGoldToCartDto) {
    const { amount } = body;

    // 1. دریافت تنظیمات خرید طلا
    const settings = await this.goldInvestmentSettingsService.getSettings();

    // 2. اعتبارسنجی حداقل/حداکثر مبلغ
    if (amount < settings.minAmount) {
      throw new BadRequestException(
        `مبلغ باید حداقل ${settings.minAmount.toLocaleString()} تومان باشد`,
      );
    }

    if (amount > settings.maxAmount) {
      throw new BadRequestException(
        `مبلغ باید حداکثر ${settings.maxAmount.toLocaleString()} تومان باشد`,
      );
    }

    // 3. دریافت قیمت لحظه‌ای طلا (18 عیار) از API - فقط از API
    const goldPricePerGram =
      await this.goldPriceFetcherService.getRealTimeGoldPrice(18);

    if (!goldPricePerGram || goldPricePerGram <= 0) {
      throw new BadRequestException('قیمت طلا معتبر نیست');
    }

    // 4. محاسبه کارمزد
    let commissionAmount = 0;
    let commissionType: 'percentage' | 'fixed' | 'none' = 'none';
    let commissionValue = 0;

    if (settings.commissionAmount !== undefined) {
      // اولویت با commissionAmount (مبلغ ثابت)
      commissionAmount = settings.commissionAmount;
      commissionType = 'fixed';
      commissionValue = settings.commissionAmount;
    } else if (settings.commission !== undefined) {
      // محاسبه کارمزد درصدی
      commissionAmount = (amount * settings.commission) / 100;
      commissionType = 'percentage';
      commissionValue = settings.commission;
    }

    // 5. محاسبه مبلغ نهایی (شامل کارمزد)
    const calculatedAmount = amount + commissionAmount;

    // 6. محاسبه مقدار طلا (گرم) بر اساس مبلغ اصلی (بدون کارمزد)
    const grams = amount / goldPricePerGram;

    // Round to 4 decimal places
    const roundedGrams = Math.round(grams * 10000) / 10000;

    if (roundedGrams <= 0) {
      throw new BadRequestException('مبلغ وارد شده کافی نیست');
    }

    // تبدیل به میلی‌گرم (1 گرم = 1000 میلی‌گرم)
    const milligrams = Math.round(roundedGrams * 1000);

    // 7. بازگشت نتیجه پیش‌نمایش
    return {
      originalAmount: amount,
      goldPricePerGram: goldPricePerGram,
      grams: roundedGrams,
      milligrams: milligrams,
      commissionAmount: commissionAmount,
      calculatedAmount: calculatedAmount,
      commissionType: commissionType,
      commissionValue: commissionValue,
    };
  }
}
