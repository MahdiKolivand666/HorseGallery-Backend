import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../services/order.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard, CsrfExempt } from 'src/shared/guards/csrf.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { PaymentCallbackDto } from '../dtos/payment-callback.dto';
import { OrderQueryDto } from '../dtos/order-query.dto';
import { User } from 'src/shared/decorators/user.decorator';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import type { Response } from 'express';
import { OrderStatus } from '../schemas/order.schema';
import { Types } from 'mongoose';
import { CartService } from '../services/cart.service';

@ApiTags('Site Order')
@Controller('site/order')
@UseGuards(CsrfGuard)
export class SiteOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  @Get('callback')
  @CsrfExempt()
  async callback(
    @Query() query: PaymentCallbackDto,
    @Res() response: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';

    if (query.authority) {
      const order = await this.orderService.findOrderByRefId(query.authority);

      const bankResponse = await this.orderService.checkOrder(
        (order._id as Types.ObjectId).toString(),
      );

      const orderId = (order._id as Types.ObjectId).toString();

      if (bankResponse.status === 101) {
        order.status = OrderStatus.Paid;
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        await this.cartService.removeCartAndItems(order.cart.toString());
        await order.save();
        return response.redirect(`${frontendUrl}/order/success?id=${orderId}`);
      } else {
        order.status = OrderStatus.Canceled;
        await order.save();
        return response.redirect(`${frontendUrl}/order/failed?id=${orderId}`);
      }
    } else {
      return response.redirect(`${frontendUrl}/order/failed`);
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'لیست سفارشات کاربر' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: 200,
    description: 'لیست سفارشات کاربر با موفقیت برگردانده شد',
  })
  @UseGuards(JwtGuard)
  getUserOrders(@Query() queryParams: OrderQueryDto, @User() user: string) {
    return this.orderService.findAll(
      { ...queryParams, userId: user },
      { __v: 0 },
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جزئیات یک سفارش' })
  @ApiResponse({
    status: 200,
    description: 'جزئیات سفارش با موفقیت برگردانده شد',
  })
  @ApiResponse({ status: 404, description: 'سفارش یافت نشد' })
  @UseGuards(JwtGuard)
  getOrderDetails(@Param('id') id: string, @User() user: string) {
    return this.orderService.findOneOrderDetails(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  createOrder(
    @Body(new BodyIdPipe(['cartId', 'addressId', 'shippingId']))
    body: CreateOrderDto,
    @User() user: string,
  ) {
    return this.orderService.createOrder(body, user);
  }
}
