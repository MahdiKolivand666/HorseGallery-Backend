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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from 'src/shared/decorators/user.decorator';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import { newCartDto } from '../dtos/new-cart.dto';
import { CartService } from '../services/cart.service';
import { EditCartItemDto } from '../dtos/edit-cart-item.dto';
import { DeleteCartItemDto } from '../dtos/delete-cat-item.dto';

@ApiTags('Site Cart')
@ApiBearerAuth()
@UseGuards(JwtGuard, CsrfGuard)
@Controller('site/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Get()
  getCart(@User() user: string) {
    return this.cartService.getUserCart(user);
  }

  @Post()
  createNewCart(
    @Body(new BodyIdPipe(['productId'])) body: newCartDto,
    @User() user: string,
  ) {
    return this.cartService.createNewCart(body, user);
  }

  @Get(':id')
  getCartDetails(@Param('id') id: string) {
    return this.cartService.getCartDetails(id);
  }

  @Patch('edit-cart-item/:id')
  editCart(
    @Param('id') id: string,
    @Body(new BodyIdPipe(['cartItem'])) body: EditCartItemDto,
  ) {
    return this.cartService.editCart(id, body);
  }

  @Patch('add-to-cart/:id')
  addItemToCart(
    @Param('id') id: string,
    @Body(new BodyIdPipe(['productId'])) body: newCartDto,
  ) {
    return this.cartService.addItemToCart(id, body);
  }

  @Delete('remove-from-cart/:id')
  removeItemFromCart(
    @Param('id') id: string,
    @Body(new BodyIdPipe(['cartItem'])) body: DeleteCartItemDto,
  ) {
    return this.cartService.removeItemFromCart(id, body);
  }
}
