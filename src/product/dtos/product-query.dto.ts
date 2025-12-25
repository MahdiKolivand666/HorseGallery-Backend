import { IsOptional, IsString } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';

export class ProductQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  @IsString()
  productType?: string; // jewelry, coin (melted_gold جدا شده است)

  @IsOptional()
  @IsString()
  exclude?: string[];
}
