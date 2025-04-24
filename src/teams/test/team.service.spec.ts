import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from '../teams.service';
import { Repository, EntityManager } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { Mail } from '../../mail/mail';
import { Team, UsersTeam, TeamRoleEnum } from '../entities';
import { of } from 'rxjs';

import { Repository as TypeOrmRepository } from 'typeorm';

describe('TeamsService', () => {
  let service: TeamsService;

  const teamRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    manager: {
      connection: {
        createQueryRunner: jest.fn(),
      },
    },
  } as unknown as jest.Mocked<TypeOrmRepository<Team>>;

  const userRepo = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmRepository<any>>;

  const usersTeamRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmRepository<UsersTeam>>;

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const mailService = {
    sendInvitationLink: jest.fn(),
  } as unknown as jest.Mocked<Mail>;

  const entityManager = {} as EntityManager;
  const client = { send: jest.fn() } as unknown as jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: 'TeamRepository', useValue: teamRepo },
        { provide: 'UserRepository', useValue: userRepo },
        { provide: 'UsersTeamRepository', useValue: usersTeamRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: Mail, useValue: mailService },
        { provide: EntityManager, useValue: entityManager },
        { provide: 'NATS_SERVICE', useValue: client },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.clearAllMocks();

    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
    };
    (teamRepo.manager.connection.createQueryRunner as jest.Mock)
  .mockReturnValue(queryRunner as any);
  });

  describe('createTeam', () => {
    it('throws if leader does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createTeam({ leaderId: 'u1', name: 'Team', description: 'Desc' } as any)
      ).rejects.toBeInstanceOf(RpcException);
    });

    it('creates team, membership and channel', async () => {
      const leader = { id: 'u1' };
      userRepo.findOne.mockResolvedValue(leader as any);

      const createdTeam = { id: 't1', name: 'Team', leaderId: 'u1' } as Team;
      teamRepo.create.mockReturnValue(createdTeam);
      teamRepo.save.mockResolvedValue(createdTeam);

      const membership = { teamId: 't1', userId: 'u1', roleInTeam: TeamRoleEnum.LEADER } as UsersTeam;
      usersTeamRepo.create.mockReturnValue(membership);
      usersTeamRepo.save.mockResolvedValue(membership);

      client.send.mockReturnValue(of({}));

      const result = await service.createTeam({ leaderId: 'u1', name: 'Team', description: 'Desc' } as any);
      expect(result).toEqual(createdTeam);
      expect(usersTeamRepo.save).toHaveBeenCalledWith(membership);
      expect(client.send).toHaveBeenCalledWith(
        'channel.create.channel',
        expect.objectContaining({ team_id: 't1' })
      );
    });
  });

  describe('inviteUserToTeam', () => {
    const payload = { teamId: 't1', inviterId: 'u1', inviteeId: 'u2', roleInTeam: TeamRoleEnum.Developer } as any;

    it('throws if team not found', async () => {
      teamRepo.findOne.mockResolvedValue(null);
      await expect(service.inviteUserToTeam(payload)).rejects.toBeInstanceOf(RpcException);
    });

    it('throws if inviter is not leader', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 't1', leaderId: 'uX' } as any);
      await expect(service.inviteUserToTeam(payload)).rejects.toBeInstanceOf(RpcException);
    });

    it('throws if user already a member', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 't1', leaderId: 'u1' } as any);
      usersTeamRepo.findOne.mockResolvedValue({} as any);
      await expect(service.inviteUserToTeam(payload)).rejects.toBeInstanceOf(RpcException);
    });

    it('saves invitation when valid', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 't1', leaderId: 'u1' } as any);
      usersTeamRepo.findOne.mockResolvedValue(null);

      const invitation = { teamId: 't1', userId: 'u2', roleInTeam: payload.roleInTeam } as UsersTeam;
      usersTeamRepo.create.mockReturnValue(invitation);
      usersTeamRepo.save.mockResolvedValue(invitation);

      const result = await service.inviteUserToTeam(payload);
      expect(result).toEqual(invitation);
      expect(usersTeamRepo.save).toHaveBeenCalledWith(invitation);
    });
  });


}
)
