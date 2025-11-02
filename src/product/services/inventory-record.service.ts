import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InventoryRecord } from '../schemas/inventory-record.schema';
import { Model } from 'mongoose';
import { InventoryRecordDto } from '../dtos/inventroy-record.dto';
import { InventoryRecordQueryDto } from '../dtos/inventory-record-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';

@Injectable()
export class InventoryRecordService {
  constructor(
    @InjectModel(InventoryRecord.name)
    private readonly inventoryRecordModel: Model<InventoryRecord>,
  ) {}

  async createRecord(body: InventoryRecordDto) {
    const newInventoryRecord = new this.inventoryRecordModel(body);
    await newInventoryRecord.save();
    return newInventoryRecord;
  }

  async findAll(
    queryParams: InventoryRecordQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const { limit = 5, page = 1, sort, product } = queryParams;
    const query: Record<string, unknown> = {};

    if (product) {
      query.product = product;
    }
    const sortObject = sortFunction(sort);

    const InventoryRecord = await this.inventoryRecordModel
      .find(query)
      .find(query)
      .populate('product', { title: 1 })
      .sort(sortObject)
      .select(selectObject)
      .skip(page - 1)
      .limit(limit)
      .exec();

    const count = await this.inventoryRecordModel.countDocuments(query);

    return { count, InventoryRecord };
  }
}
