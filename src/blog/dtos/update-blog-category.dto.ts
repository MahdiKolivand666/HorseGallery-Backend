import { PartialType } from '@nestjs/mapped-types';
import { BlogCategoryDto } from './blog-category.dto';

export class UpdateBlogCategoryDto extends PartialType(BlogCategoryDto) {}
