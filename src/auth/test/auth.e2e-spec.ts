import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport, ClientsModule, ClientProxy } from '@nestjs/microservices';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { envs } from '../common/envs';
import { User } from '../entities/users.entity';
import { Profile } from '../entities/profile.entity';
import { Role, RoleEnum } from '../entities/role.entity';
import { UsersRole } from '../entities/users_roles.entity';
import { CreateAuthDto } from '../dto/create-auth.dto';
import { LoginDto } from '../dto/login-auth.dto';
import { Mail } from '../../mail/mail';
import { Team, UsersTeam } from '../../teams/entities';
import { AuthModule } from '../auth.module';
import { TeamsModule } from '../../teams/teams.module';


jest.mock('../../mail/mail', () => {
  return {
    Mail: jest.fn().mockImplementation(() => ({
      sendGreetingsToUser: jest.fn().mockResolvedValue({
        messageId: 'mock-message-id',
        response: 'Mock email sent successfully'
      }),
      sendInvitationLink: jest.fn().mockResolvedValue({
        messageId: 'mock-invitation-id',
        response: 'Mock invitation sent successfully'
      }),
    })),
  };
});

describe('AuthController - User Registration (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  let userRepository: Repository<User>;
  let profileRepository: Repository<Profile>;
  let roleRepository: Repository<Role>;
  let userRoleRepository: Repository<UsersRole>;
  let mockMailService: jest.Mocked<Mail>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT) || 5432,
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'admin123',
          database: process.env.TEST_DB_DATABASE || 'postgres',
          synchronize: true,
          dropSchema: true, 
          entities: [Profile, Role, UsersRole, User, Team, UsersTeam],
         
        }),
        AuthModule,
        TeamsModule,
        ClientsModule.register([
          {
            name: 'AUTH_SERVICE',
            transport: Transport.NATS,
            options: {
              servers: envs.NATS_SERVERS,
            },
          },
        ]),
      ],
    })
    .overrideProvider(Mail)
    .useValue({
      sendGreetingsToUser: jest.fn().mockResolvedValue({
        messageId: 'mock-message-id',
        response: 'Mock email sent successfully'
      }),
      sendInvitationLink: jest.fn().mockResolvedValue({
        messageId: 'mock-invitation-id', 
        response: 'Mock invitation sent successfully'
      }),
    })
    .compile();

    app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: {
        servers: envs.NATS_SERVERS,
      },
    });

  
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    client = moduleFixture.get('AUTH_SERVICE');
    mockMailService = moduleFixture.get(Mail);
    
 
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    profileRepository = moduleFixture.get<Repository<Profile>>(getRepositoryToken(Profile));
    roleRepository = moduleFixture.get<Repository<Role>>(getRepositoryToken(Role));
    userRoleRepository = moduleFixture.get<Repository<UsersRole>>(getRepositoryToken(UsersRole));
    
    await app.listen();
    await client.connect();


    await new Promise(resolve => setTimeout(resolve, 1000));

    await setupDefaultRole();
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await client.close();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const createAuthDto: CreateAuthDto = {
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@test.com',
        password: 'password123',
        company: 'Test Company',
        phone: '+57123456789'
      };

      const result = await client.send('auth.register.user', createAuthDto).toPromise();

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(createAuthDto.email);
      expect(result.user.name).toBe(createAuthDto.name);
      expect(result.user.lastName).toBe(createAuthDto.lastName);
      expect(result.user.company).toBe(createAuthDto.company);
      expect(result.user.isActive).toBe(true);
      expect(result.user.image).toContain('gravatar.com');
      expect(result.user.id).toBeDefined();

      expect(mockMailService.sendGreetingsToUser).toHaveBeenCalledWith(createAuthDto.email);

  
      const savedUser = await userRepository.findOne({ 
        where: { email: createAuthDto.email },
        relations: ['profile', 'userRoles']
      });

      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe(createAuthDto.name);
      expect(savedUser.lastName).toBe(createAuthDto.lastName);
      expect(savedUser.password).not.toBe(createAuthDto.password);
      expect(savedUser.profile).toBeDefined();
      expect(savedUser.userRoles).toHaveLength(1);
    }, 30000);

    it('should register user without optional phone field', async () => {
      const createAuthDto: CreateAuthDto = {
        name: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@test.com',
        password: 'password123',
        company: 'Another Company'
      };

      const result = await client.send('auth.register.user', createAuthDto).toPromise();

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(createAuthDto.email);
      expect(result.user.lastName).toBe(createAuthDto.lastName);

      
      const savedUser = await userRepository.findOne({ 
        where: { email: createAuthDto.email }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser.phone).toBe('');
      expect(savedUser.lastName).toBe(createAuthDto.lastName);
    }, 30000);

    it('should create user profile with correct default values', async () => {
      const createAuthDto: CreateAuthDto = {
        name: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@test.com',
        password: 'password123',
        company: 'Profile Test Company',
        phone: '+57987654321'
      };

      await client.send('auth.register.user', createAuthDto).toPromise();

      const savedUser = await userRepository.findOne({ 
        where: { email: createAuthDto.email },
        relations: ['profile']
      });

      expect(savedUser).toBeDefined();
      const profile = savedUser.profile;
      expect(profile).toBeDefined();
      expect(profile.bio).toBe('');
      expect(profile.profile_picture).toContain('gravatar.com');
      expect(profile.profile_banner).toBe('');
      expect(profile.education).toBe('');
      expect(profile.experience).toBe('');
      expect(profile.isBlocked).toBe(false);
      expect(profile.isVerified).toBe(false);
      expect(profile.skills).toBe('');
      expect(profile.location).toBe('');
      expect(profile.social_links).toBe('');
      expect(profile.availabilityStatus).toBe('Online');
      expect(profile.timezone).toBeNull();
    }, 30000);

    it('should assign default user role', async () => {
      const createAuthDto: CreateAuthDto = {
        name: 'Ana',
        lastName: 'López',
        email: 'ana.lopez@test.com',
        password: 'password123',
        company: 'Role Test Company'
      };

      await client.send('auth.register.user', createAuthDto).toPromise();

      const savedUser = await userRepository.findOne({ 
        where: { email: createAuthDto.email },
        relations: ['userRoles', 'userRoles.role']
      });

      expect(savedUser).toBeDefined();
      expect(savedUser.userRoles).toHaveLength(1);
      expect(savedUser.userRoles[0].role.role).toBe(RoleEnum.User);
      expect(savedUser.userRoles[0].joinedAt).toBeDefined();
    }, 30000);
  });

  describe('Integration with Login', () => {
    it('should allow login after successful registration', async () => {
      const createAuthDto: CreateAuthDto = {
        name: 'Login',
        lastName: 'Test',
        email: 'login.test@test.com',
        password: 'password123',
        company: 'Login Test Company'
      };

      const registerResult = await client.send('auth.register.user', createAuthDto).toPromise();
      expect(registerResult).toBeDefined();

      const loginDto: LoginDto = {
        email: createAuthDto.email,
        password: createAuthDto.password
      };

      const loginResult = await client.send('auth.login.user', loginDto).toPromise();

      expect(loginResult).toBeDefined();
      expect(loginResult.data).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.data.email).toBe(createAuthDto.email);
      expect(loginResult.status).toBe(200);
    }, 30000);
  });


  async function setupDefaultRole() {
    try {
      const existingRole = await roleRepository.findOne({ 
        where: { role: RoleEnum.User } 
      });

      if (!existingRole) {
        const defaultRole = roleRepository.create({
          id: 'user-role-id',
          role: RoleEnum.User,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await roleRepository.save(defaultRole);
        console.log('Default role created successfully');
      } else {
        console.log('Default role already exists');
      }
    } catch (error) {
      console.error('Error setting up default role:', error);
    }
  }

  async function cleanupTestData() {
    try {
      await userRoleRepository.delete({});
      await profileRepository.delete({});
      await userRepository.delete({});
      
      console.log('Test data cleaned successfully');
    } catch (error) {
      console.error('Error cleaning test data:', error);
    }
  }

  async function cleanupAllTestData() {
    try {
      const entities = [userRoleRepository, profileRepository, userRepository];
      
      for (const repository of entities) {
        await repository.query(`TRUNCATE TABLE ${repository.metadata.tableName} RESTART IDENTITY CASCADE`);
      }
      
      console.log('All test data cleaned successfully');
    } catch (error) {
      console.error('Error in final cleanup:', error);
      try {
        await userRoleRepository.delete({});
        await profileRepository.delete({});
        await userRepository.delete({});
      } catch (fallbackError) {
        console.error('Fallback cleanup also failed:', fallbackError);
      }
    }
  }
});