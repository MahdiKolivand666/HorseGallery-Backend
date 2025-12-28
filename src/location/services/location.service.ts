import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Province } from '../schemas/province.schema';
import { City } from '../schemas/city.schema';
import axios from 'axios';

interface ExternalState {
  id: number;
  name: string;
}

interface ExternalCity {
  id: number;
  name: string;
  state_id: number;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly EXTERNAL_API_BASE =
    'https://iran-locations-api.ir/api/v1/fa';

  constructor(
    @InjectModel(Province.name) private readonly provinceModel: Model<Province>,
    @InjectModel(City.name) private readonly cityModel: Model<City>,
  ) {}

  /**
   * دریافت لیست همه استان‌ها از API خارجی و ذخیره در database
   */
  async syncProvinces(): Promise<void> {
    try {
      this.logger.log('در حال دریافت لیست استان‌ها از API خارجی...');

      // دریافت همه استان‌ها (بدون id برای دریافت همه)
      const response = await axios.get<ExternalState[]>(
        `${this.EXTERNAL_API_BASE}/states`,
      );

      const states = response.data;

      if (!Array.isArray(states) || states.length === 0) {
        this.logger.warn('هیچ استانی از API دریافت نشد');
        return;
      }

      this.logger.log(`${states.length} استان دریافت شد`);

      // ذخیره یا به‌روزرسانی استان‌ها
      for (const state of states) {
        await this.provinceModel.findOneAndUpdate(
          { externalId: state.id },
          {
            externalId: state.id,
            name: state.name,
            isActive: true,
          },
          { upsert: true, new: true },
        );
      }

      this.logger.log('استان‌ها با موفقیت در database ذخیره شدند');
    } catch (error) {
      this.logger.error(
        `خطا در دریافت استان‌ها: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * دریافت لیست شهرهای یک استان از API خارجی و ذخیره در database
   */
  async syncCitiesByProvince(provinceExternalId: number): Promise<void> {
    try {
      this.logger.log(
        `در حال دریافت شهرهای استان با ID ${provinceExternalId}...`,
      );

      const response = await axios.get<ExternalCity[]>(
        `${this.EXTERNAL_API_BASE}/cities?state_id=${provinceExternalId}`,
      );

      const cities = response.data;

      if (!Array.isArray(cities) || cities.length === 0) {
        this.logger.warn(
          `هیچ شهری برای استان ${provinceExternalId} دریافت نشد`,
        );
        return;
      }

      // پیدا کردن استان در database
      const province = await this.provinceModel.findOne({
        externalId: provinceExternalId,
      });

      if (!province) {
        this.logger.warn(
          `استان با ID ${provinceExternalId} در database یافت نشد`,
        );
        return;
      }

      this.logger.log(
        `${cities.length} شهر برای استان ${province.name} دریافت شد`,
      );

      // ذخیره یا به‌روزرسانی شهرها
      for (const city of cities) {
        await this.cityModel.findOneAndUpdate(
          { externalId: city.id },
          {
            externalId: city.id,
            name: city.name,
            province: province._id,
            provinceExternalId: provinceExternalId,
            isActive: true,
          },
          { upsert: true, new: true },
        );
      }

      this.logger.log(
        `شهرهای استان ${province.name} با موفقیت در database ذخیره شدند`,
      );
    } catch (error) {
      this.logger.error(`خطا در دریافت شهرها: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * دریافت همه استان‌ها و شهرهایشان از API خارجی
   */
  async syncAllLocations(): Promise<void> {
    try {
      this.logger.log('شروع sync همه استان‌ها و شهرها...');

      // ابتدا استان‌ها را sync کن
      await this.syncProvinces();

      // دریافت همه استان‌ها از database
      const provinces = await this.provinceModel.find({ isActive: true });

      this.logger.log(`${provinces.length} استان برای sync شهرها پیدا شد`);

      // برای هر استان، شهرهایش را sync کن
      for (const province of provinces) {
        await this.syncCitiesByProvince(province.externalId);
        // کمی delay برای جلوگیری از rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.logger.log('sync همه استان‌ها و شهرها با موفقیت انجام شد');
    } catch (error) {
      this.logger.error(
        `خطا در sync همه locations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * دریافت لیست همه استان‌ها از database
   */
  async getAllProvinces() {
    return this.provinceModel
      .find({ isActive: true })
      .select('_id externalId name')
      .sort({ name: 1 })
      .lean();
  }

  /**
   * دریافت لیست شهرهای یک استان از database
   */
  async getCitiesByProvince(provinceId: string) {
    // بررسی وجود استان
    const province = await this.provinceModel.findById(provinceId);

    if (!province) {
      return [];
    }

    // Query با province (ObjectId)
    const cities = await this.cityModel
      .find({
        province: provinceId,
        isActive: true,
      })
      .select('_id externalId name')
      .sort({ name: 1 })
      .lean();

    // اگر با province._id چیزی پیدا نشد، با provinceExternalId امتحان کن
    if (cities.length === 0) {
      const citiesByExternalId = await this.cityModel
        .find({
          provinceExternalId: province.externalId,
          isActive: true,
        })
        .select('_id externalId name')
        .sort({ name: 1 })
        .lean();

      return citiesByExternalId;
    }

    return cities;
  }

  /**
   * دریافت لیست شهرهای یک استان با استفاده از externalId استان
   */
  async getCitiesByProvinceExternalId(provinceExternalId: number) {
    // بررسی وجود استان
    const province = await this.provinceModel.findOne({
      externalId: provinceExternalId,
      isActive: true,
    });

    if (!province) {
      return [];
    }

    // Query با provinceExternalId
    const cities = await this.cityModel
      .find({
        provinceExternalId: provinceExternalId,
        isActive: true,
      })
      .select('_id externalId name')
      .sort({ name: 1 })
      .lean();

    // اگر با provinceExternalId چیزی پیدا نشد، با province._id امتحان کن
    if (cities.length === 0) {
      const citiesByProvinceId = await this.cityModel
        .find({
          province: province._id,
          isActive: true,
        })
        .select('_id externalId name')
        .sort({ name: 1 })
        .lean();

      return citiesByProvinceId;
    }

    return cities;
  }

  /**
   * دریافت یک استان با نام
   */
  async getProvinceByName(provinceName: string) {
    return this.provinceModel
      .findOne({
        name: { $regex: new RegExp(provinceName, 'i') },
        isActive: true,
      })
      .lean();
  }

  /**
   * دریافت یک استان با externalId
   */
  async getProvinceByExternalId(externalId: number) {
    return this.provinceModel.findOne({ externalId, isActive: true }).lean();
  }
}
