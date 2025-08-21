import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;
  @IsString()
  @IsNotEmpty()
  password: string;
}
