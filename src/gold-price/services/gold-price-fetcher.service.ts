import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface GoldPriceApiResponse {
  gold: Array<{
    symbol: string;
    name: string;
    name_en: string;
    price: number;
    unit: string;
    date: string;
    time: string;
    change_value: number;
    change_percent: number;
  }>;
}

@Injectable()
export class GoldPriceFetcherService {
  private readonly logger = new Logger(GoldPriceFetcherService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  // Cache برای جلوگیری از request های تکراری
  private cachedPrice: {
    price: number;
    timestamp: number;
  } | null = null;

  // مدت زمان cache (60 ثانیه)
  private readonly CACHE_DURATION = 60 * 1000; // 60 ثانیه

  // Rate limiting: حداکثر 1500 request در روز
  private readonly MAX_REQUESTS_PER_DAY = 1500;
  private readonly REQUESTS_INTERVAL = 24 * 60 * 60 * 1000; // 24 ساعت
  private requestCount = 0;
  private lastResetTime = Date.now();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 58 * 1000; // 58 ثانیه (برای اطمینان از 1500 request در روز)

  constructor(private readonly configService: ConfigService) {
    // دریافت API URL و Key از environment variables
    this.apiUrl =
      this.configService.get<string>('GOLD_PRICE_API_URL') ||
      'https://brsapi.ir/Api/Market/Gold_Currency.php';
    this.apiKey =
      this.configService.get<string>('GOLD_PRICE_API_KEY') ||
      'Bi1IVCGX9rE449yeQQeftZt1gHTtvDHC';
  }

  /**
   * بررسی و reset کردن counter در صورت نیاز
   */
  private checkAndResetCounter(): void {
    const now = Date.now();

    // اگر 24 ساعت گذشته، counter را reset کن
    if (now - this.lastResetTime >= this.REQUESTS_INTERVAL) {
      this.requestCount = 0;
      this.lastResetTime = now;
      this.logger.log('Rate limit counter reset شد');
    }
  }

  /**
   * بررسی rate limit
   */
  private checkRateLimit(): void {
    this.checkAndResetCounter();

    if (this.requestCount >= this.MAX_REQUESTS_PER_DAY) {
      throw new Error(
        `حد مجاز درخواست روزانه (${this.MAX_REQUESTS_PER_DAY}) رسیده است. لطفاً بعداً تلاش کنید.`,
      );
    }

    // بررسی فاصله زمانی بین request ها
    const now = Date.now();
    if (this.lastRequestTime > 0) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = Math.ceil(
          (this.MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000,
        );
        throw new Error(`لطفاً ${waitTime} ثانیه صبر کنید قبل از درخواست بعدی`);
      }
    }
  }

  /**
   * دریافت قیمت لحظه‌ای طلا از API
   */
  async fetchRealTimeGoldPrice(karat: number = 24): Promise<number> {
    // بررسی cache
    const now = Date.now();
    if (
      this.cachedPrice &&
      now - this.cachedPrice.timestamp < this.CACHE_DURATION
    ) {
      this.logger.debug('استفاده از قیمت cache شده');
      return this.cachedPrice.price;
    }

    // بررسی rate limit
    this.checkRateLimit();

    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;

      this.logger.log(`دریافت قیمت طلا از API: ${url}`);

      const response = await axios.get<GoldPriceApiResponse>(url, {
        timeout: 10000,
      });

      const data = response.data;

      if (!data.gold || !Array.isArray(data.gold)) {
        this.logger.error('ساختار response API معتبر نیست:', data);
        throw new Error('ساختار response API معتبر نیست');
      }

      // پیدا کردن قیمت طلای 24 عیار
      let gold24K = data.gold.find((item) => item.symbol === 'IR_GOLD_24K');

      this.logger.debug(`IR_GOLD_24K پیدا شد: ${gold24K ? 'بله' : 'خیر'}`);

      // اگر 24 عیار پیدا نشد، از 18 عیار محاسبه کن
      if (!gold24K) {
        const gold18K = data.gold.find((item) => item.symbol === 'IR_GOLD_18K');
        if (gold18K) {
          // تبدیل 18 عیار به 24 عیار: (24/18) * price_18k
          const price24K = (gold18K.price * 24) / 18;
          gold24K = {
            ...gold18K,
            price: price24K,
            symbol: 'IR_GOLD_24K',
          };
        }
      }

      if (!gold24K) {
        this.logger.error(
          'قیمت طلای 24 عیار در response یافت نشد. موجود:',
          data.gold.map((item) => item.symbol),
        );
        throw new Error('قیمت طلای 24 عیار در response یافت نشد');
      }

      this.logger.debug(
        `قیمت طلای 24 عیار: ${gold24K.price.toLocaleString()} ${gold24K.unit}`,
      );

      // تبدیل قیمت به قیمت هر گرم
      // قیمت API برای هر گرم است (بر اساس response)
      let pricePerGram: number;

      if (karat === 24) {
        pricePerGram = gold24K.price;
      } else if (karat === 18) {
        // تبدیل 24 عیار به 18 عیار
        pricePerGram = (gold24K.price * 18) / 24;
      } else if (karat === 21) {
        // تبدیل 24 عیار به 21 عیار
        pricePerGram = (gold24K.price * 21) / 24;
      } else {
        // تبدیل به عیار مورد نظر
        pricePerGram = (gold24K.price * karat) / 24;
      }

      // ذخیره در cache
      this.cachedPrice = {
        price: Math.round(pricePerGram),
        timestamp: now,
      };

      // به‌روزرسانی rate limit
      this.requestCount++;
      this.lastRequestTime = now;

      this.logger.log(
        `قیمت لحظه‌ای طلای ${karat} عیار دریافت شد: ${Math.round(pricePerGram).toLocaleString()} تومان (Request #${this.requestCount})`,
      );

      return Math.round(pricePerGram);
    } catch (error) {
      this.logger.error('خطا در دریافت قیمت طلا از API:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `خطا در API: ${error.response.status} - ${error.response.statusText}`,
          );
        } else if (error.request) {
          throw new Error('خطا در اتصال به API قیمت طلا');
        }
      }

      throw new Error('خطا در دریافت قیمت لحظه‌ای طلا');
    }
  }

  /**
   * دریافت قیمت لحظه‌ای طلا (فقط از API - بدون fallback)
   */
  async getRealTimeGoldPrice(karat: number = 24): Promise<number> {
    // فقط از API استفاده کن - بدون fallback به دیتابیس
    return await this.fetchRealTimeGoldPrice(karat);
  }

  /**
   * دریافت اطلاعات rate limit
   */
  getRateLimitInfo(): {
    remaining: number;
    resetTime: number;
    lastRequestTime: number;
  } {
    this.checkAndResetCounter();
    const resetTime = this.lastResetTime + this.REQUESTS_INTERVAL;
    return {
      remaining: this.MAX_REQUESTS_PER_DAY - this.requestCount,
      resetTime,
      lastRequestTime: this.lastRequestTime,
    };
  }
}
