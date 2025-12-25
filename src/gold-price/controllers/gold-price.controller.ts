import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GoldPriceService } from '../services/gold-price.service';
import { GoldPriceFetcherService } from '../services/gold-price-fetcher.service';
import { CreateGoldPriceDto, UpdateGoldPriceDto } from '../dtos/gold-price.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { Public } from 'src/shared/decorators/public.decorator';
import { toPersianDate, toPersianNumbers } from 'src/shared/utils/stringUtils';

@ApiTags('Gold Price')
@Controller('gold-price')
export class GoldPriceController {
  constructor(
    private readonly goldPriceService: GoldPriceService,
    private readonly goldPriceFetcherService: GoldPriceFetcherService,
  ) {}

  @Get()
  @Public()
  async findAll(@Query('isActive') isActive?: string) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    const prices = await this.goldPriceService.findAll(isActiveBool);

    return {
      success: true,
      data: prices,
      count: prices.length,
    };
  }

  @Get('latest')
  @Public()
  @ApiOperation({
    summary: 'دریافت آخرین قیمت طلا (از API خارجی - قیمت لحظه‌ای)',
    description: 'این endpoint قیمت لحظه‌ای طلا را از API خارجی دریافت می‌کند.',
  })
  async findLatest(@Query('karat') karat?: string) {
    const karatNumber = karat ? parseInt(karat, 10) : 24;

    try {
      // دریافت قیمت لحظه‌ای از API خارجی
      const pricePerGram =
        await this.goldPriceFetcherService.getRealTimeGoldPrice(karatNumber);

      // ✅ تبدیل به تاریخ شمسی
      const now = new Date();
      const persianDateObj = toPersianDate(now);

      // ✅ نام ماه‌های شمسی
      const persianMonths = [
        'فروردین',
        'اردیبهشت',
        'خرداد',
        'تیر',
        'مرداد',
        'شهریور',
        'مهر',
        'آبان',
        'آذر',
        'دی',
        'بهمن',
        'اسفند',
      ];

      // ✅ ساخت persianDate با اعداد فارسی
      const persianDate = `${toPersianNumbers(persianDateObj.year)}/${toPersianNumbers(persianDateObj.month)}/${toPersianNumbers(persianDateObj.day)} ${toPersianNumbers(persianDateObj.hour)}:${toPersianNumbers(persianDateObj.minute)}:${toPersianNumbers(persianDateObj.second)}`;

      return {
        success: true,
        data: {
          karat: karatNumber,
          pricePerGram: pricePerGram,
          date: now,
          persianDate: persianDate, // ✅ تاریخ شمسی با اعداد فارسی (YYYY/MM/DD HH:MM:SS)
          isActive: true,
          source: 'BRS API',
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'خطا در دریافت قیمت لحظه‌ای طلا',
        data: null,
      };
    }
  }

  @Get('realtime')
  @Public()
  @ApiOperation({
    summary: 'دریافت قیمت لحظه‌ای طلا (از API خارجی)',
    description:
      'این endpoint قیمت لحظه‌ای طلا را از API خارجی دریافت می‌کند. برای نمایش استفاده می‌شود.',
  })
  async getRealTimePrice(@Query('karat') karat?: string) {
    const karatNumber = karat ? parseInt(karat, 10) : 24;
    const price =
      await this.goldPriceFetcherService.getRealTimeGoldPrice(karatNumber);
    return {
      success: true,
      karat: karatNumber,
      pricePerGram: price,
      unit: 'تومان',
      source: 'BRS API',
    };
  }

  @Get('rate-limit-info')
  @Public()
  @ApiOperation({
    summary: 'دریافت اطلاعات rate limit',
    description: 'نمایش تعداد request های باقی‌مانده در روز',
  })
  getRateLimitInfo() {
    return this.goldPriceFetcherService.getRateLimitInfo();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goldPriceService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  create(@Body() createGoldPriceDto: CreateGoldPriceDto) {
    return this.goldPriceService.create(createGoldPriceDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateGoldPriceDto: UpdateGoldPriceDto,
  ) {
    return this.goldPriceService.update(id, updateGoldPriceDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.goldPriceService.delete(id);
  }
}
