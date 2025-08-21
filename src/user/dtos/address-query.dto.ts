import { IsOptional, IsString } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';

export class AddressQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsString()
  user?: string;
}
