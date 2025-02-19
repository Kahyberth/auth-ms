import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/auth/entities/users.entity';
import { CreateTeamDto, InviteUserTeamDto, LeaveTeamDto, TransferLeadershipDto, UpdateTeamDto, ExpelMemberDto } from './dto';
import { TeamRoleEnum, UsersTeam, Team } from './entities';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UsersTeam)
    private readonly usersTeamRepository: Repository<UsersTeam>,
  ) {}

  /**
   * Create a new team
   * @param payload
   * @returns
   */
  async createTeam(payload: CreateTeamDto) {
    const leader = await this.userRepository.findOne({
      where: { id: payload.leaderId },
    });
    if (!leader) {
      throw new RpcException('El líder del equipo no existe');
    }

    const team = this.teamRepository.create({
      name: payload.name,
      description: payload.description,
      leaderId: payload.leaderId,
      createdAt: new Date(),
      image: payload.image || null,
      updatedAt: new Date(),
    });

    
    try {
      const savedTeam = await this.teamRepository.save(team);

      const leaderMembership = this.usersTeamRepository.create({
        teamId: savedTeam.id,
        userId: leader.id,
        roleInTeam: TeamRoleEnum.LEADER,
      });
      await this.usersTeamRepository.save(leaderMembership);

      return savedTeam;
    } catch (error) {
      this.logger.error('Error al crear el equipo', error.stack);
      throw error;
    }
  }

  /**
   * Invite a user to a team
   * @param payload
   * @returns UsersTeam
   */
  async inviteUserToTeam(payload: InviteUserTeamDto): Promise<UsersTeam> {
    const { teamId, inviterId, inviteeId, roleInTeam } = payload;
    console.log(payload);
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['leader'],
    });

    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }

    if (team.leaderId !== inviterId) {
      throw new RpcException(
        'Solo el líder del equipo puede invitar a nuevos miembros',
      );
    }

    const existingMembership = await this.usersTeamRepository.findOne({
      where: { teamId, userId: inviteeId },
    });
    if (existingMembership) {
      throw new RpcException(
        'El usuario ya es miembro o ya fue invitado al equipo',
      );
    }

    const invitation = this.usersTeamRepository.create({
      teamId,
      userId: inviteeId,
      roleInTeam: roleInTeam as TeamRoleEnum,
    });

    try {
      const savedInvitation = await this.usersTeamRepository.save(invitation);
      return savedInvitation;
    } catch (error) {
      this.logger.error('Error al invitar al usuario al equipo', error.stack);
      throw error;
    }
  }

  /**
   * Leave a team
   * @param payload
   * @returns message
   */
  async leaveTeam(payload: LeaveTeamDto): Promise<{ message: string }> {
    const { teamId, userId } = payload;

    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }

    const membership = await this.usersTeamRepository.findOne({
      where: { teamId, userId },
    });
    if (!membership) {
      throw new RpcException('El usuario no es miembro del equipo');
    }

    if (team.leaderId === userId) {
      throw new RpcException(
        'El líder del equipo no puede abandonarlo sin transferir la propiedad',
      );
    }

    await this.usersTeamRepository.delete({ teamId, userId });

    return { message: 'Has abandonado el equipo exitosamente' };
  }

  /**
   * Update a team
   * @param payload
   * @returns Team
   */
  async updateTeam(payload: UpdateTeamDto): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id: payload.teamId } });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }

    if (payload.name) team.name = payload.name;
    if (payload.description) team.description = payload.description;
    if (payload.image !== undefined) team.image = payload.image;
    team.updatedAt = new Date();

    try {
      const updatedTeam = await this.teamRepository.save(team);
      return updatedTeam;
    } catch (error) {
      this.logger.error('Error al actualizar el equipo', error.stack);
      throw error;
    }

  }

  /**
   * Transfer leadership of a team
   * @param payload
   * @returns Team
  */
  async transferLeadership(payload: TransferLeadershipDto): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id: payload.teamId } });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }

    
    if (team.leaderId !== payload.currentLeaderId) {
      throw new RpcException('No eres el líder actual del equipo');
    }

  
    const newLeaderMembership = await this.usersTeamRepository.findOne({
      where: { teamId: payload.teamId, userId: payload.newLeaderId },
    });
    if (!newLeaderMembership) {
      throw new RpcException('El nuevo líder no es miembro del equipo');
    }

    team.leaderId = payload.newLeaderId;
    team.updatedAt = new Date();

   await this.usersTeamRepository.update(
      { teamId: payload.teamId, userId: payload.currentLeaderId },
      { roleInTeam: TeamRoleEnum.Developer },
    );
   await this.usersTeamRepository.update(
      { teamId: payload.teamId, userId: payload.newLeaderId },
      { roleInTeam: TeamRoleEnum.LEADER },
    );

  
    try {
      const updatedTeam = await this.teamRepository.save(team);
      return updatedTeam;
    } catch (error) {
      this.logger.error('Error al transferir liderazgo', error.stack);
      throw error;
    }
  }

  /**
   * Disband a team
   * @param teamId
   * @param requesterId
   * @returns message
   */
  async disbandTeam(payload: { teamId: string, requesterId: string }): Promise<{ message: string }> {
    
    const { teamId, requesterId } = payload;

    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }
    console.log(team.leaderId, requesterId);
    // Solo el líder puede disolver el equipo
    if (team.leaderId !== requesterId) {
      throw new RpcException('Solo el líder puede disolver el equipo');
    }

    try {
      await this.teamRepository.delete({ id: teamId });
      return { message: 'Equipo disuelto exitosamente' };
    } catch (error) {
      this.logger.error('Error al disolver el equipo', error.stack);
      throw error;
    }
  } 


  /**
   * Get all teams a user belongs to
   * @param userId
   * @returns Team[]
   */
  async getTeamsForUser(userId: string): Promise<Team[]> {
    const memberships = await this.usersTeamRepository.find({
      where: { userId },
      relations: ['team'],
    });
    return memberships.map((membership) => membership.team);
  }

  /**
   * Get all members of a team
   * @param teamId
   * @returns User[]
   */
  async getTeamMembers(teamId: string): Promise<{ member: User; role: string }[]> {
    const memberships = await this.usersTeamRepository.find({
      where: { teamId },
      relations: ['user'],
    });
    return memberships.map((membership) => ({
      member: membership.user,
      role: membership.roleInTeam,
    }));
  }

  /**
   * Expel a member from a team
   * @param payload
   * @returns message
   * @throws RpcException
  */
  async expelMember(payload: ExpelMemberDto): Promise<{ message: string }> {
    const { teamId, leaderId, memberId } = payload;


    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }


    if (team.leaderId !== leaderId) {
      throw new RpcException('Solo el líder puede expulsar a miembros');
    }


    if (memberId === leaderId) {
      throw new RpcException('El líder no puede expulsarse a sí mismo');
    }

    const membership = await this.usersTeamRepository.findOne({
      where: { teamId, userId: memberId },
    });
    if (!membership) {
      throw new RpcException('El usuario no es miembro del equipo');
    }

    try {
      await this.usersTeamRepository.delete({ teamId, userId: memberId });
      return { message: 'El miembro ha sido expulsado del equipo' };
    } catch (error) {
      this.logger.error('Error al expulsar al miembro', error.stack);
      throw error;
    }
  }

  /**
   * Get all teams
   * @returns Team[]
   * @throws RpcException
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      const teams = await this.teamRepository.find();
      return teams;
    } catch (error) {
      this.logger.error('Error al obtener los equipos', error.stack);
      throw new RpcException('Error al obtener los equipos');
    }
  }

  /**
   * Get a team by ID
   * @param teamId
   * @returns Team
   * @throws RpcException
   */
  async getTeamById(teamId: string): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }
    return team;
  }


}
