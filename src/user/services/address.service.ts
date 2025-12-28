import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddressQueryDto } from '../dtos/address-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { Address as ShopAddress } from 'src/shop/schemas/address.schema';
import { AddressDto } from '../dtos/address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(ShopAddress.name)
    private readonly addressModel: Model<ShopAddress>,
  ) {}

  async findAll(
    queryParams: AddressQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const { limit = 10, page = 1, userId } = queryParams;

    const query: Record<string, unknown> = {};
    if (userId) query.userId = new Types.ObjectId(userId);

    const sortObject = sortFunction(queryParams?.sort);

    const addresses = await this.addressModel
      .find(query)
      .skip(page - 1)
      .limit(limit)
      .sort(sortObject)
      .select(selectObject)
      .exec();

    const count = await this.addressModel.countDocuments(query);

    return { count, addresses };
  }

  async findOne(id: string, selectObject: Record<string, 0 | 1> = { __v: 0 }) {
    const address = await this.addressModel
      .findOne({ _id: id })
      .select(selectObject)
      .exec();

    if (address) {
      return address;
    } else {
      throw new NotFoundException('یافت نشد');
    }
  }

  async create(body: AddressDto, userId: string) {
    // ✅ تبدیل AddressDto قدیمی به format جدید
    const addressData = {
      title: body.title || 'خانه',
      province: body.province,
      city: body.city,
      postalCode: body.postalCode || '',
      address: body.address,
      // تبدیل recipientName/recipientMobile به firstName/lastName/mobile
      firstName: body.recipientName || body.receiverName || '',
      lastName: '', // AddressDto قدیمی lastName ندارد
      nationalId: '', // AddressDto قدیمی nationalId ندارد
      mobile: body.recipientMobile || body.receiverMobile || '',
      email: null,
      notes: body.content || null,
      isDefault: body.isDefault ?? false,
      userId: new Types.ObjectId(userId),
    };

    const newAddress = new this.addressModel(addressData);
    await newAddress.save();
    return newAddress;
  }

  async update(id: string, body: UpdateAddressDto) {
    return await this.addressModel.findByIdAndUpdate(id, body, {
      new: true,
    });
  }

  async delete(id: string) {
    const address = await this.findOne(id);
    await address.deleteOne();
    return address;
  }
}
