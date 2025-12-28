import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GoldInvestmentSettings,
  GoldInvestmentSettingsDocument,
} from '../schemas/gold-investment-settings.schema';

@Injectable()
export class GoldInvestmentSettingsService {
  private readonly logger = new Logger(GoldInvestmentSettingsService.name);
  private cachedSettings: GoldInvestmentSettingsDocument | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 دقیقه

  constructor(
    @InjectModel(GoldInvestmentSettings.name)
    private readonly settingsModel: Model<GoldInvestmentSettingsDocument>,
  ) {}

  /**
   * دریافت تنظیمات خرید طلا (با cache)
   */
  async getSettings(): Promise<GoldInvestmentSettingsDocument> {
    const now = Date.now();

    // بررسی cache
    if (
      this.cachedSettings &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.cachedSettings;
    }

    // دریافت از دیتابیس
    let settings: GoldInvestmentSettingsDocument | null =
      await this.settingsModel.findOne().exec();

    // اگر تنظیمات وجود نداشت، تنظیمات پیش‌فرض ایجاد کن
    if (!settings) {
      this.logger.warn('تنظیمات خرید طلا یافت نشد، ایجاد تنظیمات پیش‌فرض...');
      settings = await this.createDefaultSettings();
    }

    // به‌روزرسانی cache
    this.cachedSettings = settings;
    this.cacheTimestamp = now;

    return settings;
  }

  /**
   * ایجاد تنظیمات پیش‌فرض
   */
  private async createDefaultSettings(): Promise<GoldInvestmentSettingsDocument> {
    const defaultSettings = new this.settingsModel({
      minAmount: 1000000, // 1 میلیون تومان
      maxAmount: 100000000, // 100 میلیون تومان
      commission: 2.5, // 2.5 درصد
      restrictionsLink: '/faq#gold-restrictions',
    });

    return await defaultSettings.save();
  }

  /**
   * به‌روزرسانی تنظیمات
   */
  async updateSettings(
    updateData: Partial<GoldInvestmentSettings>,
  ): Promise<GoldInvestmentSettingsDocument> {
    let settings = await this.settingsModel.findOne().exec();

    if (!settings) {
      // اگر تنظیمات وجود نداشت، ایجاد کن
      settings = new this.settingsModel(updateData);
      await settings.save();
    } else {
      // به‌روزرسانی تنظیمات موجود
      Object.assign(settings, updateData);
      await settings.save();
    }

    // پاک کردن cache
    this.cachedSettings = null;
    this.cacheTimestamp = 0;

    return settings;
  }

  /**
   * پاک کردن cache (برای استفاده در admin panel)
   */
  clearCache(): void {
    this.cachedSettings = null;
    this.cacheTimestamp = 0;
  }
}
