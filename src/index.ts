import 'dotenv/config';
import { drizzle } from 'drizzle-orm/connect';
import { envs } from './auth/common/envs';

export const db = drizzle('turso', {
  connection: {
    url: envs.TURSO_DATABASE_URL,
    authToken: envs.TURSO_AUTH_TOKEN,
  },
});
