import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddressService } from '../services/address.service';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { OptionalJwtGuard } from 'src/shared/guards/optional-jwt.guard';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { User } from 'src/shared/decorators/user.decorator';
import { SessionId } from 'src/shared/decorators/session.decorator';
import { AddressNumbersPipe } from 'src/shared/pipes/address-numbers.pipe';

@ApiTags('Site Address')
@UseGuards(OptionalJwtGuard, CsrfGuard)
@Controller('site/addresses')
export class SiteAddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست آدرس‌های کاربر یا مهمان' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'لیست آدرس‌ها با موفقیت برگردانده شد',
  })
  async findAll(
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const addresses = await this.addressService.findAll(
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      data: addresses,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک آدرس خاص' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'آدرس با موفقیت برگردانده شد',
  })
  @ApiResponse({ status: 404, description: 'آدرس یافت نشد' })
  @ApiResponse({ status: 403, description: 'دسترسی ندارید' })
  async findOne(
    @Param('id') id: string,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const address = await this.addressService.findOne(
      id,
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      data: address,
    };
  }

  @Post()
  @ApiOperation({ summary: 'افزودن آدرس جدید' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'آدرس با موفقیت افزوده شد',
  })
  @ApiResponse({ status: 400, description: 'خطا در اعتبارسنجی' })
  async create(
    @Body(new AddressNumbersPipe()) body: CreateAddressDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const address = await this.addressService.create(
      body,
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      message: 'آدرس با موفقیت افزوده شد',
      data: address,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی آدرس' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'آدرس با موفقیت به‌روزرسانی شد',
  })
  @ApiResponse({ status: 404, description: 'آدرس یافت نشد' })
  @ApiResponse({ status: 403, description: 'دسترسی ندارید' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAddressDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const address = await this.addressService.update(
      id,
      body,
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      message: 'آدرس با موفقیت به‌روزرسانی شد',
      data: address,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف آدرس' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'آدرس با موفقیت حذف شد',
  })
  @ApiResponse({ status: 404, description: 'آدرس یافت نشد' })
  @ApiResponse({ status: 403, description: 'دسترسی ندارید' })
  async delete(
    @Param('id') id: string,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    await this.addressService.delete(
      id,
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      message: 'آدرس با موفقیت حذف شد',
    };
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'تنظیم آدرس به عنوان پیش‌فرض' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'آدرس به عنوان پیش‌فرض تنظیم شد',
  })
  @ApiResponse({ status: 404, description: 'آدرس یافت نشد' })
  @ApiResponse({ status: 403, description: 'دسترسی ندارید' })
  async setDefault(
    @Param('id') id: string,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    const address = await this.addressService.setDefault(
      id,
      user || undefined,
      sessionId || undefined,
    );

    return {
      success: true,
      message: 'آدرس به عنوان پیش‌فرض تنظیم شد',
      data: address,
    };
  }

  @Post('merge')
  @ApiOperation({
    summary: 'Merge کردن آدرس‌های مهمان به کاربر (بعد از لاگین)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, CsrfGuard) // باید حتماً لاگین باشد
  @ApiResponse({
    status: 200,
    description: 'آدرس‌ها با موفقیت merge شدند',
  })
  async mergeGuestAddresses(
    @User() user: string,
    @SessionId() sessionId: string | null,
  ) {
    if (!sessionId) {
      // اگر sessionId وجود نداشت، فقط آدرس‌های کاربر را برگردان
      const addresses = await this.addressService.findAll(user, undefined);
      return {
        success: true,
        message: 'آدرس مهمان وجود ندارد',
        data: addresses,
      };
    }

    await this.addressService.mergeGuestAddresses(user, sessionId);

    const addresses = await this.addressService.findAll(user, undefined);

    return {
      success: true,
      message: 'آدرس‌ها با موفقیت merge شدند',
      data: addresses,
    };
  }
}
