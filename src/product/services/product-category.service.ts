import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategoryDto } from '../dtos/product-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProductCategory } from '../schemas/product-category.schema';
import { Model } from 'mongoose';
import { ProductCategoryQueryDto } from '../dtos/product-category-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { deleteImages } from 'src/shared/utils/file-utils';
import { UpdateProductCategoryDto } from '../dtos/update-product-category.dto';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategory>,
  ) {}

  async findAll(
    queryParams: ProductCategoryQueryDto,
    selectObject: any = { __v: 0 },
  ) {
    const { limit = 5, page = 1, title, sort, url } = queryParams;

    const query: any = {};

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (url) {
      query.url = { $regex: url, $options: 'i' };
    }

    const sortObject = sortFunction(sort);

    const productCategories = await this.productCategoryModel
      .find(query)
      .sort(sortObject)
      .select(selectObject)
      .skip(page - 1)
      .limit(limit)
      .exec();

    const count = await this.productCategoryModel.countDocuments(query);

    return { count, productCategories };
  }

  async findOne(id: string, selectObject: any = { __v: 0 }) {
    const productCategory = await this.productCategoryModel
      .findOne({ _id: id })
      .select(selectObject)
      .exec();
    if (productCategory) {
      return productCategory;
    } else {
      throw new NotFoundException();
    }
  }

  async findOneWithUrl(url: string, selectObject: any = { __v: 0 }) {
    const productCategory = await this.productCategoryModel
      .findOne({ url: url })
      .select(selectObject)
      .exec();
    if (productCategory) {
      return productCategory;
    } else {
      throw new NotFoundException();
    }
  }

  async create(body: ProductCategoryDto) {
    const newProductCategory = new this.productCategoryModel(body);
    await newProductCategory.save();
    return newProductCategory;
  }

  async update(id: string, body: UpdateProductCategoryDto) {
    const productCategory = await this.findOne(id, { _id: 1, image: 1 });

    if (body?.image) {
      await deleteImages(productCategory.image, 'productCategory');
    }

    return await this.productCategoryModel.findByIdAndUpdate(id, body, {
      new: true,
    });
  }

  async delete(id: string) {
    const productCategory = await this.findOne(id);

    await deleteImages(productCategory.image, 'productCategory');
    await productCategory.deleteOne();

    return productCategory;
  }
}
