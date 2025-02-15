import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { UsersTeam } from './entities/users_team.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService],
  imports: [TypeOrmModule.forFeature([Team, UsersTeam]), AuthModule],
})
export class TeamsModule {}
