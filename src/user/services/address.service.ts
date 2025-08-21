import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { AddressQueryDto } from '../dtos/address-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { Address } from '../schemas/address.schema';
import { AddressDto } from '../dtos/address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
  ) {}

  async findAll(queryParams: AddressQueryDto, selectObject: any = { __v: 0 }) {
    const { limit = 10, page = 1, user } = queryParams;

    const query: any = {};
    if (user) query.user = user;

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

  async findOne(id: string, selectObject: any = { __v: 0 }) {
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

  async create(body: AddressDto, user: string) {
    const newAddress = new this.addressModel({ ...body, user: user });
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
