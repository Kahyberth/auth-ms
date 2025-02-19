import { IsString } from "class-validator";

export class TransferLeadershipDto {
    @IsString()  
    teamId: string;
    @IsString()
    currentLeaderId: string;
    @IsString()
    newLeaderId: string;
  }
  