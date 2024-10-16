import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { envs } from './common/envs';
import { db } from '../index';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'DB_CONNECTION',
      useValue: db,
    },
  ],
  imports: [
    JwtModule.register({
      global: true,
      secret: envs.JWT_SECRET,
      signOptions: { expiresIn: '3m' },
    }),
  ],
})
export class AuthModule {}
