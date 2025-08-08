import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { Profile } from '../entities/profile.entity';
import { Role, RoleEnum } from '../entities/role.entity';
import { UsersRole } from '../entities/users_roles.entity';
import { Repository } from 'typeorm';
import { Mail } from '../../mail/mail';
import * as bcrypt from 'bcrypt';

describe('AuthService (unit)', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let profileRepo: Repository<Profile>;
  let roleRepo: Repository<Role>;
  let userRoleRepo: Repository<UsersRole>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id',
    email: 'test@test.com',
    password: 'hashed',
    name: 'Test',
    lastName: 'User',
    phone: '',
    company: 'TestCorp',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isAvailable: true,
    language: 'es',
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mockToken'),
    verify: jest.fn().mockReturnValue({ id: 'user-id' }),
  };

  const mockMailService = {
    sendGreetingsToUser: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: Mail, useValue: mockMailService },
        { provide: getRepositoryToken(User), useClass: Repository },
        { provide: getRepositoryToken(Profile), useClass: Repository },
        { provide: getRepositoryToken(Role), useClass: Repository },
        { provide: getRepositoryToken(UsersRole), useClass: Repository },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    profileRepo = module.get(getRepositoryToken(Profile));
    roleRepo = module.get(getRepositoryToken(Role));
    userRoleRepo = module.get(getRepositoryToken(UsersRole));
    jwtService = module.get(JwtService);
  });

  describe('createUser', () => {
    it('should create a user and return basic info', async () => {
      (bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>) = jest.fn().mockResolvedValue('hashed' as never);
      
      jest.spyOn(userRepo, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepo, 'save').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(profileRepo, 'create').mockReturnValue({ ...mockUser, userId: mockUser.id } as any);
      jest.spyOn(profileRepo, 'save').mockResolvedValueOnce({} as any);
      jest.spyOn(roleRepo, 'findOne').mockResolvedValueOnce({ id: 'role-id', role: RoleEnum.User } as any);
      jest.spyOn(userRoleRepo, 'create').mockReturnValue({} as any);
      jest.spyOn(userRoleRepo, 'save').mockResolvedValueOnce({} as any);

      const dto = {
        name: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        password: '123456',
        company: 'TestCorp',
      };

      const result = await service.createUser(dto as any);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(dto.email);
      expect(mockMailService.sendGreetingsToUser).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login and return tokens', async () => {
      const dto = { email: mockUser.email, password: '123456' };
      const hashed = await bcrypt.hash(dto.password, 10);

      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce({ ...mockUser, password: hashed } as any);
      
      (bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>) = jest.fn().mockResolvedValue(true as never);

      const result = await service.login(dto);

      expect(result.data).toBeDefined();
      expect(result.accessToken).toBe('mockToken');
      expect(result.refreshToken).toBe('mockToken');
    });
  });

  describe('updateProfile', () => {
    it('should update profile and user fields', async () => {
      const updateDto = {
        userId: 'user-id',
        bio: 'New bio',
        company: 'UpdatedCorp',
        phone: '123456789',
      };

      const profile = { bio: '', updatedAt: new Date() };
      const user = { ...mockUser, profile };

      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user as any);
      jest.spyOn(userRepo, 'save').mockResolvedValueOnce(user as any);
      jest.spyOn(profileRepo, 'save').mockResolvedValueOnce(profile as any);

      const result = await service.updateProfile(updateDto as any);

      expect(result.message).toBe('Profile updated successfully');
    });
  });
});