import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IncompleteRegistrationException,
  OtpRequiredException,
} from 'src/shared/exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { Cart } from '../schemas/cart.schema';
import { CartItem } from '../schemas/cart-item.schema';
import { newCartDto } from '../dtos/new-cart.dto';
import { CartItemDto } from '../dtos/cart-item.dto';
import { EditCartItemDto } from '../dtos/edit-cart-item.dto';
import { DeleteCartItemDto } from '../dtos/delete-cat-item.dto';
import { ProductService } from 'src/product/services/product.service';
import { CartCleanupService } from './cart-cleanup.service';
import { User, RegistrationStatus } from 'src/user/schemas/user.schema';
import { CART_EXPIRATION_SECONDS } from '../constants/cart.constants';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(CartItem.name) private readonly cartItemModel: Model<CartItem>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly productService: ProductService,
    private readonly cartCleanupService: CartCleanupService,
  ) {}

  async createNewCart(body: newCartDto, user?: string, sessionId?: string) {
    // ✅ اگر کاربر لاگین است، بررسی registrationStatus
    if (user) {
      // ✅ استفاده از lean() برای اطمینان از دریافت آخرین داده از database (بدون cache)
      const userDoc = await this.userModel
        .findById(user)
        .select('registrationStatus mobile otpVerifiedAt')
        .lean();
      if (!userDoc) {
        throw new ForbiddenException('کاربر یافت نشد. لطفاً دوباره وارد شوید');
      }
      if (userDoc.registrationStatus !== RegistrationStatus.Complete) {
        // ✅ بررسی اینکه آیا otpVerifiedAt بیش از 7 روز گذشته است
        // ✅ اگر گذشته باشد، کاربر باید دوباره OTP بگیرد
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isOtpVerificationExpired =
          !userDoc.otpVerifiedAt || userDoc.otpVerifiedAt < sevenDaysAgo;

        if (isOtpVerificationExpired) {
          // ✅ کاربر pending است و OTP verification منقضی شده یا وجود ندارد
          // ✅ باید modal OTP برایش باز شود و کد ارسال شود
          throw new OtpRequiredException(userDoc.mobile);
        }

        // ✅ کاربر لاگین است و OTP verify شده اما اطلاعات کامل ندارد
        // ✅ خطای مخصوص که نشان می‌دهد کاربر لاگین است و فقط باید فرم تکمیل اطلاعات را نشان دهد
        throw new IncompleteRegistrationException(userDoc.mobile);
      }
    }

    // بررسی وجود محصول و موجودی
    const product = await this.productService.findOne(body.productId);

    if (!product.isAvailable) {
      throw new BadRequestException('این محصول در حال حاضر موجود نیست');
    }

    const requestedQuantity = body.quantity || 1;

    if (product.stock < requestedQuantity) {
      throw new BadRequestException(
        `موجودی ${product.name} کافی نیست. موجودی فعلی: ${product.stock}`,
      );
    }

    // دریافت قیمت نهایی محصول (با تخفیف)
    const finalPrice = product.discountPrice || product.price;

    const newCart = new this.cartModel({
      user: user || undefined,
      sessionId: sessionId || undefined,
    });

    const newCartItem = new this.cartItemModel({
      product: body.productId,
      quantity: requestedQuantity,
      cart: newCart._id.toString(),
      price: finalPrice,
      size: body.size,
    });

    await newCart.save();
    await newCartItem.save();
    return this.getCartDetails(newCart._id.toString(), user, sessionId);
  }

  async createCartItem(body: CartItemDto) {
    // اگر price مشخص نشده باشد، از محصول بگیر
    if (!body.price) {
      const product = await this.productService.findOne(
        (body.product as any).toString() || body.product,
      );
      body.price = product.discountPrice || product.price;
    }

    const newCartItem = new this.cartItemModel(body);
    await newCartItem.save();
    return newCartItem;
  }

  async findCartItem(id: string) {
    const items = await this.cartItemModel
      .find({ cart: id })
      .populate('product', {
        name: 1,
        title: 1,
        slug: 1,
        code: 1,
        price: 1,
        discountPrice: 1,
        discount: 1,
        images: 1,
        stock: 1,
        weight: 1,
        productType: 1,
        goldInfo: 1,
        category: 1,
      })
      .select({ product: 1, quantity: 1, size: 1, price: 1 })
      .sort({ createdAt: -1 })
      .exec();

    // ✅ اگر آیتمی وجود نداشت، array خالی برگردان (خطا نده)
    return items || [];
  }

  async findCart(id: string, userId?: string, sessionId?: string) {
    const cart = await this.cartModel.findOne({ _id: id }).exec();

    if (!cart) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }

    // بررسی authorization: فقط صاحب سبد می‌تواند به آن دسترسی داشته باشد
    if (userId) {
      // اگر userId وجود داشت، باید سبد متعلق به این کاربر باشد
      if (!cart.user || cart.user.toString() !== userId) {
        throw new ForbiddenException('دسترسی به این سبد خرید ندارید');
      }
    } else if (sessionId) {
      // اگر sessionId وجود داشت، باید سبد متعلق به این session باشد
      if (!cart.sessionId || cart.sessionId !== sessionId) {
        throw new ForbiddenException('دسترسی به این سبد خرید ندارید');
      }
    } else {
      // اگر هیچ کدام وجود نداشت، دسترسی مجاز نیست
      throw new ForbiddenException('دسترسی به این سبد خرید ندارید');
    }

    return cart;
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

  async findCartBySession(sessionId: string) {
    const cart = await this.cartModel
      .findOne({ sessionId: sessionId })
      .sort({ createdAt: -1 })
      .exec();

    if (cart) {
      return cart;
    } else {
      return null; // Return null if no cart exists for session
    }
  }

  async mergeCarts(userId: string, sessionId: string) {
    // پیدا کردن سبد مهمان
    const guestCart = await this.findCartBySession(sessionId);

    if (!guestCart) {
      return null; // سبد مهمان وجود ندارد
    }

    // پیدا کردن سبد کاربر
    const userCart = await this.findCartByUser(userId);

    if (!userCart) {
      // اگر سبد کاربر وجود ندارد، سبد مهمان را به کاربر منتقل کن
      guestCart.user = userId;
      guestCart.sessionId = undefined;
      await guestCart.save();
      return guestCart;
    }

    // اگر هر دو وجود دارند، آیتم‌های سبد مهمان را به سبد کاربر اضافه کن
    const guestItems = await this.findCartItem(guestCart._id.toString());

    for (const item of guestItems) {
      const productId =
        (item.product as any)._id?.toString() ||
        (item.product as any).toString();

      try {
        await this.addItemToCart(userCart._id.toString(), {
          productId,
          quantity: item.quantity,
          size: item.size,
        });
      } catch (error) {
        // اگر خطا داد (مثلاً موجودی کافی نیست)، ادامه بده
        this.logger.warn(
          `Failed to merge item ${productId} to user cart: ${error.message}`,
        );
      }
    }

    // سبد مهمان را حذف کن (بدون authorization check چون قبلاً بررسی شده)
    await this.removeCartAndItems(guestCart._id.toString());

    return userCart;
  }

  async getUserCart(userId: string) {
    const cart = await this.findCartByUser(userId);

    if (!cart) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }

    return this.getCartDetails(cart._id.toString(), userId, undefined);
  }

  /**
   * پیدا کردن یا ایجاد سبد خرید بر اساس user یا sessionId
   */
  async findOrCreateCart(userId?: string, sessionId?: string) {
    // اگر userId وجود داشت، سبد کاربر را پیدا کن
    if (userId) {
      const cart = await this.findCartByUser(userId);
      if (cart) {
        return cart;
      }
    }

    // اگر sessionId وجود داشت، سبد مهمان را پیدا کن
    if (sessionId) {
      const cart = await this.findCartBySession(sessionId);
      if (cart) {
        return cart;
      }
    }

    // اگر هیچ کدام وجود نداشت، null برگردان
    return null;
  }

  /**
   * دریافت سبد خرید (برای کاربر یا مهمان)
   */
  async getCart(userId?: string, sessionId?: string) {
    // اگر user وجود نداشت و sessionId هم وجود نداشت، یک sessionId ایجاد کن
    let finalSessionId = sessionId;
    if (!userId && !sessionId) {
      finalSessionId = this.generateSessionId();
    }

    const cart = await this.findOrCreateCart(userId, finalSessionId);

    if (!cart) {
      // اگر سبد وجود نداشت، یک سبد خالی برگردان
      const emptyResponse = {
        cart: null,
        items: [],
        itemCount: 0,
        totalItems: 0,
        totalPrice: 0,
        expiresAt: null,
        remainingSeconds: 0,
        expirationSeconds: CART_EXPIRATION_SECONDS, // ✅ زمان انقضا به ثانیه (برای frontend counter)
        expired: false, // ✅ سبد وجود ندارد (نه منقضی شده)
        prices: {
          totalWithoutDiscount: 0,
          totalWithDiscount: 0,
          totalSavings: 0,
          savingsPercentage: 0,
        },
      };

      // اگر sessionId جدید ایجاد شده بود، آن را به response اضافه کن
      if (!sessionId && finalSessionId) {
        return {
          ...emptyResponse,
          sessionId: finalSessionId,
        };
      }

      return emptyResponse;
    }

    const result = await this.getCartDetails(
      cart._id.toString(),
      userId,
      finalSessionId,
    );

    // اگر sessionId جدید ایجاد شده بود، آن را به response اضافه کن
    if (!sessionId && finalSessionId) {
      return {
        ...result,
        sessionId: finalSessionId,
      };
    }

    return result;
  }

  /**
   * ایجاد sessionId جدید برای مهمان
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${randomBytes(16).toString('hex')}`;
  }

  /**
   * ایجاد سبد خرید جدید (برای کاربر یا مهمان)
   */
  async createCart(body: newCartDto, userId?: string, sessionId?: string) {
    // اگر user وجود نداشت و sessionId هم وجود نداشت، یک sessionId ایجاد کن
    let finalSessionId = sessionId;
    if (!userId && !sessionId) {
      finalSessionId = this.generateSessionId();
    }

    // بررسی اینکه آیا سبدی وجود دارد یا نه
    const existingCart = await this.findOrCreateCart(userId, finalSessionId);

    if (existingCart) {
      // اگر سبد وجود داشت، محصول را به آن اضافه کن
      const result = await this.addItemToCart(
        existingCart._id.toString(),
        body,
        userId,
        finalSessionId,
      );

      // اگر sessionId جدید ایجاد شده بود، آن را به response اضافه کن
      if (!sessionId && finalSessionId) {
        return {
          ...result,
          sessionId: finalSessionId, // برای Frontend تا در Cookie ذخیره کند
        };
      }

      return result;
    }

    // اگر سبد وجود نداشت، سبد جدید ایجاد کن
    const result = await this.createNewCart(body, userId, finalSessionId);

    // اگر sessionId جدید ایجاد شده بود، آن را به response اضافه کن
    if (!sessionId && finalSessionId) {
      return {
        ...result,
        sessionId: finalSessionId, // برای Frontend تا در Cookie ذخیره کند
      };
    }

    return result;
  }
  async getCartDetails(id: string, userId?: string, sessionId?: string) {
    const cart = await this.findCart(id, userId, sessionId);

    // ✅ بررسی انقضای سبد خرید (بدون حذف)
    // ✅ Cart منقضی شده حذف نمی‌شود - فقط expired flag set می‌شود
    const now = new Date();
    const isExpired = cart.expiresAt && cart.expiresAt < now;

    if (isExpired) {
      // ✅ بررسی اینکه آیا قبلاً به کاربر اطلاع داده شده است یا نه
      const isFirstTimeExpired = !cart.expiredNotifiedAt;

      if (isFirstTimeExpired) {
        // ✅ اولین بار که expired است - items را پاک کن و flag را set کن
        const items = await this.findCartItem(id);
        // پاک کردن همه items
        if (items && items.length > 0) {
          for (const item of items) {
            await this.deleteCartItem((item._id as Types.ObjectId).toString());
          }
        }

        // Set flag برای نشان دادن اینکه کاربر اطلاع داده شده است
        cart.expiredNotifiedAt = now;
        await cart.save();

        return {
          cart: cart,
          items: [], // ✅ items پاک شده‌اند
          itemCount: 0,
          totalItems: 0,
          totalPrice: 0,
          expiresAt: cart.expiresAt,
          remainingSeconds: 0,
          expirationSeconds: CART_EXPIRATION_SECONDS,
          expired: true,
          expiredFirstTime: true, // ✅ flag برای frontend - نشان می‌دهد این اولین بار است
          prices: {
            totalWithoutDiscount: 0,
            totalWithDiscount: 0,
            totalSavings: 0,
            savingsPercentage: 0,
          },
        };
      } else {
        // ✅ دفعات بعد - items قبلاً پاک شده‌اند، فقط خالی برگردان
        const items = await this.findCartItem(id);
        // اگر هنوز items وجود دارد (برای اطمینان)، آن‌ها را حذف کن
        if (items && items.length > 0) {
          for (const item of items) {
            await this.deleteCartItem((item._id as Types.ObjectId).toString());
          }
        }

        return {
          cart: cart,
          items: [],
          itemCount: 0,
          totalItems: 0,
          totalPrice: 0,
          expiresAt: cart.expiresAt,
          remainingSeconds: 0,
          expirationSeconds: CART_EXPIRATION_SECONDS,
          expired: true,
          expiredFirstTime: false, // ✅ flag برای frontend - نشان می‌دهد دفعات بعدی است
          prices: {
            totalWithoutDiscount: 0,
            totalWithDiscount: 0,
            totalSavings: 0,
            savingsPercentage: 0,
          },
        };
      }
    }

    // ❌ به‌روزرسانی زمان فعالیت را حذف کردیم
    // فقط وقتی فعالیت واقعی انجام می‌شود (افزودن/ویرایش/حذف) به‌روزرسانی می‌شود
    // await this.cartCleanupService.updateCartActivity(id);

    const items = await this.findCartItem(id);

    if (cart) {
      const prices = await this.getPrices(id);

      // محاسبه تعداد کل آیتم‌ها (مجموع quantity)
      const totalItems = items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      // تعداد آیتم‌های مختلف
      const itemCount = items.length;

      // محاسبه زمان باقی‌مانده تا انقضا (به ثانیه)
      const now = new Date();
      const expiresAt = cart.expiresAt || new Date();
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );

      // ✅ اگر counter به 0 رسید، cart را expired کن و items را پاک کن
      if (remainingSeconds === 0 && !cart.expiredNotifiedAt) {
        const itemsToDelete = await this.findCartItem(id);
        // پاک کردن همه items
        if (itemsToDelete && itemsToDelete.length > 0) {
          for (const item of itemsToDelete) {
            await this.deleteCartItem((item._id as Types.ObjectId).toString());
          }
        }

        // Set flag برای نشان دادن اینکه کاربر اطلاع داده شده است
        cart.expiredNotifiedAt = now;
        await cart.save();

        return {
          cart,
          items: [], // ✅ items پاک شده‌اند
          itemCount: 0,
          totalItems: 0,
          totalPrice: 0,
          expiresAt: cart.expiresAt,
          remainingSeconds: 0,
          expirationSeconds: CART_EXPIRATION_SECONDS,
          expired: true,
          expiredFirstTime: true, // ✅ flag برای frontend
          prices: {
            totalWithoutDiscount: 0,
            totalWithDiscount: 0,
            totalSavings: 0,
            savingsPercentage: 0,
          },
        };
      }

      // ✅ اضافه کردن discount و originalPrice به هر item
      const itemsWithDiscount = items.map((item) => {
        const product = item?.product as any;
        const quantity = item?.quantity || 1;
        const savedPrice = (item as any)?.price; // قیمت واحد ذخیره شده در CartItem

        // محاسبه قیمت اصلی محصول (بدون تخفیف)
        const productOriginalPrice = product?.price || 0;
        const originalPrice = productOriginalPrice * quantity;

        // محاسبه قیمت نهایی (با تخفیف)
        // اگر savedPrice وجود داشت، از آن استفاده کن (قیمت واحد ذخیره شده)
        // وگرنه از discountPrice یا price محصول استفاده کن
        const productDiscountPrice =
          product?.discountPrice ?? productOriginalPrice;

        // محاسبه قیمت واحد (با تخفیف)
        const unitPrice =
          savedPrice && savedPrice > 0 ? savedPrice : productDiscountPrice;

        // محاسبه قیمت کل (با تخفیف)
        const finalPrice = unitPrice * quantity;

        // محاسبه قیمت واحد اصلی (بدون تخفیف)
        const unitOriginalPrice = productOriginalPrice;

        // محاسبه درصد تخفیف از قیمت اصلی و قیمت با تخفیف
        let discount = 0;
        if (
          productDiscountPrice &&
          productOriginalPrice > 0 &&
          productDiscountPrice < productOriginalPrice
        ) {
          // محاسبه discount از قیمت محصول
          discount = Math.round(
            ((productOriginalPrice - productDiscountPrice) /
              productOriginalPrice) *
              100,
          );
        } else if (product?.discount) {
          // اگر discount به صورت درصد وجود داشت، از آن استفاده کن
          discount = product.discount;
        }

        // ساخت item با فیلدهای اضافی
        const itemObject = item.toObject ? item.toObject() : item;
        return {
          ...itemObject,
          price: finalPrice, // قیمت کل (با تخفیف) = unitPrice * quantity
          originalPrice: originalPrice, // قیمت کل اصلی (بدون تخفیف) = productOriginalPrice * quantity
          unitPrice: unitPrice, // ✅ قیمت واحد (با تخفیف) - برای نمایش در Frontend
          unitOriginalPrice: unitOriginalPrice, // ✅ قیمت واحد اصلی (بدون تخفیف) - برای نمایش در Frontend
          discount: discount, // درصد تخفیف
        };
      });

      return {
        cart,
        items: itemsWithDiscount,
        itemCount, // تعداد آیتم‌های مختلف
        totalItems, // تعداد کل محصولات (با quantity)
        totalPrice: prices.totalWithDiscount, // قیمت کل
        expiresAt: cart.expiresAt, // زمان انقضا
        remainingSeconds, // زمان باقی‌مانده تا انقضا (ثانیه)
        expirationSeconds: CART_EXPIRATION_SECONDS, // ✅ زمان انقضا به ثانیه (برای frontend counter)
        expired: false, // ✅ نشان می‌دهد که cart منقضی نشده
        prices,
      };
    } else {
      throw new NotFoundException();
    }
  }

  async getPrices(id: string) {
    const items = await this.findCartItem(id);

    // ✅ محاسبه مستقیم قیمت‌ها بدون استفاده از discount (برای جلوگیری از خطای rounding)
    let totalWithDiscount = 0;
    let totalWithoutDiscount = 0;

    for (const item of items) {
      const product = item?.product as any;
      const savedPrice = (item as any)?.price; // قیمت واحد ذخیره شده در CartItem
      const productPrice = product?.price ?? 0; // قیمت اصلی محصول
      const quantity = item?.quantity ?? 0;

      // محاسبه قیمت اصلی (بدون تخفیف)
      const itemPriceWithoutDiscount = productPrice * quantity;
      totalWithoutDiscount += itemPriceWithoutDiscount;

      // محاسبه قیمت نهایی (با تخفیف)
      if (savedPrice && savedPrice > 0) {
        // ✅ مستقیماً از savedPrice استفاده کن (قیمت واحد با تخفیف)
        const itemPriceWithDiscount = savedPrice * quantity;
        totalWithDiscount += itemPriceWithDiscount;
      } else {
        // اگر savedPrice وجود نداشت، از discountPrice محصول استفاده کن
        const discountPrice = product?.discountPrice || productPrice;
        const itemPriceWithDiscount = discountPrice * quantity;
        totalWithDiscount += itemPriceWithDiscount;
      }
    }

    const savings = totalWithoutDiscount - totalWithDiscount;
    const savingsPercentage =
      totalWithoutDiscount > 0
        ? Math.round((savings / totalWithoutDiscount) * 100)
        : 0;

    return {
      totalWithoutDiscount,
      totalWithDiscount,
      totalSavings: savings,
      savingsPercentage,
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

  async editCart(
    id: string,
    body: EditCartItemDto,
    userId?: string,
    sessionId?: string,
  ) {
    // ✅ بررسی authorization (بدون بررسی انقضا)
    // ✅ Cart منقضی شده حذف نمی‌شود - فقط هنگام checkout بررسی می‌شود
    const cart = await this.findCart(id, userId, sessionId);

    // به‌روزرسانی زمان فعالیت
    await this.cartCleanupService.updateCartActivity(id);

    const cartItem = await this.findCartItemById(body.cartItem);

    // بررسی اینکه cartItem متعلق به این cart است
    const cartItemCartId =
      (cartItem.cart as any)?._id?.toString() ||
      (cartItem.cart as any)?.toString();
    if (cartItemCartId !== id && cartItemCartId !== cart._id.toString()) {
      throw new ForbiddenException('این آیتم متعلق به این سبد خرید نیست');
    }

    // بررسی موجودی محصول
    const product = await this.productService.findOne(
      (cartItem.product as any)._id?.toString() ||
        (cartItem.product as any).toString(),
    );

    if (product.stock < body.quantity) {
      throw new BadRequestException(
        `موجودی ${product.name || 'محصول'} کافی نیست. موجودی فعلی: ${product.stock}`,
      );
    }

    // اگر quantity صفر یا منفی باشد، آیتم را حذف کن
    if (body.quantity <= 0) {
      await this.deleteCartItem(body.cartItem);
      const remainingItems = await this.findCartItem(id);
      if (remainingItems.length === 0) {
        await this.deleteCart(id, userId, sessionId);
        return {
          cart: null,
          items: [],
          itemCount: 0,
          totalItems: 0,
          totalPrice: 0,
          prices: {
            totalWithoutDiscount: 0,
            totalWithDiscount: 0,
            totalSavings: 0,
            savingsPercentage: 0,
          },
        };
      }
      return this.getCartDetails(id, userId, sessionId);
    }

    cartItem.quantity = body.quantity;
    await cartItem.save();
    return this.getCartDetails(id, userId, sessionId);
  }

  async addItemToCart(
    id: string,
    body: newCartDto,
    userId?: string,
    sessionId?: string,
  ) {
    // ✅ اگر کاربر لاگین است، بررسی registrationStatus
    if (userId) {
      // ✅ استفاده از lean() برای اطمینان از دریافت آخرین داده از database (بدون cache)
      const userDoc = await this.userModel
        .findById(userId)
        .select('registrationStatus mobile otpVerifiedAt')
        .lean();
      if (!userDoc) {
        throw new ForbiddenException('کاربر یافت نشد. لطفاً دوباره وارد شوید');
      }
      if (userDoc.registrationStatus !== RegistrationStatus.Complete) {
        // ✅ بررسی اینکه آیا otpVerifiedAt بیش از 7 روز گذشته است
        // ✅ اگر گذشته باشد، کاربر باید دوباره OTP بگیرد
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isOtpVerificationExpired =
          !userDoc.otpVerifiedAt || userDoc.otpVerifiedAt < sevenDaysAgo;

        if (isOtpVerificationExpired) {
          // ✅ کاربر pending است و OTP verification منقضی شده یا وجود ندارد
          // ✅ باید modal OTP برایش باز شود و کد ارسال شود
          throw new OtpRequiredException(userDoc.mobile);
        }

        // ✅ کاربر لاگین است و OTP verify شده اما اطلاعات کامل ندارد
        // ✅ خطای مخصوص که نشان می‌دهد کاربر لاگین است و فقط باید فرم تکمیل اطلاعات را نشان دهد
        throw new IncompleteRegistrationException(userDoc.mobile);
      }
    }

    // ✅ بررسی authorization (بدون بررسی انقضا)
    // ✅ Cart منقضی شده حذف نمی‌شود - فقط هنگام checkout بررسی می‌شود
    const cart = await this.findCart(id, userId, sessionId);

    // به‌روزرسانی زمان فعالیت
    await this.cartCleanupService.updateCartActivity(id);
    // بررسی وجود محصول و موجودی
    const product = await this.productService.findOne(body.productId);

    if (!product.isAvailable) {
      throw new BadRequestException('این محصول در حال حاضر موجود نیست');
    }

    const requestedQuantity = body.quantity || 1;

    if (product.stock < requestedQuantity) {
      throw new BadRequestException(
        `موجودی ${product.name} کافی نیست. موجودی فعلی: ${product.stock}`,
      );
    }

    // دریافت قیمت نهایی محصول (با تخفیف)
    const finalPrice = product.discountPrice || product.price;

    // پیدا کردن آیتم موجود در سبد
    const items = await this.findCartItem(id);

    // منطق چک کردن آیتم موجود بر اساس productType
    let oldItem: any = null;
    const productType = product?.productType || 'jewelry';

    if (productType === 'jewelry') {
      // برای جواهرات: productId + size را چک کن
      oldItem = items.find((item) => {
        const itemProductId =
          (item.product as any)._id?.toString() ||
          (item.product as any).toString();
        return (
          itemProductId === body.productId &&
          (item.size || '') === (body.size || '')
        );
      });
    } else {
      // برای سکه و شمش: فقط productId را چک کن
      oldItem = items.find((item) => {
        const itemProductId =
          (item.product as any)._id?.toString() ||
          (item.product as any).toString();
        return itemProductId === body.productId;
      });
    }

    if (oldItem?._id) {
      // اگر آیتم موجود باشد، quantity را افزایش بده
      const newQuantity = requestedQuantity + oldItem.quantity;

      // بررسی موجودی برای quantity جدید
      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `موجودی ${product.name} کافی نیست. موجودی فعلی: ${product.stock}`,
        );
      }

      await this.editCart(
        id,
        {
          cartItem: (oldItem._id as Types.ObjectId).toString(),
          quantity: newQuantity,
        },
        userId,
        sessionId,
      );
    } else {
      // اگر آیتم موجود نباشد، آیتم جدید اضافه کن
      await this.createCartItem({
        product: body.productId,
        quantity: requestedQuantity,
        cart: id,
        price: finalPrice,
        size: body.size,
      });
    }

    return this.getCartDetails(id, userId, sessionId);
  }

  async removeCartAndItems(id: string, userId?: string, sessionId?: string) {
    const items = await this.findCartItem(id);

    for (const item of items) {
      await this.deleteCartItem((item._id as Types.ObjectId).toString());
    }

    // اگر userId یا sessionId وجود داشت، authorization check کن
    // وگرنه مستقیماً حذف کن (برای internal use مثل cleanup service)
    if (userId || sessionId) {
      await this.deleteCart(id, userId, sessionId);
    } else {
      // بدون authorization check (برای internal use)
      const cart = await this.cartModel.findOne({ _id: id }).exec();
      if (cart) {
        await cart.deleteOne();
      }
    }
  }

  async deleteCartItem(id: string) {
    const cartItem = await this.findCartItemById(id);
    await cartItem.deleteOne();
    return cartItem;
  }

  async deleteCart(id: string, userId?: string, sessionId?: string) {
    const cart = await this.findCart(id, userId, sessionId);
    await cart.deleteOne();
    return cart;
  }
  async removeItemFromCart(
    id: string,
    body: DeleteCartItemDto,
    userId?: string,
    sessionId?: string,
  ) {
    // ✅ بررسی authorization (بدون بررسی انقضا)
    // ✅ Cart منقضی شده حذف نمی‌شود - فقط هنگام checkout بررسی می‌شود
    const cart = await this.findCart(id, userId, sessionId);

    // به‌روزرسانی زمان فعالیت
    await this.cartCleanupService.updateCartActivity(id);

    // بررسی اینکه cartItem وجود دارد و متعلق به این cart است
    const cartItem = await this.cartItemModel
      .findOne({
        _id: body.cartItem,
        cart: id, // ✅ فقط cartItem متعلق به این cart
      })
      .exec();

    if (!cartItem) {
      throw new NotFoundException('آیتم در سبد خرید یافت نشد');
    }

    await this.deleteCartItem(body.cartItem);

    // بررسی اینکه آیا آیتم دیگری در سبد وجود دارد یا نه
    const remainingItems = await this.findCartItem(id);
    if (remainingItems && remainingItems.length > 0) {
      return this.getCartDetails(id, userId, sessionId);
    }

    // اگر سبد خالی شد، آن را حذف کن و response خالی برگردان
    await this.deleteCart(id, userId, sessionId);
    return {
      cart: null,
      items: [],
      itemCount: 0,
      totalItems: 0,
      totalPrice: 0,
      expiresAt: null,
      remainingSeconds: 0,
      prices: {
        totalWithoutDiscount: 0,
        totalWithDiscount: 0,
        totalSavings: 0,
        savingsPercentage: 0,
      },
    };
  }

  /**
   * حذف آیتم از سبد خرید با استفاده از cartItem ID
   * این متد برای Frontend استفاده می‌شود که فقط cartItem ID را دارد
   */
  async removeItemByCartItemId(
    cartItemId: string,
    userId?: string,
    sessionId?: string,
  ) {
    // پیدا کردن cartItem و cart آن
    const cartItem = await this.cartItemModel
      .findOne({ _id: cartItemId })
      .populate('cart')
      .exec();

    if (!cartItem) {
      throw new NotFoundException('آیتم در سبد خرید یافت نشد');
    }

    const cartId =
      (cartItem.cart as any)?._id?.toString() ||
      (cartItem.cart as any)?.toString();

    if (!cartId) {
      throw new NotFoundException('سبد خرید یافت نشد');
    }

    // استفاده از متد موجود removeItemFromCart
    return this.removeItemFromCart(
      cartId,
      { cartItem: cartItemId },
      userId,
      sessionId,
    );
  }
}
