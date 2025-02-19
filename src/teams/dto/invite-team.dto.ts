import { IsIn, IsString } from "class-validator";
import { TeamRoleEnum } from "../entities/users_team.entity";

export class InviteUserTeamDto {
  @IsString()
  teamId: string;
  @IsString()
  inviterId: string;
  @IsString()
  inviteeId: string;
  @IsString()
  @IsIn(Object.values(TeamRoleEnum))
  roleInTeam: string;
}
