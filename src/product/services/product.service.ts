import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductDto } from '../dtos/product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from '../schemas/product.schema';
import { Model } from 'mongoose';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { deleteImages } from 'src/shared/utils/file-utils';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { InventoryRecordService } from './inventory-record.service';
import { Action, EditedBy } from '../schemas/inventory-record.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly inventoryRecordService: InventoryRecordService,
  ) {}

  async findAll(queryParams: ProductQueryDto, selectObject: any = { __v: 0 }) {
    const {
      limit = 5,
      page = 1,
      title,
      sort,
      category,
      url,
      exclude,
    } = queryParams;

    const query: any = {};

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (url) {
      query.url = { $regex: url, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (exclude?.length) {
      query._id = { $nin: exclude };
    }

    const sortObject = sortFunction(sort);

    const products = await this.productModel
      .find(query)
      .populate('category', { title: 1 })
      .sort(sortObject)
      .select(selectObject)
      .skip(page - 1)
      .limit(limit)
      .exec();

    const count = await this.productModel.countDocuments(query);

    return { count, products };
  }

  async findOne(id: string, selectObject: any = { __v: 0 }) {
    const product = await this.productModel
      .findOne({ _id: id })
      .populate('category', { title: 1 })
      .select(selectObject)
      .exec();
    if (product) {
      return product;
    } else {
      throw new NotFoundException();
    }
  }

  async findOneWithUrl(url: string, selectObject: any = { __v: 0 }) {
    const product = await this.productModel
      .findOne({ url: url })
      .populate('category', { title: 1 })
      .select(selectObject)
      .exec();
    if (product) {
      return product;
    } else {
      throw new NotFoundException();
    }
  }

  async create(body: ProductDto) {
    const newProduct = new this.productModel(body);
    await newProduct.save();
    return newProduct;
  }

  async update(id: string, body: UpdateProductDto) {
    const product = await this.findOne(id, { _id: 1, image: 1 });

    if (body?.images?.length) {
      // eslint-disable-next-line no-unsafe-optional-chaining
      for (const image of product?.images) {
        if (!body.images.includes(image)) {
          await deleteImages(image, 'product');
        }
      }
    }
    return await this.productModel.findByIdAndUpdate(id, body, { new: true });
  }

  async addStock(
    id: string,
    quantity: number,
    editedBy: EditedBy,
    order: string | null = null,
  ) {
    const product = await this.findOne(id);
    const oldStock = product.stock || 0;
    product.stock = oldStock + quantity;
    await product.save();
    await this.inventoryRecordService.createRecord({
      action: Action.Add,
      quantity: quantity,
      editedBy: editedBy,
      product: id,
      order: order ?? undefined,
    });
    return product;
  }

  async removeStock(
    id: string,
    quantity: number,
    editedBy: EditedBy,
    order: string | null = null,
  ) {
    const product = await this.findOne(id);
    const oldStock = product.stock || 0;
    if (oldStock === 0) {
      throw new BadRequestException(
        `تعداد محصول ${product?.title} کمتر از 0 است`,
      );
    }
    if (oldStock < quantity) {
      throw new BadRequestException('موجودی کافی نیست');
    }
    product.stock = oldStock - quantity;
    await product.save();
    await this.inventoryRecordService.createRecord({
      action: Action.Remove,
      quantity: quantity,
      editedBy: editedBy,
      product: id,
      order: order ?? undefined,
    });
    return product;
  }
  async delete(id: string) {
    const product = await this.findOne(id);

    // eslint-disable-next-line no-unsafe-optional-chaining
    for (const image of product?.images) {
      await deleteImages(image, 'product');
    }
    await product.deleteOne();

    return product;
  }
}
