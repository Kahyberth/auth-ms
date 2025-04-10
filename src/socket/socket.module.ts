import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { TeamsModule } from 'src/teams/teams.module';

@Module({
  providers: [SocketGateway, SocketService],
  imports: [TeamsModule]
})
export class SocketModule {}
