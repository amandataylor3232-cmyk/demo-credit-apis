import { randomBytes } from 'crypto';

export const generateAccessToken = (): string =>
  randomBytes(32).toString('hex');
