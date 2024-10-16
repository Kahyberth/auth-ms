import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  name: string;
  @IsString()
  password: string;
  @IsString()
  @IsEmail()
  email: string;
  @IsString()
  @IsOptional()
  @IsArray({ each: true })
  @IsIn(['Admin', 'User'])
  rol: string[];
}
