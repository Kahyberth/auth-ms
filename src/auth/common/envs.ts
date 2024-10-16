import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    TURSO_DATABASE_URL: joi.string().required(),
    TURSO_AUTH_TOKEN: joi.string().required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  PORT: envVars.PORT,
  TURSO_DATABASE_URL: envVars.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: envVars.TURSO_AUTH_TOKEN,
  JWT_SECRET: envVars.JWT_SECRET,
};
