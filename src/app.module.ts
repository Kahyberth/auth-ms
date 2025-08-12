import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { Mail } from './mail/mail';
import { TeamsModule } from './teams/teams.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './auth/common/envs';
import { Profile } from './auth/entities/profile.entity';
import { Role } from './auth/entities/role.entity';
import { UsersRole } from './auth/entities/users_roles.entity';
import { User } from './auth/entities/users.entity';
import { Team, UsersTeam } from './teams/entities';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    AuthModule,
    TeamsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.DB_HOST,
      port: 5433,
      username: envs.DB_USERNAME,
      password: envs.DB_PASSWORD,
      database: envs.DB_DATABASE,
      synchronize: true,
      entities: [Profile, Role, UsersRole, User, Team, UsersTeam],
    }),
    SocketModule,
  ],
  controllers: [],
  providers: [Mail],
})
export class AppModule {}
