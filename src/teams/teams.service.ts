import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/users.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { RpcException } from '@nestjs/microservices';
import { InviteUserTeamDto } from './dto/invite-team.dto';
import { TeamRoleEnum, UsersTeam } from './entities/users_team.entity';
import { LeaveTeamDto } from './dto/leave-team.dto';

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
      updatedAt: new Date(),
    });

    try {
      const savedTeam = await this.teamRepository.save(team);
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
}
