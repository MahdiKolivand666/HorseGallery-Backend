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

  async findAll(
    queryParams: ProductQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const {
      limit = 5,
      page = 1,
      title,
      sort,
      category,
      url,
      exclude,
    } = queryParams;

    const query: Record<string, unknown> = {};

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

  async findOne(id: string, selectObject: Record<string, 0 | 1> = { __v: 0 }) {
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

  async findOneWithUrl(
    url: string,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
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
    // Optimistic locking with retries
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const product = await this.productModel.findById(id);

        if (!product) {
          throw new NotFoundException('محصول یافت نشد');
        }

        const oldStock = product.stock || 0;
        const oldVersion = product.version || 1;

        if (oldStock === 0) {
          throw new BadRequestException(
            `تعداد محصول ${product?.title} کمتر از 0 است`,
          );
        }

        if (oldStock < quantity) {
          throw new BadRequestException(
            `موجودی کافی نیست. موجودی فعلی: ${oldStock}`,
          );
        }

        // Use findOneAndUpdate with version check for atomic operation
        const updatedProduct = await this.productModel.findOneAndUpdate(
          { _id: id, version: oldVersion },
          {
            $inc: { stock: -quantity, version: 1 },
          },
          { new: true },
        );

        if (!updatedProduct) {
          // Version mismatch - someone else updated the product
          retries++;
          if (retries >= maxRetries) {
            throw new BadRequestException(
              'خطا در به‌روزرسانی موجودی. لطفاً دوباره تلاش کنید',
            );
          }
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 100 * retries));
          continue;
        }

        // Record the inventory change
        await this.inventoryRecordService.createRecord({
          action: Action.Remove,
          quantity: quantity,
          editedBy: editedBy,
          product: id,
          order: order ?? undefined,
        });

        return updatedProduct;
      } catch (error) {
        if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException
        ) {
          throw error;
        }
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
      }
    }

    throw new BadRequestException(
      'خطا در به‌روزرسانی موجودی بعد از چندین تلاش',
    );
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
