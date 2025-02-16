import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { envs } from './common/envs';
import { Mail } from 'src/mail/mail';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRole } from './entities/users_roles.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/users.entity';
import { Profile } from './entities/profile.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService, Mail],
  imports: [
    JwtModule.register({
      global: true,
      secret: envs.JWT_SECRET,
      signOptions: { expiresIn: '5m' },
    }),
    TypeOrmModule.forFeature([UsersRole, Role, User, Profile]),
  ],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}
