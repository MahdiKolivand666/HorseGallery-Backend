import { IsOptional, IsString } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';

export class BlogCategoryQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsString()
  url?: string;
}
