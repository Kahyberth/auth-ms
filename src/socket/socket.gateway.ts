import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { SocketService } from './socket.service';
import { Socket } from 'socket.io';


@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  private connectedUsers = new Map<string, string>();
  private teams = new Map<string, string[]>();
  
  
  constructor(private readonly socketService: SocketService) {}




  handleConnection(client: any, ...args: any[]) {
    throw new Error('Method not implemented.');
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.connectedUsers.forEach((socket, socket_user_id) => {
      if (socket_user_id === userId) {
        this.connectedUsers.delete(socket);
      }
    });
  }


  //TODO: Recordar consultar los equipos al que pertenece el usuario y emitir el evento 'team_connected' a todos los usuarios conectados al equipo
  @SubscribeMessage('team_connected')
  handleTeamConnected(@MessageBody() data: any, client: Socket) {
    const userId = data.userId;
    const teamId = data.teamId;
    this.teams.set(teamId, [userId]);
    client.join(teamId);
    client.emit('team_connected', { teamId });
  }

  //TODO: Implementar la logica para cuando un usuario se conecta, emitiendo el evento 'user_connected' a todos los usuarios conectados
  @SubscribeMessage('user_connected')
  handleUserConnected(@MessageBody() data: any, client: Socket) {
    const userId = data.userId;
    this.connectedUsers.set(userId, client.id);
    client.emit('user_connected', { userId });
  }





 
}
