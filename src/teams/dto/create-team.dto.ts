import { IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  leader_id: string;
}
