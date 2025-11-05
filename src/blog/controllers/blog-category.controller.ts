import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BlogCategoryDto } from '../dtos/blog-category.dto';
import { BlogCategoryService } from '../services/blog-category.service';
import { BlogCategoryQueryDto } from '../dtos/blog-category-query.dto';
import { UpdateBlogCategoryDto } from '../dtos/update-blog-category.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { Role } from 'src/user/schemas/user.schema';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { UrlPipe } from 'src/shared/pipes/url.pipe';

@ApiTags('BlogCategory')
@Controller('blog-category')
@UseGuards(JwtGuard, new RoleGuard([Role.Admin, Role.CopyWriter]), CsrfGuard)
@ApiBearerAuth()
export class BlogCategoryController {
  constructor(private readonly blogCategoryService: BlogCategoryService) {}
  @Get()
  findAll(@Query() queryParams: BlogCategoryQueryDto) {
    return this.blogCategoryService.findAll(queryParams);
  }

  @Post()
  create(@Body(UrlPipe) body: BlogCategoryDto) {
    return this.blogCategoryService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogCategoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(UrlPipe) body: UpdateBlogCategoryDto) {
    return this.blogCategoryService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.blogCategoryService.delete(id);
  }
}
