import { IsEmail, IsString } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  name: string;
  @IsString()
  lastName: string;
  @IsString()
  password: string;
  @IsString()
  @IsEmail()
  email: string;
  @IsString()
  company: string;
}
