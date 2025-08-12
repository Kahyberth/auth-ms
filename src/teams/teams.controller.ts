import { Controller } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { InviteUserTeamDto } from './dto/invite-team.dto';
import { TransferLeadershipDto } from './dto/transfer-leader.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { LeaveTeamDto } from './dto/leave-team.dto';
import { ExpelMemberDto } from './dto/expel-member.dto';
import { UpdateTeamDto } from './dto';

@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

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
  getTeamsByUser(@Payload() data: any) {
    if (!data.page) data.page = 1;
    if (!data.userId) throw new RpcException('User ID is required');
    const { page, userId } = data;
    return this.teamsService.getTeamsForUserPaginated(userId, page);
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
  getAllTeams(@Payload() page: number) {
    return this.teamsService.getAllTeamsPaginated(page);
  }

  @MessagePattern('teams.invite.user.by.email')
  inviteUserByEmail(payload: any) {
    return this.teamsService.generateInvitationLink(payload);
  }

  @MessagePattern('teams.accept.invitation')
  acceptInvitation(payload: any) {
    return this.teamsService.acceptInvitation(payload);
  }

  @MessagePattern('teams.paginate.members.by.team')
  getPaginatedMembersByTeam(payload: any) {
    if (!payload.page) payload.page = 1;
    if (!payload.teamId) throw new RpcException('Team ID is required');
    const { page, teamId } = payload;
    return this.teamsService.getAllMembersByTeamPaginated(teamId, page);
  }

  @MessagePattern('teams.verify.invitation')
  verifyInvitation(payload: any) {
    return this.teamsService.verifyInvitationToken(payload);
  }


  @MessagePattern('server.create.channel.success')
  onChannelCreated(@Payload() data: { teamId: string, leaderId: string }) {
    return this.teamsService.onChannelCreated(data);
  }

  @MessagePattern('server.create.channel.error')
  onChannelCreateFailed(@Payload() data: { teamId: string }) {
    return this.teamsService.onChannelCreateFailed(data.teamId);
  }
}
