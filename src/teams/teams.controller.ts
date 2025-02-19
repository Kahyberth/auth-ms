import { Controller } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { MessagePattern } from '@nestjs/microservices';
import { InviteUserTeamDto } from './dto/invite-team.dto';
import { TransferLeadershipDto } from './dto/transfer-leader.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { LeaveTeamDto } from './dto/leave-team.dto';
import { ExpelMemberDto } from './dto/expel-member.dto';
import { UpdateTeamDto } from './dto';


@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @MessagePattern('teams.create.team')
  createTeam(payload: CreateTeamDto) {
    return this.teamsService.createTeam(payload);
  }

  @MessagePattern('teams.update.team')
  updateTeam(payload: UpdateTeamDto) {
    return this.teamsService.updateTeam(payload);
  }

  @MessagePattern('teams.delete.team')
  deleteTeam(payload: any) {
    return this.teamsService.disbandTeam(payload);
  }

  @MessagePattern('teams.invite.user')
  inviteUser(payload: InviteUserTeamDto) {
    return this.teamsService.inviteUserToTeam(payload);
  }

  @MessagePattern('teams.leave.team')
  leaveTeam(payload: LeaveTeamDto) {
    return this.teamsService.leaveTeam(payload);
  }

  @MessagePattern('teams.transfer.leadership')
  transferLeadership(payload: TransferLeadershipDto) {
    return this.teamsService.transferLeadership(payload);
  }

  @MessagePattern('teams.by.user')
  getTeamsByUser(userId: string) {
    return this.teamsService.getTeamsForUser(userId);
  }

  @MessagePattern('teams.members.by.team')
  getTeamMembers(teamId: string) {
    return this.teamsService.getTeamMembers(teamId);
  }

  @MessagePattern('teams.by.id')
  getTeamById(teamId: string) {
    return this.teamsService.getTeamById(teamId);
  }

  @MessagePattern('teams.expel.member')
  expelMember(payload: ExpelMemberDto) {
    return this.teamsService.expelMember(payload);
  }

  @MessagePattern('teams.get.all.teams')
  getAllTeams() {
    return this.teamsService.getAllTeams();
  }

}
