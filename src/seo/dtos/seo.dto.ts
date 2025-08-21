import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
export class SeoDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsString()
  @IsNotEmpty()
  seoTitle: string;

  @IsString()
  @IsNotEmpty()
  seoDescription: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  h1?: string;
}
