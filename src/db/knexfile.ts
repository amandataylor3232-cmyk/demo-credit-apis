import type { Knex } from 'knex';
import { getMysqlConnectionOptions } from './mysql-connection';

const isCompiled = __filename.endsWith('.js');

const migrations = {
  directory: `${__dirname}/migrations`,
  extension: isCompiled ? 'js' : 'ts',
};

const mysqlConfig: Knex.Config = {
  client: 'mysql2',
  connection: getMysqlConnectionOptions() as Knex.MySql2ConnectionConfig,
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
