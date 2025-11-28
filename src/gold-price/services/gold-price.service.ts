import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoldPrice } from '../schemas/gold-price.schema';
import { CreateGoldPriceDto } from '../dtos/gold-price.dto';
import { UpdateGoldPriceDto } from '../dtos/gold-price.dto';

@Injectable()
export class GoldPriceService {
  constructor(
    @InjectModel(GoldPrice.name)
    private readonly goldPriceModel: Model<GoldPrice>,
  ) {}

  async findAll(isActive?: boolean) {
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    return this.goldPriceModel.find(query).sort({ date: -1 }).exec();
  }

  async findLatest(karat?: number) {
    const query: any = { isActive: true };
    if (karat) {
      query.karat = karat;
    }
    return this.goldPriceModel
      .findOne(query)
      .sort({ date: -1 })
      .exec();
  }

  async findOne(id: string) {
    const goldPrice = await this.goldPriceModel.findById(id).exec();
    if (!goldPrice) {
      throw new NotFoundException('Gold price not found');
    }
    return goldPrice;
  }

  async create(createGoldPriceDto: CreateGoldPriceDto) {
    const goldPrice = new this.goldPriceModel(createGoldPriceDto);
    return goldPrice.save();
  }

  async update(id: string, updateGoldPriceDto: UpdateGoldPriceDto) {
    const goldPrice = await this.goldPriceModel
      .findByIdAndUpdate(id, updateGoldPriceDto, { new: true })
      .exec();
    if (!goldPrice) {
      throw new NotFoundException('Gold price not found');
    }
    return goldPrice;
  }

  async delete(id: string) {
    const goldPrice = await this.goldPriceModel.findByIdAndDelete(id).exec();
    if (!goldPrice) {
      throw new NotFoundException('Gold price not found');
    }
    return goldPrice;
  }
}

