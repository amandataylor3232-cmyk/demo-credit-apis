import path from 'path';
import dotenv from 'dotenv';

// Knex changes cwd to src/db during migrations; always load root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  adjutor: {
    baseUrl: process.env.ADJUTOR_BASE_URL ?? 'https://adjutor.lendsqr.com/v2',
    apiKey: process.env.ADJUTOR_API_KEY ?? '',
  },
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'demo_credit_wallet',
    ssl: process.env.DB_SSL === 'true',
    sslCa: process.env.DB_SSL_CA ?? '',
  },
};
