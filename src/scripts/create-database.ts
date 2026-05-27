import mysql from 'mysql2/promise';
import { env } from '../config/env';

const run = async (): Promise<void> => {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await connection.end();

  console.log(`Database "${env.db.name}" is ready.`);
};

run().catch((error) => {
  console.error('Failed to create database.');
  console.error(error.message);
  process.exit(1);
});
