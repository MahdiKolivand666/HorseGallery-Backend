import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocationService } from '../services/location.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';

@ApiTags('Location')
@Controller('site/locations')
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(private readonly locationService: LocationService) {}

  @Get('provinces')
  @ApiOperation({
    summary: 'دریافت لیست همه استان‌های ایران',
    description:
      'این endpoint لیست همه استان‌های ایران را از database برمی‌گرداند',
  })
  @ApiResponse({
    status: 200,
    description: 'لیست استان‌ها با موفقیت برگردانده شد',
    schema: {
      example: {
        success: true,
        data: [
          { _id: '...', externalId: 8, name: 'تهران' },
          { _id: '...', externalId: 4, name: 'اصفهان' },
        ],
      },
    },
  })
  async getAllProvinces() {
    const provinces = await this.locationService.getAllProvinces();
    return {
      success: true,
      data: provinces,
    };
  }

  @Get('cities')
  @ApiOperation({
    summary: 'دریافت لیست شهرهای یک استان',
    description:
      'این endpoint لیست شهرهای یک استان خاص را از database برمی‌گرداند',
  })
  @ApiQuery({
    name: 'provinceId',
    required: false,
    description: 'ID استان (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'provinceExternalId',
    required: false,
    description: 'External ID استان (از API خارجی)',
    example: '8',
  })
  @ApiQuery({
    name: 'provinceName',
    required: false,
    description: 'نام استان',
    example: 'تهران',
  })
  @ApiResponse({
    status: 200,
    description: 'لیست شهرها با موفقیت برگردانده شد',
    schema: {
      example: {
        success: true,
        data: [
          { _id: '...', externalId: 1, name: 'تهران' },
          { _id: '...', externalId: 2, name: 'اسلام‌شهر' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'پارامتر استان ارسال نشده است',
  })
  async getCitiesByProvince(
    @Query('provinceId') provinceId?: string,
    @Query('provinceExternalId') provinceExternalId?: string,
    @Query('provinceName') provinceName?: string,
  ) {
    // بررسی اینکه حداقل یکی از پارامترها ارسال شده باشد
    if (!provinceId && !provinceExternalId && !provinceName) {
      return {
        success: false,
        message:
          'لطفاً یکی از پارامترهای provinceId، provinceExternalId یا provinceName را ارسال کنید',
        data: [],
      };
    }

    try {
      let cities;

      if (provinceId) {
        // استفاده از provinceId (MongoDB ObjectId)
        cities = await this.locationService.getCitiesByProvince(provinceId);
      } else if (provinceExternalId) {
        // بررسی معتبر بودن provinceExternalId
        const parsedExternalId = parseInt(provinceExternalId, 10);
        if (isNaN(parsedExternalId)) {
          return {
            success: false,
            message: 'provinceExternalId باید یک عدد معتبر باشد',
            data: [],
          };
        }

        // بررسی وجود استان
        const province =
          await this.locationService.getProvinceByExternalId(parsedExternalId);
        if (!province) {
          return {
            success: false,
            message: 'استان یافت نشد',
            data: [],
          };
        }

        // دریافت شهرها
        cities =
          await this.locationService.getCitiesByProvinceExternalId(
            parsedExternalId,
          );
      } else if (provinceName) {
        // استفاده از نام استان
        const province =
          await this.locationService.getProvinceByName(provinceName);
        if (!province) {
          return {
            success: false,
            message: 'استان یافت نشد',
            data: [],
          };
        }
        cities = await this.locationService.getCitiesByProvince(
          province._id.toString(),
        );
      }

      // اطمینان از اینکه cities یک array است
      const citiesArray = Array.isArray(cities) ? cities : [];

      return {
        success: true,
        data: citiesArray,
      };
    } catch (error: any) {
      this.logger.error('Error in getCitiesByProvince', error.stack);
      return {
        success: false,
        message: 'خطا در دریافت شهرها',
        data: [],
      };
    }
  }

  @Post('sync')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync استان‌ها و شهرها از API خارجی',
    description:
      'این endpoint استان‌ها و شهرها را از API خارجی دریافت کرده و در database ذخیره می‌کند. فقط برای admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync با موفقیت انجام شد',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async syncLocations() {
    await this.locationService.syncAllLocations();
    return {
      success: true,
      message: 'استان‌ها و شهرها با موفقیت sync شدند',
    };
  }

  @Post('sync/provinces')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync فقط استان‌ها از API خارجی',
    description:
      'این endpoint فقط استان‌ها را از API خارجی دریافت کرده و در database ذخیره می‌کند. فقط برای admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync استان‌ها با موفقیت انجام شد',
  })
  async syncProvinces() {
    await this.locationService.syncProvinces();
    return {
      success: true,
      message: 'استان‌ها با موفقیت sync شدند',
    };
  }

  @Post('sync/cities/:provinceExternalId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync شهرهای یک استان از API خارجی',
    description:
      'این endpoint شهرهای یک استان خاص را از API خارجی دریافت کرده و در database ذخیره می‌کند. فقط برای admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync شهرها با موفقیت انجام شد',
  })
  async syncCitiesByProvince(
    @Param('provinceExternalId') provinceExternalId: string,
  ) {
    await this.locationService.syncCitiesByProvince(
      parseInt(provinceExternalId, 10),
    );
    return {
      success: true,
      message: 'شهرهای استان با موفقیت sync شدند',
    };
  }
}
