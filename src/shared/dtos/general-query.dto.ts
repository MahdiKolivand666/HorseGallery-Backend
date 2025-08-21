import { IsEnum, IsOptional, IsPositive, IsString } from 'class-validator';

export enum Sort {
  Title = 'title',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  LastName = 'lastName',
  Cheap = 'cheap',
  Expensive = 'expensive',
}
export class GeneralQueryDto {
  @IsOptional()
  @IsPositive()
  page?: number;

  @IsOptional()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(Sort)
  sort?: Sort;
}
