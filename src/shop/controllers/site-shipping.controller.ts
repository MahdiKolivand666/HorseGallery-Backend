import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShippingService } from '../services/shipping.service';
import { ShippingQueryDto } from '../dtos/shipping-query.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/shared/decorators/public.decorator';
import { Shipping } from '../schemas/shipping.schema';

@ApiTags('Site Shipping')
@Controller('site/shipping')
export class SiteShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  findAll(@Query() queryParams: ShippingQueryDto) {
    return this.shippingService.findAll(queryParams);
  }

  /**
   * ✅ دریافت لیست shipping methods فعال
   * Public endpoint - بدون نیاز به authentication
   */
  @Get('methods')
  @Public() // ✅ Public endpoint
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'دریافت لیست روش‌های ارسال فعال',
    description:
      'این endpoint لیست تمام روش‌های ارسال فعال را برمی‌گرداند. برای استفاده در صفحه checkout.',
  })
  async getShippingMethods() {
    const methods = await this.shippingService.findActive();

    return {
      success: true,
      data: methods.map((method: Shipping) => {
        const methodObj = method.toObject ? method.toObject() : method;
        return {
          _id: methodObj._id.toString(),
          name: methodObj.title, // ✅ برای سازگاری با Frontend
          title: methodObj.title,
          description: methodObj.description || null,
          cost: methodObj.price, // ✅ برای سازگاری با Frontend
          price: methodObj.price,
          estimatedDays: methodObj.estimatedDays || null,
          isActive: methodObj.isActive ?? true,
          isDefault: methodObj.isDefault ?? false,
          freeShippingThreshold: methodObj.freeShippingThreshold || null,
        };
      }),
    };
  }
}
