import { IsOptional, IsString } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';

export class BlogQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  exclude?: string;
}
