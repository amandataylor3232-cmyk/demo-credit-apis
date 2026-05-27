import 'ts-node/register';

process.env.NODE_ENV = 'test';
process.env.ADJUTOR_API_KEY = '';

import { db } from '../db';

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db('transactions').del();
  await db('wallets').del();
  await db('users').del();
});
