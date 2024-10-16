import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { db } from '../index';

import { JwtPayload } from './common/enums/jwt.enum';
import { CreateAuthDto } from './dto/create-auth.dto';
import { usersTable } from 'src/db/schema';
import { LoginDto } from './dto/login-auth.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('DB_CONNECTION') private readonly dbService: typeof db,
  ) {}

  async create(createAuthDto: CreateAuthDto) {
    const { name, email, password } = createAuthDto;
    try {
      await (await this.dbService).insert(usersTable).values({
        id: uuidv4(),
        password: bcrypt.hashSync(password, 10),
        email,
        name,
      });

      return {
        msg: 'User created successfully',
        token: await this.signJWT({ email }),
      };
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    try {
      const user = await (await this.dbService)
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        throw new NotFoundException(`User not found`);
      }

      const isHashedPassword = bcrypt.compareSync(password, user[0].password);

      if (!isHashedPassword)
        throw new BadRequestException(`Incorrect password`);

      return {
        msg: 'Successful login',
        token: await this.signJWT({ email }),
      };
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async signJWT(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    console.log(token);
    return token;
  }
}
