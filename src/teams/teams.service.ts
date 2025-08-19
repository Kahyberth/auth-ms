import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../auth/entities/users.entity';
import {
  CreateTeamDto,
  InviteUserTeamDto,
  LeaveTeamDto,
  TransferLeadershipDto,
  UpdateTeamDto,
  ExpelMemberDto,
  InvitationTeamDto,
} from './dto';
import { TeamRoleEnum, UsersTeam, Team } from './entities';
import { JwtService } from '@nestjs/jwt';
import { Mail } from '../mail/mail';
import { envs } from '../auth/common/envs';

import { TeamStatus } from './entities/team.entity';
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
    private readonly jwtService: JwtService,
    private readonly mailService: Mail,
    @Inject('NATS_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Create a new team
   * @param payload
   * @returns
   */
  async createTeam(payload: CreateTeamDto) {
    try {
      const team = this.teamRepository.create({
        name: payload.name,
        description: payload.description,
        leaderId: payload.leaderId,
        image: payload.image || null,
        status: TeamStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedTeam = await this.teamRepository.save(team);

      this.logger.log(`Team created with ID: ${savedTeam.id}, status: ${savedTeam.status}`);

      this.client.emit('server.create.server', {
        teamId: savedTeam.id,
        serverName: savedTeam.name,
        description: savedTeam.description,
        created_by: savedTeam.leaderId,
      });

      this.logger.log(`Emitted server.create.server event for team: ${savedTeam.id}`);

      return savedTeam;
    } catch (error) {
      this.logger.error('Error creating team:', error.stack);
      throw new RpcException('Error creating team');
    }
  }


  /**
   * Update team status to active when server is created
   * @description This is a callback function that is called when the server is created
   * @param payload 
   * @returns 
   */
  async onChannelCreated(payload: any) {
    try {
      this.logger.log(`Received server.create.channel.success event for team: ${payload.teamId}`);
      
      await this.teamRepository.update(payload.teamId, { 
        status: TeamStatus.ACTIVE,
        updatedAt: new Date()
      });
      
      this.logger.log(`Team ${payload.teamId} status updated to ACTIVE`);

      const leader = this.usersTeamRepository.create({
        teamId: payload.teamId,
        userId: payload.leaderId,
        roleInTeam: TeamRoleEnum.LEADER,
      });
      
      await this.usersTeamRepository.save(leader);
      this.logger.log(`Leader membership created for team: ${payload.teamId}, user: ${payload.leaderId}`);
      
      return { success: true, message: 'Team activated successfully' };
    } catch (error) {
      this.logger.error(`Error in onChannelCreated for team ${payload.teamId}:`, error.stack);
      throw new RpcException('Error activating team');
    }
  }

  /**
   * Delete team if server creation fails
   * @description This is a callback function that is called when the server creation fails
   * @param payload 
   */
  async onChannelCreateFailed(payload: any) {
    try {
      this.logger.log(`Received server.create.channel.error event for team: ${payload.teamId}`);
      
      await this.teamRepository.delete(payload.teamId);
      this.logger.log(`Team ${payload.teamId} deleted due to server creation failure`);
      
      return { success: true, message: 'Team deleted due to server creation failure' };
    } catch (error) {
      this.logger.error(`Error in onChannelCreateFailed for team ${payload.teamId}:`, error.stack);
      throw new RpcException('Error deleting team');
    }
  }



  /**
   * Invite a user to a team
   * @param payload
   * @returns UsersTeam
   */
  async inviteUserToTeam(payload: InviteUserTeamDto): Promise<UsersTeam> {
    const { teamId, inviterId, inviteeId, roleInTeam } = payload;
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
    const team = await this.teamRepository.findOne({
      where: { id: payload.teamId },
    });
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
    const team = await this.teamRepository.findOne({
      where: { id: payload.teamId },
    });
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
  async disbandTeam(payload: {
    teamId: string;
    requesterId: string;
  }): Promise<{ message: string }> {
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
    * Get teams for a user with pagination
    * @param userId 
    * @param page 
    * @returns { data: Team[], meta: { total, totalPages, page, perPage } }
    */
   async getTeamsForUserPaginated(userId: string, page: number): Promise<any> {
    console.log('Getting teams for user', userId, 'page', page);
    
    const itemsPerPage = 6;
    
    const [teams, total] = await this.usersTeamRepository.findAndCount({
      where: { userId: userId },
      relations: ['team'],
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    });
    
    const teamsData = teams.map((membership) => membership.team);
    const totalPages = Math.ceil(total / itemsPerPage);
    
    console.log('Found', teamsData.length, 'teams, total', total, 'pages', totalPages);
    
    return {
      data: teamsData,
      meta: {
        total,
        totalPages,
        page,
        perPage: itemsPerPage
      }
    };
  }

  /**
   * Get all members of a team
   * @param teamId
   * @returns User[]
   */
  async getTeamMembers(
    teamId: string,
  ): Promise<{ member: User; role: string }[]> {
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
   * Get all teams with pagination
   * @param page
   * @returns Team[]
   * @throws RpcException
   */
  async getAllTeamsPaginated(page: number): Promise<Team[]> {
    try {
      const itemsPerPage = 6;
      const [teams] = await this.teamRepository.findAndCount({
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      });
      return teams;
    } catch (error) {
      this.logger.error('Error al obtener los equipos', error.stack);
      throw new RpcException('Error al obtener los equipos');
    }
  }

  /**
   * Get all members of a team with pagination
   * @param teamId
   * @param page
   * @returns UsersTeam[]
   * @throws RpcException
   */
  async getAllMembersByTeamPaginated(
    teamId: string,
    page: number,
  ): Promise<{ member: User; role: string }[]> {
    try {
      const itemsPerPage = 6;
      const [members] = await this.usersTeamRepository.findAndCount({
        where: { teamId },
        relations: ['user'],
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      });
      
      return members.map((membership) => ({
        member: membership.user,
        role: membership.roleInTeam
      }));
    } catch (error) {
      this.logger.error('Error al obtener los miembros', error.stack);
      throw new RpcException('Error al obtener los miembros');
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

  /**
   * Generate an invitation link for a user to join a team
   * @param payload
   * @returns string
   * @throws RpcException
   */
  async generateInvitationLink(payload: InvitationTeamDto): Promise<string> {
    const token = this.jwtService.sign(payload, {
      expiresIn: '1d',
    });

    const invitationLink = `${envs.FRONTEND_URL}/invitation?token=${token}`;

    const team = await this.getTeamById(payload.teamId);

    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }

    const user = await this.userRepository.findOne({
      where: {
        email: payload.inviteeEmail,
      },
    });

    const data = {
      inviteeEmail: payload.inviteeEmail,
      teamName: team.name,
      userName: user.name,
      enlace: invitationLink,
    };

    try {
      await this.mailService.sendInvitationLink(data);
      return invitationLink;
    } catch (error) {
      this.logger.error(
        'Error al enviar la invitación por correo',
        error.stack,
      );
      throw new RpcException('Error al enviar la invitación por correo');
    }
  }

  /**
   * Accept an invitation to join a team
   * @param payload
   * @returns UsersTeam
   * @throws RpcException
   */
  async acceptInvitation(payload: any): Promise<UsersTeam> {
    const { token, inviteeEmail, roleInTeam } = payload;

    const decoded = this.jwtService.decode(token) as InvitationTeamDto;

    if (!decoded) {
      throw new RpcException('Token de invitación inválido');
    }

    const team = await this.teamRepository.findOne({
      where: { id: decoded.teamId },
    });
    if (!team) {
      throw new RpcException('Equipo no encontrado');
    }

    const user = await this.userRepository.findOne({
      where: { email: inviteeEmail },
    });
    if (!user) {
      throw new RpcException('Usuario no encontrado');
    }

    const existingMembership = await this.usersTeamRepository.findOne({
      where: { teamId: decoded.teamId, userId: user.id },
    });
    if (existingMembership) {
      throw new RpcException('El usuario ya es miembro del equipo');
    }

    const invitation = this.usersTeamRepository.create({
      teamId: decoded.teamId,
      userId: user.id,
      roleInTeam: roleInTeam as TeamRoleEnum,
    });

    try {
      const savedInvitation = await this.usersTeamRepository.save(invitation);
      return savedInvitation;
    } catch (error) {
      this.logger.error('Error al aceptar la invitación', error.stack);
      throw error;
    }
  }

  /**
   *  Verify invitation token
   * @param token
   * @returns boolean
   * @throws RpcException
   */
  async verifyInvitationToken(token: string): Promise<boolean> {
    try {
      this.jwtService.verify(token);
      return true;
    } catch (error) {
      this.logger.error(
        'Error al verificar el token de invitación',
        error.stack,
      );
      throw new RpcException('Token de invitación inválido');
    }
  }
}
