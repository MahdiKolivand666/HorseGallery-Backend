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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductDto } from '../dtos/product.dto';
import { ProductService } from '../services/product.service';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { UrlPipe } from 'src/shared/pipes/url.pipe';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import { StockDto } from '../dtos/stock.dto';
import { EditedBy } from '../schemas/inventory-record.schema';
import { InventoryRecordService } from '../services/inventory-record.service';
import { InventoryRecordQueryDto } from '../dtos/inventory-record-query.dto';

@ApiTags('Product')
@Controller('product')
@UseGuards(JwtGuard, new RoleGuard([Role.Admin, Role.CopyWriter]), CsrfGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly inventoryRecordService: InventoryRecordService,
  ) {}
  @Get()
  findAll(@Query() queryParams: ProductQueryDto) {
    return this.productService.findAll(queryParams);
  }

  @Get('inventory-record')
  findAllInventoryRecords(@Query() queryParams: InventoryRecordQueryDto) {
    return this.inventoryRecordService.findAll(queryParams);
  }

  @Post()
  create(@Body(UrlPipe, new BodyIdPipe(['category'])) body: ProductDto) {
    return this.productService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch('add-stock')
  addStock(@Body(new BodyIdPipe(['id'])) body: StockDto) {
    return this.productService.addStock(body.id, body.quantity, EditedBy.Admin);
  }
  @Patch('remove-stock')
  removeStock(@Body(new BodyIdPipe(['id'])) body: StockDto) {
    return this.productService.removeStock(
      body.id,
      body.quantity,
      EditedBy.Admin,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(UrlPipe, new BodyIdPipe(['category'])) body: UpdateProductDto,
  ) {
    return this.productService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
