import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { Mail } from 'src/mail/mail';
//import { db } from '../../index';
import { CreateAuthDto } from '../dto/create-auth.dto';
import { LoginDto } from '../dto/login-auth.dto';
//import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  //let mailService: Mail;
  //let dbService: typeof db;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('testToken'),
            verify: jest.fn(),
          },
        },
        {
          provide: Mail,
          useValue: { sendOtpEmail: jest.fn() },
        },
        {
          provide: 'DB_CONNECTION',
          useValue: { select: jest.fn(), insert: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    //mailService = module.get<Mail>(Mail);
    //dbService = module.get<typeof db>('DB_CONNECTION');
  });

  describe('create', () => {
    it('should throw an error if user already exists', async () => {
      jest.spyOn(authService, 'findOneBy').mockResolvedValue([
        {
          email: 'test@example.com',
          name: '',
          id: '',
          password: '',
          rol: 'user',
          isActive: 0,
        },
      ]);

      const createAuthDto: CreateAuthDto = {
        name: 'John',
        email: 'test@example.com',
        password: 'password',
        rol: [],
      };

      await expect(authService.create(createAuthDto)).rejects.toThrow(
        RpcException,
      );
    });

    // it('should create a new user and return a token', async () => {
    //   jest.spyOn(authService, 'findOneBy').mockResolvedValue([]);
    //   jest.spyOn(dbService, 'insert').mockResolvedValue(undefined);
    //   const createAuthDto: CreateAuthDto = {
    //     name: 'John',
    //     email: 'john@example.com',
    //     password: 'password',
    //     rol: [],
    //   };

    //   const result = await authService.create(createAuthDto);

    //   expect(result).toEqual({
    //     msg: 'User created successfully',
    //     token: 'testToken',
    //   });
    //   expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
    //     'john@example.com',
    //     '123456',
    //   );
    // });
  });

  describe('login', () => {
    it('should throw an error if user is not found', async () => {
      jest.spyOn(authService, 'findOneBy').mockResolvedValue([]);

      const loginDto: LoginDto = {
        email: 'notfound@example.com',
        password: 'password',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(RpcException);
    });

    it('should return a success message if login is successful', async () => {
      const hash = bcrypt.hashSync('password', 10);
      jest.spyOn(authService, 'findOneBy').mockResolvedValue([
        {
          email: 'john@example.com',
          password: hash,
          name: '',
          id: '',
          rol: 'user',
          isActive: 0,
        },
      ]);

      const loginDto: LoginDto = {
        email: 'john@example.com',
        password: 'password',
      };

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        msg: 'Successful login',
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify and return a new token', async () => {
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ email: 'john@example.com' });

      const result = await authService.verifyToken('validToken');

      expect(result).toEqual({
        user: { email: 'john@example.com' },
        token: 'testToken',
      });
    });

    it('should throw an RpcException if token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken('invalidToken')).rejects.toThrow(
        RpcException,
      );
    });
  });
});
