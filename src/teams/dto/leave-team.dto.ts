import { IsString } from "class-validator";

export class LeaveTeamDto {
  @IsString()
  teamId: string;
  @IsString()
  userId: string;
}
