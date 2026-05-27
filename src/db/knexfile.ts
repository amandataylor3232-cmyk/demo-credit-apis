import type { Knex } from 'knex';
import { env } from '../config/env';

const migrations = {
  directory: `${__dirname}/migrations`,
  extension: 'ts',
};

const mysqlConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
  },
  migrations,
};

const sqliteConfig: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: ':memory:',
  },
  useNullAsDefault: true,
  migrations,
};

const config: Record<string, Knex.Config> = {
  development: mysqlConfig,
  production: mysqlConfig,
  test: sqliteConfig,
};

export default config;
