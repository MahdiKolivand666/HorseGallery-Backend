import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlogService } from '../services/blog.service';
import { PublicBlogQueryDto } from '../dtos/public-blog-query.dto';
import { Public } from 'src/shared/decorators/public.decorator';

@ApiTags('Public Blog')
@Controller('blog/public')
@Public() // Mark entire controller as public
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'Get public blog posts list' })
  @ApiResponse({
    status: 200,
    description: 'Blog posts retrieved successfully',
  })
  async findAll(@Query() queryParams: PublicBlogQueryDto) {
    return this.blogService.findPublicBlogs(queryParams);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single blog post by slug' })
  @ApiResponse({ status: 200, description: 'Blog post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  async findOne(@Param('slug') slug: string) {
    // Use findPublicBlogBySlug which:
    // 1. Only returns published blogs
    // 2. Automatically increments views
    // 3. Populates category and author
    const blog = await this.blogService.findPublicBlogBySlug(slug);

    // Map response to match frontend expectations
    const blogData = blog as any;
    return {
      _id: blogData._id,
      title: blogData.title,
      slug: blogData.slug,
      content: blogData.content,
      excerpt: blogData.excerpt,
      image: blogData.image,
      category: blogData.category
        ? {
            _id: blogData.category._id,
            name: blogData.category.title || blogData.category.name,
            slug: blogData.category.slug,
          }
        : null,
      author: blogData.user
        ? {
            _id: blogData.user._id,
            firstName: blogData.user.firstName,
            lastName: blogData.user.lastName,
            avatar: blogData.user.avatar,
          }
        : null,
      tags: blogData.tags || [],
      views: blogData.views || 0,
      likes: blogData.likes || 0,
      isFeatured: blogData.isFeatured || false,
      publishedAt: blogData.publishedAt,
      createdAt: blogData.createdAt,
      updatedAt: blogData.updatedAt,
    };
  }
}
