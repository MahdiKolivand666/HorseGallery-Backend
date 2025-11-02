import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDto } from '../dtos/blog.dto';
import { Blog } from '../schemas/blog.schema';
import { Model, FilterQuery, SortOrder } from 'mongoose';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { BlogQueryDto } from '../dtos/blog-query.dto';
import { deleteImages } from 'src/shared/utils/file-utils';
import { UpdateBlogCategoryDto } from '../dtos/update-blog-category.dto';
import { url } from 'inspector';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name) private readonly blogModel: Model<Blog>,
  ) {}

  async findAll(
    queryParams: BlogQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const {
      limit = 5,
      page = 1,
      title,
      sort,
      user,
      category,
      url,
      exclude,
    } = queryParams;
    const query: FilterQuery<Blog> = {};

    // Add title filter if provided
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (url) {
      query.url = { $regex: url, $options: 'i' };
    }
    if (user) {
      query.user = user;
    }
    if (category) {
      query.category = category;
    }
    if (exclude?.length) {
      query._id = { $nin: exclude };
    }
    // Sorting removed
    const sortObject = sortFunction(sort);
    // Execute the query with sorting
    const blogs = await this.blogModel
      .find(query)
      .skip((page - 1) * limit)
      .populate('category', { title: 1 })
      .sort(sortObject)
      .select(selectObject)
      .limit(limit)
      .exec();

    // Get total count for pagination
    const count = await this.blogModel.countDocuments(query);

    return {
      blogs,
      count,
    };
  }

  async findOne(id: string, selectObject: Record<string, 0 | 1> = { __v: 0 }) {
    const blog = await this.blogModel
      .findOne({ _id: id })
      .populate('category', { title: 1 })
      .select(selectObject)
      .exec();

    if (blog) {
      return blog;
    } else {
      throw new NotFoundException();
    }
  }

  async findOneWithUrl(
    url: string,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const blog = await this.blogModel
      .findOne({ url: url })
      .populate('category', { title: 1 })
      .select(selectObject)
      .exec();

    if (blog) {
      return blog;
    } else {
      throw new NotFoundException();
    }
  }

  async create(body: BlogDto, user: string) {
    const newBlog = new this.blogModel({ ...body, user: user });
    await newBlog.save();
    return newBlog;
  }

  async update(id: string, body: UpdateBlogCategoryDto) {
    const blog = await this.findOne(id, { _id: 1, image: 1 });
    if (body?.image) {
      await deleteImages(blog.image, 'blog');
    }

    return await this.blogModel.findByIdAndUpdate(id, body, { new: true });
  }

  async delete(id: string) {
    const blog = await this.findOne(id);
    await deleteImages(blog.image, 'blog');
    await blog.deleteOne();

    return blog;
  }
}
