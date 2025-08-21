import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogCategoryService } from '../services/blog-category.service';
import { BlogCategoryQueryDto } from '../dtos/blog-category-query.dto';
import { ApiTags } from '@nestjs/swagger';
import { BlogService } from '../services/blog.service';
import { BlogQueryDto } from '../dtos/blog-query.dto';
import { title } from 'process';

@ApiTags('Public Blog ')
@Controller('site/blog')
export class SiteBlogController {
  constructor(
    private readonly blogCategoryService: BlogCategoryService,
    private readonly blogService: BlogService,
  ) {}

  @Get('categories')
  findCategories(@Query() queryParams: BlogCategoryQueryDto) {
    return this.blogCategoryService.findAll(queryParams, {
      title: 1,
      url: 1,
      image: 1,
    });
  }

  @Get('categories/:url')
  async findCategory(
    @Param('url') url: string,
    @Query() queryParams: BlogQueryDto,
  ) {
    const category = await this.blogCategoryService.findOneWithUrl(url);

    const categoryId =
      typeof category?._id === 'object' &&
      category._id !== null &&
      typeof (category._id as { toString: () => string }).toString ===
        'function'
        ? (category._id as { toString: () => string }).toString()
        : typeof category?._id === 'string'
          ? category._id
          : undefined;

    const { blogs, count } = await this.blogService.findAll(
      { ...queryParams, category: categoryId },
      {
        title: 1,
        url: 1,
        image: 1,
      },
    );
    return {
      category,
      blogs,
      count,
    };
  }

  @Get(':url')
  async findBlog(@Param('url') url: string) {
    const blog = await this.blogService.findOneWithUrl(url);
    const categoryId =
      typeof blog?.category?._id === 'object' &&
      blog.category._id !== null &&
      typeof (blog.category._id as { toString: () => string }).toString ===
        'function'
        ? (blog.category._id as { toString: () => string }).toString()
        : typeof blog?.category?._id === 'string'
          ? blog.category._id
          : undefined;

    const relatedBlogs = await this.blogService.findAll(
      {
        category: categoryId,
        exclude:
          typeof blog?._id === 'object' &&
          blog._id !== null &&
          typeof (blog._id as { toString: () => string }).toString ===
            'function'
            ? (blog._id as { toString: () => string }).toString()
            : typeof blog?._id === 'string'
              ? blog._id
              : undefined,
      },
      {
        title: 1,
        url: 1,
        image: 1,
      },
    );
    return {
      blog,
      relatedBlogs,
    };
  }
}
