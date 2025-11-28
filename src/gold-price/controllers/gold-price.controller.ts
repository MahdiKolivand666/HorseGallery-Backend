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
import { GoldPriceService } from '../services/gold-price.service';
import { CreateGoldPriceDto, UpdateGoldPriceDto } from '../dtos/gold-price.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';

@ApiTags('Gold Price')
@Controller('gold-price')
export class GoldPriceController {
  constructor(private readonly goldPriceService: GoldPriceService) {}

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.goldPriceService.findAll(isActiveBool);
  }

  @Get('latest')
  findLatest(@Query('karat') karat?: string) {
    const karatNumber = karat ? parseInt(karat, 10) : undefined;
    return this.goldPriceService.findLatest(karatNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goldPriceService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  create(@Body() createGoldPriceDto: CreateGoldPriceDto) {
    return this.goldPriceService.create(createGoldPriceDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateGoldPriceDto: UpdateGoldPriceDto,
  ) {
    return this.goldPriceService.update(id, updateGoldPriceDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.goldPriceService.delete(id);
  }
}

