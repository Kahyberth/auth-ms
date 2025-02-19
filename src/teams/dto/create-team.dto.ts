import { IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  leaderId: string;

  @IsString()
  @IsOptional()
  image?: string;
}
