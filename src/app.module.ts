import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { Mail } from './mail/mail';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [Mail],
})
export class AppModule {}
