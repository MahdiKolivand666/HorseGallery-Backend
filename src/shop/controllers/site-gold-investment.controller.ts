import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GoldInvestmentService } from '../services/gold-investment.service';
import { GoldPurchaseService } from '../services/gold-purchase.service';
import { AddGoldToCartDto } from '../dtos/add-gold-to-cart.dto';
import { OptionalJwtGuard } from 'src/shared/guards/optional-jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { User } from 'src/shared/decorators/user.decorator';
import { SessionId } from 'src/shared/decorators/session.decorator';

@ApiTags('Site Gold Investment')
@UseGuards(OptionalJwtGuard, CsrfGuard)
@Controller('site/gold-investment')
export class SiteGoldInvestmentController {
  constructor(
    private readonly goldInvestmentService: GoldInvestmentService,
    private readonly goldPurchaseService: GoldPurchaseService,
  ) {}

  @Get('info')
  @ApiOperation({
    summary: 'دریافت اطلاعات خرید طلا',
    description:
      'دریافت اطلاعات خرید طلا شامل حداقل/حداکثر مبلغ، کارمزد و لینک محدودیت‌ها',
  })
  @ApiResponse({
    status: 200,
    description: 'اطلاعات خرید طلا با موفقیت دریافت شد',
  })
  @ApiResponse({
    status: 500,
    description: 'خطا در دریافت اطلاعات خرید طلا',
  })
  async getInfo() {
    const data = await this.goldInvestmentService.getInfo();

    return {
      success: true,
      message: 'اطلاعات خرید طلا با موفقیت دریافت شد',
      data,
    };
  }

  @Post('preview')
  @ApiOperation({
    summary: 'محاسبه پیش‌نمایش خرید طلا',
    description:
      'محاسبه پیش‌نمایش خرید طلا شامل مقدار طلا، کارمزد و مبلغ نهایی (بدون افزودن به سبد خرید)',
  })
  @ApiResponse({
    status: 200,
    description: 'محاسبه با موفقیت انجام شد',
  })
  @ApiResponse({
    status: 400,
    description: 'خطا در اعتبارسنجی یا محاسبات',
  })
  @ApiResponse({
    status: 500,
    description: 'خطا در دریافت قیمت لحظه‌ای طلا',
  })
  async preview(@Body() body: AddGoldToCartDto) {
    const result = await this.goldInvestmentService.preview(body);

    return {
      success: true,
      message: 'محاسبه با موفقیت انجام شد',
      data: result,
    };
  }

  @Post('purchase')
  @ApiOperation({
    summary: 'افزودن طلای آب شده به purchase/basket',
    description:
      'افزودن طلای آب شده به purchase/basket جداگانه (نه به cart عادی)',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'طلای آب شده با موفقیت به purchase اضافه شد',
  })
  @ApiResponse({
    status: 400,
    description: 'خطا در اعتبارسنجی یا محاسبات',
  })
  @ApiResponse({
    status: 500,
    description: 'خطا در دریافت قیمت لحظه‌ای طلا',
  })
  async addToPurchase(
    @Body() body: AddGoldToCartDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const result = await this.goldPurchaseService.addToPurchase(
      body,
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      message: 'طلای آب شده با موفقیت به purchase اضافه شد',
      data: result,
    };
  }

  @Get('purchase')
  @ApiOperation({
    summary: 'دریافت purchase طلای آب شده',
    description: 'دریافت purchase فعلی طلای آب شده',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase با موفقیت دریافت شد',
  })
  async getPurchase(
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const result = await this.goldPurchaseService.getPurchase(
      user || undefined,
      sessionId || undefined,
    );

    return result;
  }

  @Post('purchase/clear')
  @ApiOperation({
    summary: 'پاک کردن purchase طلای آب شده',
    description: 'پاک کردن purchase فعلی طلای آب شده',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Purchase با موفقیت پاک شد',
  })
  @ApiResponse({
    status: 404,
    description: 'Purchase یافت نشد',
  })
  async clearPurchase(
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    // پیدا کردن purchase فعلی
    const purchaseResult = await this.goldPurchaseService.getPurchase(
      user || undefined,
      sessionId || undefined,
    );

    if (purchaseResult.data?.purchase?._id) {
      await this.goldPurchaseService.removePurchase(
        purchaseResult.data.purchase._id.toString(),
        user || undefined,
        sessionId || undefined,
      );
    }

    return {
      success: true,
      message: 'Purchase با موفقیت پاک شد',
    };
  }
}
