import fs from 'fs';
import path from 'path';
import type { ConnectionOptions } from 'mysql2';
import { env } from '../config/env';

function projectRoot(): string {
  return path.resolve(__dirname, '../..');
}

export function assertMysqlDbConfig(): void {
  const host = env.db.host.toLowerCase();

  if (host.includes('clickhouse')) {
    throw new Error(
      [
        'DB_HOST points to Aiven ClickHouse, but this app uses the MySQL protocol.',
        'Open https://console.aiven.io/ → your MySQL service (hostname must start with mysql-).',
        'Copy Host, Port, User, Password, and Database from Overview into .env.',
        'Download the CA certificate to certs/aiven-ca.pem and set DB_SSL_CA=certs/aiven-ca.pem.',
      ].join('\n')
    );
  }

  if (env.db.ssl && env.db.sslCa) {
    const caPath = path.isAbsolute(env.db.sslCa)
      ? env.db.sslCa
      : path.resolve(projectRoot(), env.db.sslCa);

    if (!fs.existsSync(caPath)) {
      throw new Error(
        [
          `DB_SSL_CA file not found: ${caPath}`,
          'Download the CA certificate from Aiven Console → your MySQL service → Overview → Connection information → CA certificate.',
          `Save it as: ${caPath}`,
          'See certs/README.md for step-by-step instructions.',
        ].join('\n')
      );
    }
  }
}

export function getMysqlSslConfig(): ConnectionOptions['ssl'] | undefined {
  if (!env.db.ssl) {
    return undefined;
  }

  const ssl: ConnectionOptions['ssl'] = { rejectUnauthorized: true };

  if (env.db.sslCa) {
    const caPath = path.isAbsolute(env.db.sslCa)
      ? env.db.sslCa
      : path.resolve(projectRoot(), env.db.sslCa);
    ssl.ca = fs.readFileSync(caPath);
  }

  return ssl;
}

export function getMysqlConnectionOptions(
  includeDatabase = true
): ConnectionOptions {
  if (process.env.NODE_ENV !== 'test') {
    assertMysqlDbConfig();
  }

  const options: ConnectionOptions = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    ssl: getMysqlSslConfig(),
  };

  if (includeDatabase) {
    options.database = env.db.name;
  }

  return options;
}
