import { PartialType } from '@nestjs/mapped-types';
import { ProductCategoryDto } from './product-category.dto';

export class UpdateProductCategoryDto extends PartialType(ProductCategoryDto) {}
