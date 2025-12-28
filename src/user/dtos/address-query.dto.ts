import { IsOptional, IsMongoId } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';

export class AddressQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsMongoId({ message: 'userId باید یک ObjectId معتبر باشد' })
  userId?: string;
}
