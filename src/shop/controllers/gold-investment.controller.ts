import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoldInvestmentService } from '../services/gold-investment.service';
import { Public } from 'src/shared/decorators/public.decorator';

@ApiTags('Gold Investment')
@Controller('gold-investment')
@Public() // Mark as public endpoint (no authentication required)
export class GoldInvestmentController {
  constructor(private readonly goldInvestmentService: GoldInvestmentService) {}

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
}
