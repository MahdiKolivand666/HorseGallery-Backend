import { Body, Controller, Post, Query, Res, UseGuards } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { User } from 'src/shared/decorators/user.decorator';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import type { Response } from 'express';
import { OrderStatus } from '../schemas/order.schema';
import { Types } from 'mongoose';
import { CartService } from '../services/cart.service';

@ApiTags('Site Order')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('site-order')
export class SiteOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cartService: CartService,
  ) {}
  @Post()
  createOrder(
    @Body(new BodyIdPipe(['cartId', 'addressId', 'shippingId']))
    body: CreateOrderDto,
    @User() user: string,
  ) {
    return this.orderService.createOrder(body, user);
  }

  async callback(@Query() query: any, @Res() response: Response) {
    if (query.authority) {
      const order = await this.orderService.findOrderByRefId(query.authority);

      const bankResponse = await this.orderService.checkOrder(
        (order._id as Types.ObjectId).toString(),
      );

      if (bankResponse.status === 101) {
        order.status = OrderStatus.Paid;
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        await this.cartService.removeCartAndItems(order.cart.toString());
      } else {
        order.status = OrderStatus.Canceled;
      }

      await order.save();
      return response.redirect('');
    } else {
      response.redirect('');
    }
  }
}
