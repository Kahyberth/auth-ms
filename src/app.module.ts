import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { Mail } from './mail/mail';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [AuthModule, TeamsModule],
  controllers: [],
  providers: [Mail],
})
export class AppModule {}
