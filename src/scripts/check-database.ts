import mysql from 'mysql2/promise';
import { assertMysqlDbConfig, getMysqlConnectionOptions } from '../db/mysql-connection';

const run = async (): Promise<void> => {
  assertMysqlDbConfig();

  const connection = await mysql.createConnection(getMysqlConnectionOptions());
  await connection.query('SELECT 1');
  await connection.end();

  console.log('Database connection OK.');
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
