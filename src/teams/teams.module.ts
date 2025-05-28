import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { UsersTeam } from './entities/users_team.entity';
import { AuthModule } from '../auth/auth.module';
import { Mail } from '../mail/mail';
import { JwtModule } from '@nestjs/jwt';
import { envs } from '../auth/common/envs';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, Mail],
  imports: [
    JwtModule.register({
      global: true,
      secret: envs.JWT_SECRET,
      signOptions: { expiresIn: '10m' },
    }),
    TypeOrmModule.forFeature([Team, UsersTeam]),
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [envs.NATS_SERVERS || 'nats://localhost:4222'],
        },
      },
    ]),
    AuthModule,
  ],
  exports: [TeamsService, TypeOrmModule.forFeature([Team, UsersTeam])],
})
export class TeamsModule {}
