import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;
  @IsString()
  @IsNotEmpty()
  code: string;
}
