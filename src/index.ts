import 'dotenv/config';
import { drizzle } from 'drizzle-orm/connect';
import { envs } from './auth/common/envs';

async function main() {
  // You can specify any property from the libsql connection options
  const db = await drizzle('turso', {
    connection: {
      url: envs.TURSO_AUTH_TOKEN,
      authToken: envs.TURSO_AUTH_TOKEN,
    },
  });
}

main();
