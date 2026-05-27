import { db } from '../db';
import { assertNotBlacklisted } from './karma.service';
import { generateAccessToken } from '../utils/token';
import { AppError } from '../utils/errors';
import type { RegisterUserInput } from '../validators/wallet.validator';
import type { User } from '../types';

export type RegisteredUser = {
  user: Omit<User, 'access_token'>;
  accessToken: string;
};

export const registerUser = async (
  input: RegisterUserInput
): Promise<RegisteredUser> => {
  const existingUser = await db('users')
    .where({ email: input.email })
    .orWhere({ phone: input.phone })
    .orWhere({ bvn: input.bvn })
    .first();

  if (existingUser) {
    throw new AppError('A user with these details already exists', 409);
  }

  try {
    await assertNotBlacklisted([input.email, input.phone, input.bvn]);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'Karma blacklist check failed';
    throw new AppError(message, 403);
  }

  const accessToken = generateAccessToken();

  const [userId] = await db('users').insert({
    name: input.name,
    email: input.email,
    phone: input.phone,
    bvn: input.bvn,
    access_token: accessToken,
  });

  await db('wallets').insert({
    user_id: userId,
    balance: 0,
  });

  const user = await db('users').where({ id: userId }).first<User>();

  if (!user) {
    throw new AppError('Unable to create user account', 500);
  }

  const { access_token: _token, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
  };
};

export const getUserProfile = async (userId: number) => {
  const user = await db('users').where({ id: userId }).first<User>();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const wallet = await db('wallets').where({ user_id: userId }).first();

  const { access_token: _token, ...safeUser } = user;

  return {
    user: safeUser,
    wallet: wallet
      ? {
          id: wallet.id,
          balance: Number(wallet.balance),
        }
      : null,
  };
};

export const findUserByToken = async (
  token: string
): Promise<User | undefined> =>
  db('users').where({ access_token: token }).first<User>();
