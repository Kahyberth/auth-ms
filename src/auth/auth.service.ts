import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as md5 from 'md5';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Repository } from 'typeorm';
import { AvailabilityStatus, Profile } from './entities/profile.entity';
import { Role, RoleEnum } from './entities/role.entity';
import { UsersRole } from './entities/users_roles.entity';
import { LoginDto } from './dto/login-auth.dto';
import { envs } from './common/envs';
import { Mail } from '../mail/mail';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
    @Inject(Mail)
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

      await this.mailService.sendGreetingsToUser(user.email);

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

      const payload = { id: user.id };

      console.log(payload);

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
        refreshToken: this.jwtService.sign(payload, { expiresIn: '1d' }),
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

  async findOneById(id: string) {
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
      this.logger.error('Error en findOneById', error.stack);

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
        where: { id: payload.id },
      });

      if (!user) {
        throw new RpcException({
          message: 'Usuario no encontrado',
          code: HttpStatus.UNAUTHORIZED,
        });
      }

      const newPayload = { id: user.id };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '10m',
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

      console.log(payload);

      const user = await this.userRepository.findOne({
        where: { id: payload.id },
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

  async updateProfile(updateProfileDto: UpdateProfileDto) {
    try {
      const { userId, bio, location, skills, social_links, experience, education, profile_picture, profile_banner, phone, company } = updateProfileDto;

      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['profile']
      });

      if (!user) {
        throw new RpcException({
          message: 'User not found.',
          code: HttpStatus.NOT_FOUND,
        });
      }

      if (phone !== undefined) {
        user.phone = phone;
      }
      
      if (company !== undefined) {
        user.company = company;
      }
      
      await this.userRepository.save(user);

      const profile = user.profile;

      if (bio !== undefined) profile.bio = bio;
      if (location !== undefined) profile.location = location;
      if (skills !== undefined) profile.skills = skills;
      if (experience !== undefined) profile.experience = experience;
      if (education !== undefined) profile.education = education;
      if (social_links !== undefined) profile.social_links = social_links;
      if (profile_picture !== undefined) profile.profile_picture = profile_picture;
      if (profile_banner !== undefined) profile.profile_banner = profile_banner;
      
      profile.updatedAt = new Date();

      await this.profileRepository.save(profile);

      return {
        message: 'Profile updated successfully',
        status: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('Error in updateProfile', error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        message: 'Internal server error. Please try again later.',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
