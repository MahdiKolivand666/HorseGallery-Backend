import {
  IsNumber,
  IsNotEmpty,
  IsDate,
  IsBoolean,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGoldPriceDto {
  @IsNumber()
  @IsNotEmpty()
  @IsIn([18, 21, 24])
  karat: number;

  @IsNumber()
  @IsNotEmpty()
  pricePerGram: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateGoldPriceDto {
  @IsNumber()
  @IsOptional()
  @IsIn([18, 21, 24])
  karat?: number;

  @IsNumber()
  @IsOptional()
  pricePerGram?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  source?: string;
}
