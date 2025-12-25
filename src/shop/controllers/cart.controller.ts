import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { User } from 'src/shared/decorators/user.decorator';
import { SessionId } from 'src/shared/decorators/session.decorator';
import { OptionalJwtGuard } from 'src/shared/guards/optional-jwt.guard';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { CompleteRegistrationGuard } from 'src/shared/guards/complete-registration.guard';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import { newCartDto } from '../dtos/new-cart.dto';
import { CartService } from '../services/cart.service';
import { EditCartItemDto } from '../dtos/edit-cart-item.dto';
import { DeleteCartItemDto } from '../dtos/delete-cat-item.dto';

@ApiTags('Site Cart')
@UseGuards(OptionalJwtGuard, CsrfGuard)
@Controller('site/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت سبد خرید (کاربر یا مهمان)' })
  @ApiBearerAuth()
  getCart(@User() user: string | null, @SessionId() sessionId: string | null) {
    // اگر user لاگین باشد، از userId استفاده کن
    // وگرنه از sessionId استفاده کن
    return this.cartService.getCart(user || undefined, sessionId || undefined);
  }

  @Post()
  @ApiOperation({
    summary: 'ایجاد سبد خرید جدید یا افزودن محصول (کاربر یا مهمان)',
  })
  @ApiBearerAuth()
  createNewCart(
    @Body(new BodyIdPipe(['productId'])) body: newCartDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    // اگر user لاگین باشد، باید registrationStatus = complete باشد
    // این چک در CompleteRegistrationGuard انجام می‌شود
    // اما چون OptionalJwtGuard استفاده می‌کنیم، باید به صورت دستی چک کنیم
    // یا از یک Guard ترکیبی استفاده کنیم
    // فعلاً در service چک می‌کنیم
    return this.cartService.createCart(
      body,
      user || undefined,
      sessionId || undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات سبد خرید' })
  getCartDetails(
    @Param('id') id: string,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    return this.cartService.getCartDetails(
      id,
      user || undefined,
      sessionId || undefined,
    );
  }

  @Patch('edit-cart-item/:id')
  @ApiOperation({ summary: 'ویرایش آیتم سبد خرید' })
  editCart(
    @Param('id') id: string,
    @Body(new BodyIdPipe(['cartItem'])) body: EditCartItemDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    return this.cartService.editCart(
      id,
      body,
      user || undefined,
      sessionId || undefined,
    );
  }

  @Patch('add-to-cart/:id')
  @ApiOperation({ summary: 'افزودن محصول به سبد خرید' })
  addItemToCart(
    @Param('id') id: string,
    @Body(new BodyIdPipe(['productId'])) body: newCartDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    return this.cartService.addItemToCart(
      id,
      body,
      user || undefined,
      sessionId || undefined,
    );
  }

  @Delete('remove-from-cart/:id')
  @ApiOperation({ summary: 'حذف آیتم از سبد خرید' })
  removeItemFromCart(
    @Param('id') id: string,
    @Body(new BodyIdPipe(['cartItem'])) body: DeleteCartItemDto,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    return this.cartService.removeItemFromCart(
      id,
      body,
      user || undefined,
      sessionId || undefined,
    );
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'حذف آیتم از سبد خرید (با cartItem ID)' })
  removeItemByCartItemId(
    @Param('id') cartItemId: string,
    @User() user: string | null,
    @SessionId() sessionId: string | null,
  ) {
    return this.cartService.removeItemByCartItemId(
      cartItemId,
      user || undefined,
      sessionId || undefined,
    );
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge کردن سبد مهمان به سبد کاربر (بعد از لاگین)' })
  @ApiBearerAuth()
  @UseGuards(JwtGuard, CsrfGuard) // باید حتماً لاگین باشد
  async mergeCart(@User() user: string, @SessionId() sessionId: string | null) {
    if (!sessionId) {
      // اگر sessionId وجود نداشت، سبد کاربر را برگردان
      return this.cartService.getCart(user, undefined);
    }

    const mergedCart = await this.cartService.mergeCarts(user, sessionId);

    if (mergedCart) {
      return this.cartService.getCartDetails(
        mergedCart._id.toString(),
        user,
        undefined,
      );
    }

    // اگر merge انجام نشد، سبد کاربر را برگردان
    return this.cartService.getCart(user, undefined);
  }
}
