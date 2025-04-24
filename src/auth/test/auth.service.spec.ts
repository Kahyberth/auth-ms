jest.mock('md5', () => jest.fn().mockReturnValue('fakehash'));
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RoleEnum } from '../entities/role.entity';
import { Profile } from '../entities/profile.entity';
import { RpcException } from '@nestjs/microservices';

describe('AuthService', () => {
  let service: AuthService;

  const userRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const profileRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const roleRepo = {
    findOne: jest.fn(),
  };
  const userRoleRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mailService = { sendWelcome: jest.fn() };

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserRepository', useValue: userRepo },
        { provide: 'ProfileRepository', useValue: profileRepo },
        { provide: 'RoleRepository', useValue: roleRepo },
        { provide: 'UsersRoleRepository', useValue: userRoleRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: 'Mail', useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);


    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const dto = {
      name: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'secret',
      company: 'Acme',  
      phone: '123',
    };

    it('debería crear un usuario, perfil y rol por defecto', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(async (password, salt) => {
        if (password === 'secret' && salt === 10) {
          return 'hashed';
        }
        throw new Error('Unexpected input');
      });
      userRepo.create.mockReturnValue({
        ...dto,
        id: 'u1',
        password: 'hashed',
        isActive: true,
      });
      userRepo.save.mockResolvedValue({
        ...dto,
        id: 'u1',
        password: 'hashed',
        isActive: true,
      });
      profileRepo.create.mockImplementation((d) => d);
      profileRepo.save.mockResolvedValue({
        profile_picture: 'pic',
        userId: 'u1',
      } as Profile);
      roleRepo.findOne.mockResolvedValue({ id: 'r1', role: RoleEnum.User });
      userRoleRepo.create.mockImplementation((d) => d);
      userRoleRepo.save.mockResolvedValue({});

      const result = await service.createUser(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(profileRepo.create).toHaveBeenCalled();
      expect(profileRepo.save).toHaveBeenCalled();
      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { role: RoleEnum.User },
      });
      expect(userRoleRepo.create).toHaveBeenCalledWith({
        roleId: 'r1',
        userId: 'u1',
        joinedAt: expect.any(Date),
      });
      expect(userRoleRepo.save).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          company: 'Acme',
          email: 'jane@example.com',
          lastName: 'Doe',
          name: 'Jane',
          id: 'u1',
          isActive: true,
          image: 'https://www.gravatar.com/avatar/fakehash?s=200&d=identicon',
        },
      });
    });

    it('lanza conflicto si el email ya existe', async () => {
      const err: any = new Error();
      err.code = 'SQLITE_CONSTRAINT';
      err.message = 'UNIQUE constraint failed: users_table.email';
      userRepo.create.mockReturnValue({});
      userRepo.save.mockRejectedValue(err);

      await expect(service.createUser(dto)).rejects.toThrow(
        'El correo ya está en uso.',
      );
    });

    it('lanza error interno por cualquier otra excepción', async () => {
      userRepo.create.mockReturnValue({});
      userRepo.save.mockRejectedValue(new Error('boom'));

      await expect(service.createUser(dto)).rejects.toBeInstanceOf(
        RpcException,
      );
    });
  });

  describe('profile', () => {
    it('debería retornar el usuario con profile', async () => {
      const fakeUser = { id: 'u1', profile: {} };
      userRepo.findOne.mockResolvedValue(fakeUser);

      const res = await service.profile('u1');
      expect(res).toBe(fakeUser);
    });

    it('lanza 404 si no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.profile('u1'))
      .rejects
      .toBeInstanceOf(RpcException);
    });
    it('lanza 500 en errores no esperados', async () => {
      userRepo.findOne.mockRejectedValue(new Error('fail'));
      await expect(service.profile('u1'))
      .rejects
      .toBeInstanceOf(RpcException);
    });
  });

  describe('login', () => {
    const dto = { email: 'j@example.com', password: 'pass' };

    it('debería fallar si no existe el usuario', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.login(dto as any)).rejects.toBeInstanceOf(RpcException);
    });

    it('debería fallar si contraseña incorrecta', async () => {
      userRepo.findOne.mockResolvedValue({ password: 'hash' });
      jest
    .spyOn(bcrypt, 'compare')
    .mockImplementation(() => Promise.resolve(false));

      await expect(service.login(dto as any)).rejects.toBeInstanceOf(RpcException);
    });

    it('debería devolver tokens si credenciales válidas', async () => {
      const user = {
        id: 'u1',
        email: dto.email,
        password: 'hash',
        company: 'C',
        lastName: 'L',
        name: 'N',
        isActive: true,
      };
      userRepo.findOne.mockResolvedValue(user);
      jest
    .spyOn(bcrypt, 'compare')
    .mockImplementation(() => Promise.resolve(true));

      const res = await service.login(dto as any);
      expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hash');
      expect(jwtService.sign).toHaveBeenCalledWith({ id: 'u1' });
      expect(res).toMatchObject({
        data: { id: 'u1', email: dto.email },
        status: HttpStatus.OK,
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });

  describe('refreshToken', () => {
    const oldToken = 'old';
    const payload = { id: 'u1' };

    it('debería renovar tokens si payload válido', async () => {
      jwtService.verify.mockReturnValue(payload);
      userRepo.findOne.mockResolvedValue({ id: 'u1' });

      const out = await service.refreshToken(oldToken);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(out).toHaveProperty('accessToken');
      expect(out).toHaveProperty('refreshToken');
    });

    it('lanza 401 si usuario no existe', async () => {
      jwtService.verify.mockReturnValue(payload);
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(oldToken)).rejects.toBeInstanceOf(RpcException);
    });

    it('lanza 401 si token expirado o inválido', async () => {
      const err: any = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      jwtService.verify.mockImplementation(() => {
        throw err;
      });

      await expect(service.refreshToken(oldToken)).rejects.toBeInstanceOf(RpcException);
    });
  });

  describe('verifyToken', () => {
    const token = 't';
    const payload = { id: 'u1' };

    it('debería validar y devolver usuario', async () => {
      jwtService.verify.mockReturnValue(payload);
      userRepo.findOne.mockResolvedValue({ id: 'u1', password: 'x' });

      const out = await service.verifyToken(token);
      expect(out).toEqual({ valid: true, user: { id: 'u1' } });
    });

    it('lanza 401 si payload inválido o expirado', async () => {
      const err: any = new Error('bad');
      err.name = 'JsonWebTokenError';
      jwtService.verify.mockImplementation(() => {
        throw err;
      });

      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(RpcException);
    });

    it('lanza 500 en otros errores', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('oops');
      });

      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(RpcException);
    });
  });
});
