import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  SALT: string;
  MAIL_USERNAME: string;
  MAIL_PASSWORD: string;
  MAIL_HOST: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    TURSO_DATABASE_URL: joi.string().required(),
    TURSO_AUTH_TOKEN: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    SALT: joi.string().required(),
    MAIL_USERNAME: joi.string().required(),
    MAIL_PASSWORD: joi.string().required(),
    MAIL_HOST: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
  SALT: process.env.SALT,
  MAIL_USERNAME: process.env.MAIL_USERNAME,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_HOST: process.env.MAIL_HOST,
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
  SALT: envVars.SALT,
  MAIL_USERNAME: envVars.MAIL_USERNAME,
  MAIL_PASSWORD: envVars.MAIL_PASSWORD,
  MAIL_HOST: envVars.MAIL_HOST,
};
