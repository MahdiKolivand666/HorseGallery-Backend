import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FAQService } from '../services/faq.service';
import { CreateFAQDto, UpdateFAQDto } from '../dtos/faq.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';

@ApiTags('FAQ')
@Controller('faq')
export class FAQController {
  constructor(private readonly faqService: FAQService) {}

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.faqService.findAll(isActiveBool);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  create(@Body() createFAQDto: CreateFAQDto) {
    return this.faqService.create(createFAQDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateFAQDto: UpdateFAQDto) {
    return this.faqService.update(id, updateFAQDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.faqService.delete(id);
  }

  @Post(':id/view')
  incrementViews(@Param('id') id: string) {
    return this.faqService.incrementViews(id);
  }

  @Post(':id/helpful')
  incrementHelpful(@Param('id') id: string) {
    return this.faqService.incrementHelpful(id);
  }
}

