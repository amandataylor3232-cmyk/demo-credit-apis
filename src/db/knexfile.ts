import type { Knex } from 'knex';
import { env } from '../config/env';

const isCompiled = __filename.endsWith('.js');

const migrations = {
  directory: `${__dirname}/migrations`,
  extension: isCompiled ? 'js' : 'ts',
};

const mysqlConnection: Knex.StaticConnectionConfig = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
};

if (env.db.ssl) {
  mysqlConnection.ssl = { rejectUnauthorized: true };
}

const mysqlConfig: Knex.Config = {
  client: 'mysql2',
  connection: mysqlConnection,
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
