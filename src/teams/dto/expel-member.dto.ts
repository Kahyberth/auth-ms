import { IsString } from "class-validator";

export class ExpelMemberDto {
    @IsString()
    teamId: string;
    @IsString()
    leaderId: string; 
    @IsString()
    memberId: string; 
  }
  