import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { Mail } from './mail/mail';
import { TeamsModule } from './teams/teams.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './auth/common/envs';

@Module({
  imports: [
    AuthModule,
    TeamsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.DB_HOST,
      port: 5432,
      username: envs.DB_USERNAME,
      password: envs.DB_PASSWORD,
      database: envs.DB_DATABASE,
      synchronize: true,
      extra: {
        ssl: true,
      },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
  ],
  controllers: [],
  providers: [Mail],
})
export class AppModule {}
