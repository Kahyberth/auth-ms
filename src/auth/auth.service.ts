import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { db } from '../index';

import { JwtPayload } from './common/enums/jwt.enum';
import { CreateAuthDto } from './dto/create-auth.dto';
import { usersTable } from 'src/db/schema';
import { LoginDto } from './dto/login-auth.dto';
import { eq } from 'drizzle-orm';
import { RpcException } from '@nestjs/microservices';
import { envs } from './common/envs';
import { Mail } from 'src/mail/mail';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: Mail,
    @Inject('DB_CONNECTION') private readonly dbService: typeof db,
  ) {}

  async create(createAuthDto: CreateAuthDto) {
    const { name, email, password } = createAuthDto;

    const isUser = await this.findOneBy(email);

    if (isUser.length > 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `User whit emai: ${email} already created`,
      });
    }

    try {
      const salt = bcrypt.genSaltSync(+envs.SALT);
      await (await this.dbService).insert(usersTable).values({
        id: uuidv4(),
        password: bcrypt.hashSync(password, salt),
        email,
        name,
      });

      await this.mailService.sendOtpEmail(email, '123456');

      return {
        msg: 'User created successfully',
        token: await this.signJWT({ email }),
      };
    } catch (error) {
      throw new RpcException({
        message: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.findOneBy(email);

    if (user.length === 0)
      throw new RpcException({
        message: `User not found`,
        status: HttpStatus.NOT_FOUND,
      });

    const isHashedPassword = bcrypt.compareSync(password, user[0].password);

    if (!isHashedPassword) {
      throw new RpcException({
        message: `Incorrect password`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return {
      msg: 'Successful login',
      token: await this.signJWT({ email }),
    };
  }

  async findOneBy(email: string) {
    try {
      const user = await (await this.dbService)
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      return user;
    } catch (error) {
      throw new RpcException({
        message: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async signJWT(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async verifyToken(token: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.JWT_SECRET,
      });

      return {
        user,
        token: await this.signJWT(user),
      };
    } catch (error) {
      throw new RpcException({
        message: error,
        status: 401,
      });
    }
  }
}
