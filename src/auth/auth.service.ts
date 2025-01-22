import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { db } from '../index';

import { JwtPayload } from './common/enums/jwt.enum';
import { CreateAuthDto } from './dto/create-auth.dto';
import { profile, usersTable } from 'src/db/schema';
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
    const { name, email, password, lastName, company } = createAuthDto;

    const isUser = await this.findOneBy(email);

    if (isUser.length > 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `User whit email: ${email} already created`,
      });
    }

    const userId = uuidv4();

    try {
      const salt = bcrypt.genSaltSync(+envs.SALT);
      await (await this.dbService).insert(usersTable).values({
        email,
        id: userId,
        isActive: false,
        isAvailable: true,
        lastName,
        company,
        name,
        password: bcrypt.hashSync(password, salt),
      });

      await (await this.dbService).insert(profile).values({
        id: uuidv4(),
        isBlocked: false,
        isVerified: false,
        userId,
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
      data: {
        email: user[0].email,
        name: user[0].name,
        lastName: user[0].lastName,
        company: user[0].company,
      },
      status: HttpStatus.OK,
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

  async findOneByToken(token: string) {
    const email = (await this.verifyToken(token)).user.email;
    try {
      const user = await (await this.dbService)
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      return { user, token };
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

      const data = await this.findOneBy(user.email);

      return {
        user: {
          id: data[0].id,
          email: data[0].email,
          name: data[0].name,
          lastName: data[0].lastName,
          company: data[0].company,
        },
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
