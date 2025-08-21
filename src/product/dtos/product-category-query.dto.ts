import { IsOptional, IsString } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';

export class ProductCategoryQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsString()
  url?: string;
}
