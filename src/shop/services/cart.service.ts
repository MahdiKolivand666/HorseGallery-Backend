import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from '../schemas/cart.schema';
import { CartItem } from '../schemas/cart-item.schema';
import { newCartDto } from '../dtos/new-cart.dto';
import { CartItemDto } from '../dtos/cart-item.dto';
import { EditCartItemDto } from '../dtos/edit-cart-item.dto';
import { DeleteCartItemDto } from '../dtos/delete-cat-item.dto';
import { calculateCartTotal } from 'src/shared/utils/price-calculator';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(CartItem.name) private readonly cartItemModel: Model<CartItem>,
  ) {}

  async createNewCart(body: newCartDto, user: string) {
    const newCart = new this.cartModel({
      user: user,
    });
    const newCartItem = new this.cartItemModel({
      product: body.productId,
      quantity: body.quantity || 1,
      cart: newCart._id.toString(),
    });

    await newCart.save();
    await newCartItem.save();
    return this.getCartDetails(newCart._id.toString());
  }

  async createCartItem(body: CartItemDto) {
    const newCartItem = new this.cartItemModel(body);
    await newCartItem.save();
    return newCartItem;
  }

  async findCartItem(id: string) {
    const items = await this.cartItemModel
      .find({ cart: id })
      .populate('product', { title: 1, thumbnail: 1, price: 1, discount: 1 })
      .select({ product: 1, quantity: 1 })
      .sort({ createdAt: -1 })
      .exec();

    if (items) {
      return items;
    } else {
      throw new NotFoundException();
    }
  }

  async findCart(id: string) {
    const cart = await this.cartModel.findOne({ _id: id }).exec();

    if (cart) {
      return cart;
    } else {
      throw new NotFoundException();
    }
  }

  async findCartByUser(userId: string) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .sort({ createdAt: -1 })
      .exec();

    if (cart) {
      return cart;
    } else {
      return null; // Return null if no cart exists for user
    }
  }

  async getUserCart(userId: string) {
    const cart = await this.findCartByUser(userId);

    if (!cart) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }

    return this.getCartDetails(cart._id.toString());
  }
  async getCartDetails(id: string) {
    const cart = await this.findCart(id);
    const items = await this.findCartItem(id);

    if (cart) {
      const prices = await this.getPrices(id);
      return {
        cart,
        items,
        prices,
      };
    } else {
      throw new NotFoundException();
    }
  }

  async getPrices(id: string) {
    const items = await this.findCartItem(id);

    this.logger.debug(
      `Calculating prices for cart ${id} with ${items.length} items`,
    );

    // Prepare items for calculation
    const itemsData = items.map((item) => ({
      price: item?.product?.price ?? 0,
      discount: item?.product?.discount ?? 0,
      quantity: item?.quantity ?? 0,
    }));

    // Calculate using helper function
    const result = calculateCartTotal(itemsData);

    this.logger.debug(
      `Cart total: ${result.priceWithDiscount} (saved: ${result.savings} - ${result.savingsPercentage}%)`,
    );

    return {
      totalWithoutDiscount: result.priceWithoutDiscount,
      totalWithDiscount: result.priceWithDiscount,
      totalSavings: result.savings,
      savingsPercentage: result.savingsPercentage,
    };
  }

  async findCartItemById(id: string) {
    const cartItem = await this.cartItemModel.findOne({ _id: id }).exec();

    if (cartItem) {
      return cartItem;
    } else {
      throw new NotFoundException();
    }
  }

  async editCart(id: string, body: EditCartItemDto) {
    const cartItem = await this.findCartItemById(body.cartItem);
    cartItem.quantity = body.quantity;
    await cartItem.save();
    return this.getCartDetails(id);
  }

  async addItemToCart(id: string, body: newCartDto) {
    const items = await this.findCartItem(id);
    const oldItem = items.find(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      (item) => `${item.product._id}` === body.productId,
    );

    if (oldItem?._id) {
      const newQuantity = (body.quantity || 1) + oldItem.quantity;
      await this.editCart(id, {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        cartItem: oldItem._id.toString(),
        quantity: newQuantity,
      });
    } else {
      await this.createCartItem({
        product: body.productId,
        quantity: body.quantity || 1,
        cart: id,
      });
    }

    return this.getCartDetails(id);
  }

  async removeCartAndItems(id: string) {
    const items = await this.findCartItem(id);

    for (const item of items) {
      await this.deleteCartItem((item._id as Types.ObjectId).toString());
    }

    await this.deleteCart(id);
  }

  async deleteCartItem(id: string) {
    const cartItem = await this.findCartItemById(id);
    await cartItem.deleteOne();
    return cartItem;
  }

  async deleteCart(id: string) {
    const cart = await this.findCart(id);
    await cart.deleteOne();
    return cart;
  }
  async removeItemFromCart(id: string, body: DeleteCartItemDto) {
    await this.deleteCartItem(body.cartItem);

    const item = await this.findCartItem(id);

    if (item?.length) {
      return this.getCartDetails(id);
    } else {
      await this.deleteCart(id);
    }
  }
}
