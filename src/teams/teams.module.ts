import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { UsersTeam } from './entities/users_team.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Mail } from 'src/mail/mail';
import { JwtModule } from '@nestjs/jwt';
import { envs } from 'src/auth/common/envs';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, Mail],
  imports: [JwtModule.register({
        global: true,
        secret: envs.JWT_SECRET,
        signOptions: { expiresIn: '10m' },
      }), TypeOrmModule.forFeature([Team, UsersTeam]), AuthModule],
})
export class TeamsModule {}
