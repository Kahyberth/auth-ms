import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as md5 from 'md5';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RpcException } from '@nestjs/microservices';
import { Mail } from 'src/mail/mail';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { AvailabilityStatus, Profile } from './entities/profile.entity';
import { Role, RoleEnum } from './entities/role.entity';
import { UsersRole } from './entities/users_roles.entity';
import { LoginDto } from './dto/login-auth.dto';
import { envs } from './common/envs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UsersRole)
    private readonly userRoleRepository: Repository<UsersRole>,
    private readonly jwtService: JwtService,
    private readonly mailService: Mail,
  ) {}

  async createUser(data: CreateAuthDto) {
    try {
      const { password, company, email, lastName, name, phone } = data;

      this.logger.debug('Datos recibidos para registro', data);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        name,
        lastName,
        phone: phone || '',
        password: hashedPassword,
        email,
        createdAt: new Date(),
        language: 'es',
        isActive: true,
        isAvailable: true,
        updatedAt: new Date(),
        company,
      });

      await this.userRepository.save(user);

      const profile = this.profileRepository.create({
        bio: '',
        userId: user.id,
        profile_picture: `https://www.gravatar.com/avatar/${md5(
          user.email.trim().toLowerCase(),
        )}?s=200&d=identicon`,
        profile_banner: '',
        updatedAt: new Date(),
        education: '',
        experience: '',
        isBlocked: false,
        availabilityStatus: AvailabilityStatus.Online,
        isVerified: false,
        skills: '',
        location: '',
        social_links: '',
        timezone: null,
      });

      await this.profileRepository.save(profile);

      const defaultRole = await this.roleRepository.findOne({
        where: { role: RoleEnum.User },
      });
      if (defaultRole) {
        const userRole = this.userRoleRepository.create({
          roleId: defaultRole.id,
          userId: user.id,
          joinedAt: new Date(),
        });
        await this.userRoleRepository.save(userRole);
      }

      delete user.password;

      return {
        user: {
          company: user.company,
          email: user.email,
          lastName: user.lastName,
          name: user.name,
          id: user.id,
          isActive: user.isActive,
          image: profile.profile_picture,
        },
      };
    } catch (error) {
      this.logger.error('Error en createUser', error.stack);

      if (error.code && error.code === 'SQLITE_CONSTRAINT') {
        if (
          error.message.includes('UNIQUE constraint failed: users_table.email')
        ) {
          throw new RpcException({
            message: 'El correo ya está en uso.',
            code: HttpStatus.CONFLICT,
          });
        }
      }

      throw new RpcException({
        message:
          'Error interno del servidor. Por favor, intente de nuevo más tarde.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async profile(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['profile'],
      });

      if (!user) {
        throw new RpcException({
          message: 'Usuario no encontrado.',
          code: HttpStatus.NOT_FOUND,
        });
      }

      return user;
    } catch (error) {
      this.logger.error('Error en profile', error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        message: 'Error interno del servidor. Por favor, intente más tarde.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async login(data: LoginDto) {
    try {
      const { email, password } = data;

      this.logger.debug('Datos recibidos para login', data);

      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new RpcException({
          message: 'Correo o contraseña incorrectos.',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        throw new RpcException({
          message: 'Correo o contraseña incorrectos.',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      delete user.password;

      const payload = { sub: user.id, email: user.email, name: user.name };

      return {
        data: {
          company: user.company,
          email: user.email,
          lastName: user.lastName,
          name: user.name,
          id: user.id,
          isActive: user.isActive,
        },
        status: HttpStatus.OK,
        accessToken: this.jwtService.sign(payload),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      };
    } catch (error) {
      this.logger.error('Error en login', error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        message: 'Error interno del servidor. Por favor, intente más tarde.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findOne(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['profile'],
      });

      if (!user) {
        throw new RpcException({
          message: 'Usuario no encontrado.',
          code: HttpStatus.NOT_FOUND,
        });
      }

      return user;
    } catch (error) {
      this.logger.error('Error en findOneBy', error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        message: 'Error interno del servidor. Por favor, intente más tarde.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: envs.JWT_SECRET,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new RpcException({
          message: 'Usuario no encontrado',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      const newPayload = { sub: user.id, email: user.email, name: user.name };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      this.logger.error('Error en refreshToken', error.stack);

      if (
        error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError'
      ) {
        throw new RpcException({
          message: 'Refresh token inválido o expirado',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      throw new RpcException({
        message: 'Error interno del servidor. Por favor, intente más tarde.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: envs.JWT_SECRET,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new RpcException({
          message: 'Usuario no encontrado',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      delete user.password;

      return { valid: true, user };
    } catch (error) {
      this.logger.error('Error en verifyToken', error.stack);

      if (
        error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError'
      ) {
        throw new RpcException({
          message: 'Token inválido o expirado',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      throw new RpcException({
        message: 'Error interno del servidor',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
