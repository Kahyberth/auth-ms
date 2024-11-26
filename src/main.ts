import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { envs } from './auth/common/envs';

async function bootstrap() {
  const logger = new Logger('Auth-ms');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: ['nats://localhost:4222'],
      },
    },
  );
  await app.listen().then(() => {
    logger.log(`Auth-ms is listening on ${envs.PORT}`);
  });
}
bootstrap();
