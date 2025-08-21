import { Body, Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

// The following imports may need to be updated with correct paths if the files are moved.
// If the files do not exist, please create them or correct the import paths.
import { BlogCategoryDto } from '../dtos/blog-category.dto';
import { BlogCategoryQueryDto } from '../dtos/blog-category-query.dto';
import { BlogCategory } from '../schemas/blog-category.schema';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { Model } from 'mongoose';
import { deleteImages } from 'src/shared/utils/file-utils';
import { UpdateBlogCategoryDto } from '../dtos/update-blog-category.dto';

@Injectable()
export class BlogCategoryService {
  constructor(
    @InjectModel(BlogCategory.name)
    private readonly blogCategoryModel: Model<BlogCategory>,
  ) {}

  async findAll(
    queryParams: BlogCategoryQueryDto,
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

    const blogCategories = await this.blogCategoryModel
      .find(query)
      .skip(page - 1)
      .sort(sortObject)
      .select(selectObject)
      .limit(limit)
      .exec();

    const count = await this.blogCategoryModel.countDocuments(query);

    return { count, blogCategories };
  }

  async findOne(id: string, selectObject: any = { __v: 0 }) {
    const blogCategory = await this.blogCategoryModel
      .findOne({ _id: id })
      .select(selectObject)
      .exec();
    if (blogCategory) {
      return blogCategory;
    } else {
      throw new NotFoundException();
    }
  }
  async findOneWithUrl(url: string, selectObject: any = { __v: 0 }) {
    const blogCategory = await this.blogCategoryModel
      .findOne({ url: url })
      .select(selectObject)
      .exec();
    if (blogCategory) {
      return blogCategory;
    } else {
      throw new NotFoundException();
    }
  }

  async create(body: BlogCategoryDto) {
    const newBlogCategory = new this.blogCategoryModel(body);
    await newBlogCategory.save();
    return newBlogCategory;
  }

  async update(id: string, body: UpdateBlogCategoryDto) {
    const blogCategory = await this.findOne(id, { _id: 1, image: 1 });
    if (body?.image) {
      await deleteImages(blogCategory.image, 'blogCategory');
    }
    return await this.blogCategoryModel.findByIdAndUpdate(id, body, {
      new: true,
    });
  }

  async delete(id: string) {
    const blogCategory = await this.findOne(id);
    await deleteImages(blogCategory.image, 'blogCategory');
    await blogCategory.deleteOne();
    return blogCategory;
  }
}
