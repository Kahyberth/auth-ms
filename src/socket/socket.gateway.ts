import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { envs } from 'src/auth/common/envs';
import { UserTeams } from './interface/socket.interface';
import { TeamsService } from 'src/teams/teams.service';



@WebSocketGateway({
  cors: {
    origin: envs.ORIGIN_CORS,
    credetials: true
  }
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  


  private connectedUsers = new Map<string, string>();
  private teams = new Map<string, UserTeams[]>();
  
  
  constructor(
    private readonly teamService: TeamsService
  ) {}
  
  @WebSocketServer() server: Server;

  handleConnection(client: any, ...args: any[]) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.connectedUsers.forEach((socket, socket_user_id) => {
      if (socket_user_id === userId) {
        this.connectedUsers.delete(userId);
      }
    });
  }

  @SubscribeMessage('say_hello')
  handleHello(client: Socket, data: any) {
    console.log('Hello event received:', data);
    client.emit('hello', { message: 'Hello from server!' });
  }



  @SubscribeMessage('team_connected')
  async handleTeamConnected(client: Socket) {
    console.log('User connected:', client.id);
    const userId = client.handshake.query.userId as string;
    const userTeams = await this.getUserTeams(userId);
    this.teams.set(userId, userTeams);
    userTeams.forEach(team => {
      client.join(team.id);
    });
    this.server.to([...userTeams.map(team => team.id)]).emit('team_connected');
  }


  private async getUserTeams(userId: string): Promise<UserTeams[]> {
    const teams = await this.teamService.getTeamsForUser(userId);
    return teams;
  }

  //TODO: Implementar la logica para cuando un usuario se conecta, emitiendo el evento 'user_connected' a todos los usuarios conectados
  @SubscribeMessage('user_connected')
  handleUserConnected(@MessageBody() data: any, client: Socket) {
    const userId = data.userId;
    this.connectedUsers.set(userId, client.id);
    client.emit('user_connected', { userId });
  }





 
}
