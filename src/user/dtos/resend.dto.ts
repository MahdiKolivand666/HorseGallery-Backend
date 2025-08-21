import { IsNotEmpty, IsString } from 'class-validator';

export class ResendDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;
}
