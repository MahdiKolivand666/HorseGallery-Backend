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
import { AnnouncementService } from '../services/announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '../dtos/announcement.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';

@ApiTags('Announcement')
@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.announcementService.findAll(isActiveBool);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.announcementService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementService.create(createAnnouncementDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.announcementService.delete(id);
  }
}
