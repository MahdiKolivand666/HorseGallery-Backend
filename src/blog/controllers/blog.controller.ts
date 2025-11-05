import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  // Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BlogDto } from '../dtos/blog.dto';
import { BlogService } from '../services/blog.service';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';
import { UpdateBlogDto } from '../dtos/update-blog.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { User } from 'src/shared/decorators/user.decorator';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { UrlPipe } from 'src/shared/pipes/url.pipe';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';

@ApiTags('blog')
// @ApiHeader({
//   name: 'apikey',
//   description: 'Api key',
//   required: true,
// })
@Controller('blog')
@UseGuards(JwtGuard, new RoleGuard([Role.Admin, Role.CopyWriter]), CsrfGuard)
@ApiBearerAuth()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}
  @Get()
  findAll(@Query() queryParams: GeneralQueryDto) {
    return this.blogService.findAll(queryParams);
  }

  @Post()
  create(
    @Body(UrlPipe, new BodyIdPipe(['category'])) body: BlogDto,
    @User() user: string,
  ) {
    return this.blogService.create(body, user);
  }

  // @Get('categories')
  //   return 'find all categories';
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(UrlPipe, new BodyIdPipe(['category'])) body: UpdateBlogDto,
  ) {
    return this.blogService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}
