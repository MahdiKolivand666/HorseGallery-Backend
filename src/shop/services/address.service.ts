import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address } from '../schemas/address.schema';
import { CreateAddressDto } from '../dtos/create-address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
  ) {}

  /**
   * دریافت لیست آدرس‌های کاربر یا مهمان
   */
  async findAll(userId?: string, sessionId?: string): Promise<Address[]> {
    const query: Record<string, unknown> = {};

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    } else if (sessionId) {
      query.sessionId = sessionId;
    } else {
      return [];
    }

    return this.addressModel
      .find(query)
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  /**
   * دریافت یک آدرس خاص
   */
  async findOne(
    id: string,
    userId?: string,
    sessionId?: string,
  ): Promise<Address> {
    const address = await this.addressModel.findById(id).exec();

    if (!address) {
      throw new NotFoundException('آدرس یافت نشد');
    }

    // بررسی دسترسی
    if (userId && address.userId?.toString() !== userId) {
      throw new ForbiddenException('شما دسترسی به این آدرس ندارید');
    }

    if (sessionId && address.sessionId !== sessionId) {
      throw new ForbiddenException('شما دسترسی به این آدرس ندارید');
    }

    return address;
  }

  /**
   * ایجاد آدرس جدید
   * همه فیلدهای هر دو بخش (آدرس + مشخصات سفارش‌دهنده) ذخیره می‌شوند
   */
  async create(
    body: CreateAddressDto,
    userId?: string,
    sessionId?: string,
  ): Promise<Address> {
    // بررسی اینکه یا userId یا sessionId وجود داشته باشد
    if (!userId && !sessionId) {
      throw new BadRequestException(
        'برای افزودن آدرس باید لاگین باشید یا sessionId داشته باشید',
      );
    }

    // ✅ بررسی محدودیت 2 آدرس برای کاربران لاگین شده
    if (userId) {
      const userAddresses = await this.addressModel
        .find({ userId: new Types.ObjectId(userId) })
        .exec();
      if (userAddresses.length >= 2) {
        throw new BadRequestException({
          message: ['بیشتر از ۲ آدرس نمی‌توانید اضافه کنید'],
          code: 'MAX_ADDRESSES_EXCEEDED',
        });
      }
    }

    // اگر isDefault true باشد، آدرس‌های قبلی پیش‌فرض را false کن
    if (body.isDefault) {
      await this.unsetDefaultAddress(userId, sessionId);
    }

    // آماده‌سازی داده‌ها
    const addressData: any = {
      // بخش اول: فیلدهای آدرس
      title: body.title?.trim() || '',
      province: body.province?.trim() || '',
      city: body.city?.trim() || '',
      postalCode: body.postalCode?.trim() || '',
      address: body.address?.trim() || '',

      // بخش دوم: فیلدهای مشخصات سفارش‌دهنده
      firstName: body.firstName?.trim() || '',
      lastName: body.lastName?.trim() || '',
      nationalId: body.nationalId?.trim() || '',
      mobile: body.mobile?.trim() || '',
      email: body.email && body.email.trim() !== '' ? body.email.trim() : null,
      notes: body.notes && body.notes.trim() !== '' ? body.notes.trim() : null,
      isDefault: body.isDefault ?? false,

      // فیلدهای کاربر
      userId: userId ? new Types.ObjectId(userId) : null,
      sessionId: sessionId?.trim() || sessionId || null,
    };

    // ایجاد آدرس
    const newAddress = new this.addressModel(addressData);

    // ذخیره با bypass کردن validation
    await newAddress.save({ validateBeforeSave: false });

    // ✅ Force update با استفاده از MongoDB driver برای ذخیره فیلدهای بخش دوم
    // این کار باعث می‌شود که فیلدها حتی اگر در schema paths نباشند، ذخیره شوند
    if (newAddress._id) {
      await this.addressModel.collection.updateOne(
        { _id: newAddress._id },
        {
          $set: {
            firstName: addressData.firstName,
            lastName: addressData.lastName,
            nationalId: addressData.nationalId,
            mobile: addressData.mobile,
            email: addressData.email,
            notes: addressData.notes,
            userId: addressData.userId,
            sessionId: addressData.sessionId,
          },
        },
      );
    }

    // ✅ خواندن مجدد از database برای اطمینان از وجود همه فیلدها
    const savedAddress = await this.addressModel
      .findById(newAddress._id)
      .exec();

    if (!savedAddress) {
      throw new BadRequestException('خطا در ذخیره آدرس');
    }

    return savedAddress;
  }

  /**
   * به‌روزرسانی آدرس
   */
  async update(
    id: string,
    body: UpdateAddressDto,
    userId?: string,
    sessionId?: string,
  ): Promise<Address> {
    const address = await this.findOne(id, userId, sessionId);

    // اگر isDefault true باشد، آدرس‌های قبلی پیش‌فرض را false کن
    if (body.isDefault) {
      await this.unsetDefaultAddress(userId, sessionId, id);
    }

    // به‌روزرسانی فیلدها
    const updateData: any = {};

    // بخش اول: فیلدهای آدرس
    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }
    if (body.province !== undefined) {
      updateData.province = body.province.trim();
    }
    if (body.city !== undefined) {
      updateData.city = body.city.trim();
    }
    if (body.postalCode !== undefined) {
      updateData.postalCode = body.postalCode.trim();
    }
    if (body.address !== undefined) {
      updateData.address = body.address.trim();
    }

    // بخش دوم: فیلدهای مشخصات سفارش‌دهنده
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName.trim();
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName.trim();
    }
    if (body.nationalId !== undefined) {
      updateData.nationalId = body.nationalId.trim();
    }
    if (body.mobile !== undefined) {
      updateData.mobile = body.mobile.trim();
    }

    // فیلدهای اختیاری
    if ('email' in body) {
      updateData.email =
        body.email && body.email.trim() !== '' ? body.email.trim() : null;
    }
    if ('notes' in body) {
      updateData.notes =
        body.notes && body.notes.trim() !== '' ? body.notes.trim() : null;
    }
    if ('isDefault' in body) {
      updateData.isDefault = body.isDefault ?? false;
    }

    // اعمال تغییرات
    Object.assign(address, updateData);
    await address.save();

    return address;
  }

  /**
   * حذف آدرس
   */
  async delete(id: string, userId?: string, sessionId?: string): Promise<void> {
    const address = await this.findOne(id, userId, sessionId);
    await address.deleteOne();
  }

  /**
   * تنظیم آدرس به عنوان پیش‌فرض
   */
  async setDefault(
    id: string,
    userId?: string,
    sessionId?: string,
  ): Promise<Address> {
    const address = await this.findOne(id, userId, sessionId);

    // غیر پیش‌فرض کردن بقیه آدرس‌ها
    await this.unsetDefaultAddress(userId, sessionId, id);

    // تنظیم این آدرس به عنوان پیش‌فرض
    address.isDefault = true;
    await address.save();

    return address;
  }

  /**
   * غیر پیش‌فرض کردن همه آدرس‌های کاربر/مهمان (به جز آدرس مشخص شده)
   */
  private async unsetDefaultAddress(
    userId?: string,
    sessionId?: string,
    excludeId?: string,
  ): Promise<void> {
    const query: Record<string, unknown> = { isDefault: true };

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    } else if (sessionId) {
      query.sessionId = sessionId;
    } else {
      return;
    }

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    await this.addressModel.updateMany(query, { isDefault: false }).exec();
  }

  /**
   * تبدیل آدرس‌های مهمان به آدرس‌های کاربر (بعد از login)
   */
  async mergeGuestAddresses(
    userId: string,
    sessionId: string,
  ): Promise<Address[]> {
    // پیدا کردن آدرس‌های مهمان
    const guestAddresses = await this.addressModel.find({ sessionId }).exec();

    if (guestAddresses.length === 0) {
      return [];
    }

    // پیدا کردن آدرس‌های کاربر
    const userAddresses = await this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();

    // تبدیل sessionId به userId برای همه آدرس‌های مهمان
    for (const guestAddress of guestAddresses) {
      // بررسی تکراری بودن (بر اساس mobile)
      const isDuplicate = userAddresses.some(
        (addr) => addr.mobile === guestAddress.mobile,
      );

      if (!isDuplicate) {
        guestAddress.userId = new Types.ObjectId(userId);
        guestAddress.sessionId = null;
        await guestAddress.save();
        userAddresses.push(guestAddress);
      } else {
        // اگر تکراری است، آدرس مهمان را حذف کن
        await guestAddress.deleteOne();
      }
    }

    // اگر هیچ آدرس پیش‌فرضی وجود ندارد، اولین آدرس را پیش‌فرض کن
    const finalUserAddresses = await this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();

    const hasDefault = finalUserAddresses.some((addr) => addr.isDefault);

    if (!hasDefault && finalUserAddresses.length > 0) {
      finalUserAddresses[0].isDefault = true;
      await finalUserAddresses[0].save();
    }

    return finalUserAddresses;
  }
}
