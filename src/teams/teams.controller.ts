import { Controller } from '@nestjs/common';
// import { MessagePattern, Payload } from '@nestjs/microservices';
import { TeamsService } from './teams.service';
// import { CreateTeamDto } from './dto/create-team.dto';
// import { UpdateTeamDto } from './dto/update-team.dto';

@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}
}
