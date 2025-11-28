import { IsNotEmpty, IsString } from 'class-validator';

export class BlogCategoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  slug: string; // قبلاً url بود
}
