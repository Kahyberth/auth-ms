import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @MessagePattern('auth.create.team')
  create(@Payload() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @MessagePattern('auth.get.all.teams')
  findAll() {
    return this.teamsService.findAll();
  }

  @MessagePattern('findOneTeam')
  findOne(@Payload() id: string) {
    return this.teamsService.findOne(id);
  }

  @MessagePattern('updateTeam')
  update(@Payload() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(updateTeamDto.id, updateTeamDto);
  }

  @MessagePattern('removeTeam')
  remove(@Payload() id: string) {
    return this.teamsService.remove(id);
  }
}
