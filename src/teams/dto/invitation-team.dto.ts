import { IsEmail, IsIn, IsNotEmpty, IsString } from "class-validator";
import { TeamRoleEnum } from '../entities/users_team.entity';

export class InvitationTeamDto {

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  inviteeEmail: string;

  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsIn(Object.values(TeamRoleEnum))
  roleInTeam: string;
}