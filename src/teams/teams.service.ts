import { HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { db } from '../index';
import { team, usersTable } from 'src/db/schema';
import { RpcException } from '@nestjs/microservices';
import { eq } from 'drizzle-orm';

@Injectable()
export class TeamsService {
  private readonly dbService: typeof db;
  constructor() {
    this.dbService = db;
  }

  async create(createTeamDto: CreateTeamDto) {
    const { description, name, leader_id } = createTeamDto;

    try {
      const isUser = await (await db)
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, leader_id));

      console.log(isUser);

      if (isUser.length === 0) {
        throw new RpcException({
          message: 'User not found',
          status: HttpStatus.NOT_FOUND,
        });
      }

      await (
        await this.dbService
      )
        .insert(team)
        .values({
          id: uuidv4(),
          name,
          description,
          leader_id,
        })
        .onConflictDoNothing({
          target: [team.id],
        });

      console.log('Team created successfully');

      return {
        status: HttpStatus.CREATED,
        message: 'Team created successfully',
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        message: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async findAll() {
    return await (await this.dbService).select().from(team);
  }

  async findOne(id: string) {
    const isTeam = await (await this.dbService)
      .select()
      .from(team)
      .where(eq(team.id, id));

    return isTeam[0];
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    try {
      const { description, name } = updateTeamDto;
      await (
        await this.dbService
      )
        .update(team)
        .set({
          description,
          name,
        })
        .where(eq(team.id, id));
    } catch (error) {
      throw new RpcException({
        message: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async remove(id: string) {
    try {
      await (await this.dbService).delete(team).where(eq(team.id, id));
    } catch (error) {
      throw new RpcException({
        message: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
