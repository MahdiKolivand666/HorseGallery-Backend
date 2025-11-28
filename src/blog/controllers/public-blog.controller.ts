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
  @ApiResponse({ status: 200, description: 'Blog posts retrieved successfully' })
  async findAll(@Query() queryParams: PublicBlogQueryDto) {
    return this.blogService.findPublicBlogs(queryParams);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single blog post by slug' })
  @ApiResponse({ status: 200, description: 'Blog post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  async findOne(@Param('slug') slug: string) {
    const blog = await this.blogService.findOneWithUrl(slug, {
      __v: 0,
    });

    // Populate author and category
    await blog.populate('user', { firstName: 1, lastName: 1, avatar: 1 });
    await blog.populate('category', { title: 1, slug: 1 });

    return blog;
  }
}

