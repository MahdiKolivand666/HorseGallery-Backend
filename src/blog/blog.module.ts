import { Module } from '@nestjs/common';
import { BlogController } from './controllers/blog.controller';
import { BlogService } from './services/blog.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { BlogCategoryController } from './controllers/blog-category.controller';
import {
  BlogCategory,
  BlogCategorySchema,
} from './schemas/blog-category.schema';
import { BlogCategoryService } from './services/blog-category.service';
import { SiteBlogController } from './controllers/site-blog.controller';
import { PublicBlogController } from './controllers/public-blog.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      {
        name: BlogCategory.name,
        schema: BlogCategorySchema,
      },
    ]),
  ],
  controllers: [
    // Public controllers must be registered FIRST to avoid route conflicts
    PublicBlogController,
    SiteBlogController,
    BlogController,
    BlogCategoryController,
  ],
  providers: [BlogService, BlogCategoryService],
})
export class BlogModule {}
